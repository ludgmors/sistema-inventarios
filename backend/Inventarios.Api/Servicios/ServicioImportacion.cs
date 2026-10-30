using System.Globalization;
using System.Net.Mail;
using System.Text;
using ClosedXML.Excel;
using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

/// <summary>
/// Importa catálogos desde Excel o CSV. La previsualización valida sin escribir;
/// la confirmación aplica todo en una sola transacción.
/// </summary>
public class ServicioImportacion
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioSecuencias _secuencias;
    private readonly ServicioParametros _parametros;
    private readonly ServicioBitacora _bitacora;

    public const int MaximoFilas = 5000;
    public const long MaximoBytes = 5 * 1024 * 1024;

    public ServicioImportacion(
        ContextoInventarios contexto,
        ServicioSecuencias secuencias,
        ServicioParametros parametros,
        ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _secuencias = secuencias;
        _parametros = parametros;
        _bitacora = bitacora;
    }

    // ---------------------------------------------------------------- Plantilla

    public byte[] Plantilla(string tipo)
    {
        tipo = TiposImportacion.Normalizar(tipo);
        using var libro = new XLWorkbook();
        libro.Properties.Title = $"Plantilla de importación - {tipo}";

        var hoja = libro.Worksheets.Add("Datos");
        var columnas = ColumnasPlantilla(tipo);

        for (var indice = 0; indice < columnas.Count; indice++)
        {
            var columna = indice + 1;
            var celda = hoja.Cell(1, columna);
            celda.Value = columnas[indice].Titulo;
            celda.Style.Fill.BackgroundColor = XLColor.FromHtml("#065F46");
            celda.Style.Font.Bold = true;
            celda.Style.Font.FontColor = XLColor.White;
            celda.Style.Font.FontSize = 10;
            celda.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            celda.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            hoja.Column(columna).Width = columnas[indice].Ancho;
        }

        for (var indice = 0; indice < columnas.Count; indice++)
        {
            hoja.Cell(2, indice + 1).Value = columnas[indice].Ejemplo;
            hoja.Cell(2, indice + 1).Style.Font.FontColor = XLColor.FromHtml("#475569");
        }

        hoja.Row(1).Height = 26;
        hoja.SheetView.FreezeRows(1);
        hoja.Range(1, 1, 2, columnas.Count).SetAutoFilter();
        hoja.Range(1, 1, 1, columnas.Count).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
        hoja.PageSetup.PageOrientation = XLPageOrientation.Landscape;
        hoja.PageSetup.PaperSize = XLPaperSize.A4Paper;
        hoja.PageSetup.PagesWide = 1;

        var instrucciones = libro.Worksheets.Add("Instrucciones");
        instrucciones.Column(1).Width = 110;
        instrucciones.Cell(1, 1).Value = $"Plantilla de importación — {TituloTipo(tipo)}";
        instrucciones.Cell(1, 1).Style.Font.Bold = true;
        instrucciones.Cell(1, 1).Style.Font.FontSize = 14;
        instrucciones.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#065F46");

        var pasos = new[]
        {
            "1. Escriba o pegue los datos en la hoja «Datos», debajo de los encabezados. No cambie los nombres de las columnas.",
            "2. La fila 2 es un ejemplo: bórrela o reemplácela por sus datos.",
            "3. Las columnas marcadas con * son obligatorias.",
            "4. Los campos Activo aceptan Sí o No. Si se dejan vacíos se toman como Sí.",
            "5. Use punto como separador decimal (por ejemplo 1650.24). No escriba el símbolo Q ni separadores de miles.",
            "6. El código es la llave: si ya existe, la fila se omite o se actualiza según la opción que elija al importar.",
            "7. La existencia inicial solo se aplica a productos nuevos y deja un movimiento de ajuste auditado.",
            "8. Guarde el archivo en formato .xlsx y súbalo desde el botón Importar del módulo correspondiente.",
            "9. Siempre previsualice antes de confirmar: verá las filas válidas, las advertencias y los errores.",
            "10. Si hay errores, el sistema no importa nada: corrija el archivo y vuelva a intentarlo."
        };

        for (var indice = 0; indice < pasos.Length; indice++)
        {
            instrucciones.Cell(indice + 3, 1).Value = pasos[indice];
            instrucciones.Cell(indice + 3, 1).Style.Alignment.WrapText = true;
            instrucciones.Cell(indice + 3, 1).Style.Font.FontSize = 10;
        }

        var filaDetalle = pasos.Length + 5;
        instrucciones.Cell(filaDetalle, 1).Value = "Columnas de esta plantilla";
        instrucciones.Cell(filaDetalle, 1).Style.Font.Bold = true;

        for (var indice = 0; indice < columnas.Count; indice++)
        {
            instrucciones.Cell(filaDetalle + 1 + indice, 1).Value =
                $"{columnas[indice].Titulo}: {columnas[indice].Ayuda}";
            instrucciones.Cell(filaDetalle + 1 + indice, 1).Style.Alignment.WrapText = true;
        }

        using var memoria = new MemoryStream();
        libro.SaveAs(memoria);
        return memoria.ToArray();
    }

    // ----------------------------------------------------------- Previsualizar

    public async Task<ImportacionPrevisualizacionDto> PrevisualizarAsync(
        string tipo, Stream archivo, string nombreArchivo, bool actualizarExistentes)
    {
        var (previsualizacion, _) = await AnalizarAsync(tipo, archivo, nombreArchivo, actualizarExistentes);
        return previsualizacion;
    }

    // --------------------------------------------------------------- Confirmar

    public async Task<ImportacionResultadoDto> ConfirmarAsync(
        string tipo, Stream archivo, string nombreArchivo, bool actualizarExistentes, int usuarioId)
    {
        tipo = TiposImportacion.Normalizar(tipo);
        var (previsualizacion, filas) = await AnalizarAsync(tipo, archivo, nombreArchivo, actualizarExistentes);

        if (previsualizacion.Errores > 0)
        {
            throw new ExcepcionNegocio(
                $"El archivo tiene {previsualizacion.Errores} fila(s) con errores. Corríjalas y vuelva a intentarlo.");
        }

        var aplicables = filas.Where(fila => !fila.Omitir && fila.Errores.Count == 0).ToList();
        if (aplicables.Count == 0)
        {
            return new ImportacionResultadoDto
            {
                Tipo = tipo,
                Omitidos = filas.Count(fila => fila.Omitir),
                Mensaje = "No había filas nuevas por importar."
            };
        }

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            var resultado = tipo switch
            {
                TiposImportacion.Productos => await AplicarProductosAsync(aplicables, usuarioId),
                TiposImportacion.Clientes => await AplicarClientesAsync(aplicables),
                TiposImportacion.Proveedores => await AplicarProveedoresAsync(aplicables),
                _ => throw new ExcepcionNegocio("Tipo de importación no soportado.")
            };

            resultado.Tipo = tipo;
            resultado.Omitidos = filas.Count(fila => fila.Omitir);
            resultado.Errores = previsualizacion.Errores;

            _bitacora.Registrar(
                $"Importación de {tipo}",
                "Importación",
                null,
                $"{nombreArchivo}: {resultado.Creados} creados, {resultado.Actualizados} actualizados, {resultado.Omitidos} omitidos");

            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            resultado.Mensaje =
                $"Importación completada: {resultado.Creados} creado(s), {resultado.Actualizados} actualizado(s), {resultado.Omitidos} omitido(s).";
            return resultado;
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    // -------------------------------------------------------------- Validación

    private async Task<(ImportacionPrevisualizacionDto, List<FilaValidada>)> AnalizarAsync(
        string tipo, Stream archivo, string nombreArchivo, bool actualizarExistentes)
    {
        tipo = TiposImportacion.Normalizar(tipo);
        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();

        if (extension is not (".xlsx" or ".xlsm" or ".csv"))
        {
            throw new ExcepcionNegocio("El archivo debe ser .xlsx o .csv.");
        }

        var (encabezados, registros) = extension == ".csv"
            ? LeerCsv(archivo)
            : LeerXlsx(archivo);

        if (registros.Count == 0)
        {
            throw new ExcepcionNegocio("El archivo no contiene filas de datos.");
        }

        if (registros.Count > MaximoFilas)
        {
            throw new ExcepcionNegocio($"El archivo supera el máximo de {MaximoFilas} filas.");
        }

        var columnas = ColumnasPlantilla(tipo);
        var mapa = MapaColumnas();
        var indices = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var indice = 0; indice < encabezados.Length; indice++)
        {
            var encabezado = Normalizar(encabezados[indice]);
            if (mapa.TryGetValue(encabezado, out var canonico) && !indices.ContainsKey(canonico))
            {
                indices[canonico] = indice;
            }
        }

        var requeridas = tipo switch
        {
            TiposImportacion.Productos => new[] { "codigo", "nombre", "categoria" },
            TiposImportacion.Clientes => new[] { "codigo", "nombre" },
            _ => new[] { "codigo", "razonsocial" }
        };

        var faltantes = requeridas
            .Where(requerida => !indices.ContainsKey(requerida))
            .Select(requerida => Etiqueta(tipo, requerida))
            .ToList();

        if (faltantes.Count > 0)
        {
            throw new ExcepcionNegocio(
                $"Faltan columnas obligatorias: {string.Join(", ", faltantes)}. Descargue la plantilla actualizada.");
        }

        var codigosExistentes = await CodigosExistentesAsync(tipo);
        var categorias = tipo == TiposImportacion.Productos
            ? (await _contexto.Categorias.AsNoTracking().ToListAsync())
                .ToDictionary(categoria => Normalizar(categoria.Nombre), categoria => categoria.Id, StringComparer.Ordinal)
            : new Dictionary<string, int>(StringComparer.Ordinal);

        var previsualizacion = new ImportacionPrevisualizacionDto
        {
            Tipo = tipo,
            Columnas = columnas.Select(columna => columna.Titulo).ToList()
        };
        var validadas = new List<FilaValidada>();
        var vistos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var indice = 0; indice < registros.Count; indice++)
        {
            var valores = registros[indice];
            var datos = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var columna in columnas)
            {
                datos[columna.Clave] = indices.TryGetValue(columna.Clave, out var posicion) && posicion < valores.Length
                    ? valores[posicion].Trim()
                    : "";
            }

            var fila = new FilaValidada
            {
                Numero = indice + 2,
                Datos = datos,
                Codigo = datos["codigo"]
            };

            ValidarFila(tipo, fila, datos, categorias, vistos);

            if (codigosExistentes.Contains(fila.Codigo))
            {
                fila.Existe = true;
                if (actualizarExistentes)
                {
                    fila.Advertencias.Add("El código ya existe: se actualizarán sus datos.");
                }
                else
                {
                    fila.Omitir = true;
                    fila.Advertencias.Add("El código ya existe: la fila se omitirá.");
                }
            }

            if (tipo == TiposImportacion.Productos && fila.Existe &&
                ParseDecimal(datos["existencia"], out var existencia) && existencia > 0)
            {
                fila.Advertencias.Add("La existencia inicial solo se aplica a productos nuevos; se ignorará.");
            }

            var dto = new ImportacionFilaDto
            {
                Fila = fila.Numero,
                Datos = columnas.ToDictionary(
                    columna => columna.Titulo,
                    columna => datos.TryGetValue(columna.Clave, out var valor) ? valor : "")
            };

            dto.Estado = fila.Errores.Count > 0
                ? "error"
                : fila.Omitir
                    ? "omitida"
                    : fila.Advertencias.Count > 0
                        ? "advertencia"
                        : "valida";
            dto.Mensajes = fila.Errores.Concat(fila.Advertencias).ToList();

            previsualizacion.Filas.Add(dto);
            previsualizacion.TotalFilas++;

            if (fila.Errores.Count > 0) previsualizacion.Errores++;
            else if (fila.Omitir) previsualizacion.Omitidas++;
            else if (fila.Advertencias.Count > 0) previsualizacion.Advertencias++;
            else previsualizacion.Validas++;

            validadas.Add(fila);
        }

        return (previsualizacion, validadas);
    }

    private static void ValidarFila(
        string tipo,
        FilaValidada fila,
        Dictionary<string, string> datos,
        Dictionary<string, int> categorias,
        HashSet<string> vistos)
    {
        var codigo = datos["codigo"].Trim();
        if (string.IsNullOrWhiteSpace(codigo))
        {
            fila.Errores.Add("El código es obligatorio.");
        }
        else
        {
            var maximo = tipo == TiposImportacion.Productos ? 50 : 30;
            if (codigo.Length > maximo) fila.Errores.Add($"El código no puede superar {maximo} caracteres.");
            if (!vistos.Add(codigo)) fila.Errores.Add("El código está repetido dentro del archivo.");
        }

        if (tipo == TiposImportacion.Productos)
        {
            ValidarTexto(fila, datos, "nombre", "El nombre", 150, obligatorio: true);
            ValidarTexto(fila, datos, "descripcion", "La descripción", 500, obligatorio: false);
            ValidarTexto(fila, datos, "unidad", "La unidad de medida", 30, obligatorio: false);

            if (string.IsNullOrWhiteSpace(datos["unidad"])) datos["unidad"] = "Unidad";

            var categoria = datos["categoria"].Trim();
            if (string.IsNullOrWhiteSpace(categoria))
            {
                fila.Errores.Add("La categoría es obligatoria.");
            }
            else if (categoria.Length > 100)
            {
                fila.Errores.Add("La categoría no puede superar 100 caracteres.");
            }
            else if (!categorias.ContainsKey(Normalizar(categoria)))
            {
                fila.Advertencias.Add($"La categoría «{categoria}» no existe: se creará.");
            }

            ValidarDecimal(fila, datos, "costo", "El precio de costo", 0, 999999999);
            ValidarDecimal(fila, datos, "precio", "El precio de venta", 0, 999999999);
            ValidarDecimal(fila, datos, "minima", "La existencia mínima", 0, 999999999);
            ValidarDecimal(fila, datos, "existencia", "La existencia inicial", 0, 999999999);
        }
        else if (tipo == TiposImportacion.Clientes)
        {
            ValidarTexto(fila, datos, "nombre", "El nombre", 200, obligatorio: true);
            ValidarTexto(fila, datos, "documento", "El documento", 50, obligatorio: false);
            ValidarTexto(fila, datos, "telefono", "El teléfono", 30, obligatorio: false);
            ValidarTexto(fila, datos, "direccion", "La dirección", 300, obligatorio: false);
            ValidarCorreo(fila, datos);
        }
        else
        {
            ValidarTexto(fila, datos, "razonsocial", "La razón social", 200, obligatorio: true);
            ValidarTexto(fila, datos, "documento", "El documento", 50, obligatorio: false);
            ValidarTexto(fila, datos, "contacto", "El contacto", 150, obligatorio: false);
            ValidarTexto(fila, datos, "telefono", "El teléfono", 30, obligatorio: false);
            ValidarTexto(fila, datos, "direccion", "La dirección", 300, obligatorio: false);
            ValidarCorreo(fila, datos);
        }

        if (!TryBooleano(datos["activo"], out var activo))
        {
            fila.Errores.Add("Activo debe ser Sí o No.");
        }
        else
        {
            datos["activo"] = activo ? "Sí" : "No";
        }
    }

    private static void ValidarTexto(
        FilaValidada fila, Dictionary<string, string> datos,
        string clave, string etiqueta, int maximo, bool obligatorio)
    {
        var valor = datos[clave].Trim();
        if (obligatorio && string.IsNullOrWhiteSpace(valor))
        {
            fila.Errores.Add($"{etiqueta} es obligatorio.");
        }
        else if (valor.Length > maximo)
        {
            fila.Errores.Add($"{etiqueta} no puede superar {maximo} caracteres.");
        }
    }

    private static void ValidarDecimal(
        FilaValidada fila, Dictionary<string, string> datos,
        string clave, string etiqueta, decimal minimo, decimal maximo)
    {
        if (!ParseDecimal(datos[clave], out var valor))
        {
            fila.Errores.Add($"{etiqueta} debe ser un número.");
            return;
        }

        if (valor < minimo || valor > maximo)
        {
            fila.Errores.Add($"{etiqueta} debe estar entre {minimo} y {maximo}.");
        }
    }

    private static void ValidarCorreo(FilaValidada fila, Dictionary<string, string> datos)
    {
        var correo = datos["correo"].Trim();
        if (string.IsNullOrWhiteSpace(correo)) return;

        if (!MailAddress.TryCreate(correo, out var direccion) || direccion.Address != correo ||
            new CorreoFormalAttribute().IsValid(correo) is false)
        {
            fila.Errores.Add("El correo no es válido.");
        }
    }

    // ---------------------------------------------------------------- Aplicar

    private async Task<ImportacionResultadoDto> AplicarProductosAsync(
        List<FilaValidada> filas, int usuarioId)
    {
        var resultado = new ImportacionResultadoDto();
        var codigos = filas.Select(fila => fila.Codigo).ToList();
        var existentes = (await _contexto.Productos
                .Include(producto => producto.Categoria)
                .Where(producto => codigos.Contains(producto.Codigo))
                .ToListAsync())
            .ToDictionary(producto => producto.Codigo, StringComparer.OrdinalIgnoreCase);

        var categorias = (await _contexto.Categorias.ToListAsync())
            .ToDictionary(categoria => Normalizar(categoria.Nombre), StringComparer.Ordinal);

        var hayStock = filas.Any(fila => !fila.Existe &&
            ParseDecimal(fila.Datos["existencia"], out var existencia) && existencia > 0);

        var numeroAjuste = hayStock
            ? await _secuencias.GenerarNumeroAsync(
                "Ajuste", await _parametros.ObtenerPrefijoAsync("Documento.PrefijoAjuste", "AJU"))
            : null;

        foreach (var fila in filas)
        {
            var datos = fila.Datos;
            var nombreCategoria = datos["categoria"].Trim();
            var claveCategoria = Normalizar(nombreCategoria);

            if (!categorias.TryGetValue(claveCategoria, out var categoria))
            {
                categoria = new Categoria { Nombre = nombreCategoria, Activo = true };
                _contexto.Categorias.Add(categoria);
                categorias[claveCategoria] = categoria;
            }

            var unidad = string.IsNullOrWhiteSpace(datos["unidad"]) ? "Unidad" : datos["unidad"].Trim();
            ParseDecimal(datos["costo"], out var costo);
            ParseDecimal(datos["precio"], out var precio);
            ParseDecimal(datos["minima"], out var minima);
            ParseDecimal(datos["existencia"], out var existencia);
            TryBooleano(datos["activo"], out var activo);

            if (existentes.TryGetValue(fila.Codigo, out var producto))
            {
                producto.Nombre = datos["nombre"].Trim();
                producto.Descripcion = TextoOpcional(datos["descripcion"]);
                producto.Categoria = categoria;
                producto.UnidadMedida = unidad;
                producto.PrecioCosto = costo;
                producto.PrecioVenta = precio;
                producto.ExistenciaMinima = minima;
                producto.Activo = activo;
                resultado.Actualizados++;
                continue;
            }

            var nuevo = new Producto
            {
                Codigo = datos["codigo"].Trim(),
                Nombre = datos["nombre"].Trim(),
                Descripcion = TextoOpcional(datos["descripcion"]),
                Categoria = categoria,
                UnidadMedida = unidad,
                PrecioCosto = costo,
                PrecioVenta = precio,
                ExistenciaActual = 0,
                ExistenciaMinima = minima,
                Activo = activo,
                FechaCreacion = DateTime.Now
            };

            _contexto.Productos.Add(nuevo);
            existentes[nuevo.Codigo] = nuevo;

            if (existencia > 0)
            {
                nuevo.ExistenciaActual = existencia;
                _contexto.MovimientosInventario.Add(new MovimientoInventario
                {
                    Fecha = DateTime.Now,
                    Producto = nuevo,
                    Tipo = TipoMovimiento.Entrada,
                    Origen = OrigenMovimiento.Ajuste,
                    DocumentoNumero = numeroAjuste,
                    Cantidad = existencia,
                    CostoUnitario = costo,
                    SaldoAnterior = 0,
                    SaldoNuevo = existencia,
                    UsuarioId = usuarioId,
                    Observacion = "Carga inicial desde Excel"
                });
            }

            resultado.Creados++;
        }

        return resultado;
    }

    private async Task<ImportacionResultadoDto> AplicarClientesAsync(List<FilaValidada> filas)
    {
        var resultado = new ImportacionResultadoDto();
        var codigos = filas.Select(fila => fila.Codigo).ToList();
        var existentes = (await _contexto.Clientes
                .Where(cliente => codigos.Contains(cliente.Codigo))
                .ToListAsync())
            .ToDictionary(cliente => cliente.Codigo, StringComparer.OrdinalIgnoreCase);

        foreach (var fila in filas)
        {
            var datos = fila.Datos;
            TryBooleano(datos["activo"], out var activo);

            if (existentes.TryGetValue(fila.Codigo, out var cliente))
            {
                cliente.Nombre = datos["nombre"].Trim();
                cliente.Documento = TextoOpcional(datos["documento"]);
                cliente.Telefono = TextoOpcional(datos["telefono"]);
                cliente.Correo = TextoOpcional(datos["correo"]);
                cliente.Direccion = TextoOpcional(datos["direccion"]);
                cliente.Activo = activo;
                resultado.Actualizados++;
                continue;
            }

            _contexto.Clientes.Add(new Cliente
            {
                Codigo = datos["codigo"].Trim(),
                Nombre = datos["nombre"].Trim(),
                Documento = TextoOpcional(datos["documento"]),
                Telefono = TextoOpcional(datos["telefono"]),
                Correo = TextoOpcional(datos["correo"]),
                Direccion = TextoOpcional(datos["direccion"]),
                Activo = activo,
                FechaCreacion = DateTime.Now
            });
            resultado.Creados++;
        }

        return resultado;
    }

    private async Task<ImportacionResultadoDto> AplicarProveedoresAsync(List<FilaValidada> filas)
    {
        var resultado = new ImportacionResultadoDto();
        var codigos = filas.Select(fila => fila.Codigo).ToList();
        var existentes = (await _contexto.Proveedores
                .Where(proveedor => codigos.Contains(proveedor.Codigo))
                .ToListAsync())
            .ToDictionary(proveedor => proveedor.Codigo, StringComparer.OrdinalIgnoreCase);

        foreach (var fila in filas)
        {
            var datos = fila.Datos;
            TryBooleano(datos["activo"], out var activo);

            if (existentes.TryGetValue(fila.Codigo, out var proveedor))
            {
                proveedor.RazonSocial = datos["razonsocial"].Trim();
                proveedor.Documento = TextoOpcional(datos["documento"]);
                proveedor.Contacto = TextoOpcional(datos["contacto"]);
                proveedor.Telefono = TextoOpcional(datos["telefono"]);
                proveedor.Correo = TextoOpcional(datos["correo"]);
                proveedor.Direccion = TextoOpcional(datos["direccion"]);
                proveedor.Activo = activo;
                resultado.Actualizados++;
                continue;
            }

            _contexto.Proveedores.Add(new Proveedor
            {
                Codigo = datos["codigo"].Trim(),
                RazonSocial = datos["razonsocial"].Trim(),
                Documento = TextoOpcional(datos["documento"]),
                Contacto = TextoOpcional(datos["contacto"]),
                Telefono = TextoOpcional(datos["telefono"]),
                Correo = TextoOpcional(datos["correo"]),
                Direccion = TextoOpcional(datos["direccion"]),
                Activo = activo,
                FechaCreacion = DateTime.Now
            });
            resultado.Creados++;
        }

        return resultado;
    }

    // --------------------------------------------------------------- Archivos

    private static (string[] Encabezados, List<string[]> Filas) LeerXlsx(Stream archivo)
    {
        using var libro = new XLWorkbook(archivo);
        var hoja = libro.Worksheets.FirstOrDefault()
            ?? throw new ExcepcionNegocio("El libro no contiene hojas.");

        var primeraFila = hoja.RowsUsed().FirstOrDefault()
            ?? throw new ExcepcionNegocio("La hoja no contiene encabezados.");

        var ultimaColumna = primeraFila.LastCellUsed()?.Address.ColumnNumber ?? 0;
        if (ultimaColumna == 0)
        {
            throw new ExcepcionNegocio("La hoja no contiene encabezados.");
        }

        var encabezados = Enumerable.Range(1, ultimaColumna)
            .Select(columna => ValorCelda(primeraFila.Cell(columna)))
            .ToArray();

        var filas = new List<string[]>();
        var ultimaFila = hoja.LastRowUsed()?.RowNumber() ?? primeraFila.RowNumber();

        for (var numero = primeraFila.RowNumber() + 1; numero <= ultimaFila; numero++)
        {
            var valores = Enumerable.Range(1, ultimaColumna)
                .Select(columna => ValorCelda(hoja.Cell(numero, columna)))
                .ToArray();

            if (valores.All(string.IsNullOrWhiteSpace)) continue;

            filas.Add(valores);
        }

        return (encabezados, filas);
    }

    private static string ValorCelda(IXLCell celda)
    {
        if (celda.IsEmpty()) return "";
        var valor = celda.Value;

        if (valor.IsNumber)
        {
            return valor.GetNumber().ToString(CultureInfo.InvariantCulture);
        }

        if (valor.IsDateTime)
        {
            return valor.GetDateTime().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }

        return valor.ToString(CultureInfo.InvariantCulture)?.Trim() ?? "";
    }

    private static (string[] Encabezados, List<string[]> Filas) LeerCsv(Stream archivo)
    {
        using var lector = new StreamReader(archivo, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var texto = lector.ReadToEnd();
        if (string.IsNullOrWhiteSpace(texto))
        {
            throw new ExcepcionNegocio("El archivo está vacío.");
        }

        var primeraLinea = texto.Split('\n').FirstOrDefault(linea => !string.IsNullOrWhiteSpace(linea)) ?? "";
        var delimitador = primeraLinea.Count(caracter => caracter == ';') > primeraLinea.Count(caracter => caracter == ',')
            ? ';'
            : ',';

        var registros = ParseCsv(texto, delimitador);
        if (registros.Count == 0)
        {
            throw new ExcepcionNegocio("El archivo no contiene encabezados.");
        }

        var encabezados = registros[0].ToArray();
        var filas = registros
            .Skip(1)
            .Where(fila => fila.Any(valor => !string.IsNullOrWhiteSpace(valor)))
            .Select(fila => fila.ToArray())
            .ToList();

        return (encabezados, filas);
    }

    private static List<List<string>> ParseCsv(string texto, char delimitador)
    {
        var resultado = new List<List<string>>();
        var fila = new List<string>();
        var campo = new StringBuilder();
        var enComillas = false;

        for (var indice = 0; indice < texto.Length; indice++)
        {
            var caracter = texto[indice];

            if (enComillas)
            {
                if (caracter == '"')
                {
                    if (indice + 1 < texto.Length && texto[indice + 1] == '"')
                    {
                        campo.Append('"');
                        indice++;
                    }
                    else
                    {
                        enComillas = false;
                    }
                }
                else
                {
                    campo.Append(caracter);
                }
                continue;
            }

            switch (caracter)
            {
                case '"':
                    enComillas = true;
                    break;
                case '\r':
                    break;
                case '\n':
                    fila.Add(campo.ToString());
                    campo.Clear();
                    resultado.Add(fila);
                    fila = new List<string>();
                    break;
                default:
                    if (caracter == delimitador)
                    {
                        fila.Add(campo.ToString());
                        campo.Clear();
                    }
                    else
                    {
                        campo.Append(caracter);
                    }
                    break;
            }
        }

        if (campo.Length > 0 || fila.Count > 0)
        {
            fila.Add(campo.ToString());
            resultado.Add(fila);
        }

        return resultado;
    }

    // ---------------------------------------------------------------- Catálogo

    private static List<ColumnaPlantilla> ColumnasPlantilla(string tipo) => tipo switch
    {
        TiposImportacion.Productos => new()
        {
            new("codigo", "Código *", 16, "EJEMPLO-001", "Obligatorio y único. Máximo 50 caracteres."),
            new("nombre", "Nombre *", 32, "Producto de ejemplo", "Obligatorio. Máximo 150 caracteres."),
            new("categoria", "Categoría *", 20, "Alimentos", "Obligatoria. Si no existe, se crea automáticamente."),
            new("unidad", "Unidad de medida", 18, "Unidad", "Unidad, caja, libra, etc. Si se deja vacío se usa Unidad."),
            new("costo", "Precio de costo", 16, "10.50", "Número mayor o igual a 0. Use punto decimal."),
            new("precio", "Precio de venta", 16, "15.00", "Número mayor o igual a 0. Use punto decimal."),
            new("existencia", "Existencia inicial", 18, "24", "Solo para productos nuevos. Genera un ajuste auditado."),
            new("minima", "Existencia mínima", 18, "5", "Número mayor o igual a 0."),
            new("activo", "Activo (Sí/No)", 14, "Sí", "Sí o No. Vacío se toma como Sí."),
            new("descripcion", "Descripción", 40, "Botella de 1 litro", "Opcional. Máximo 500 caracteres.")
        },
        TiposImportacion.Clientes => new()
        {
            new("codigo", "Código *", 16, "EJEMPLO-CLI", "Obligatorio y único. Máximo 30 caracteres."),
            new("nombre", "Nombre *", 34, "Cliente de ejemplo", "Obligatorio. Máximo 200 caracteres."),
            new("documento", "Documento/NIT", 18, "1234567-8", "Opcional. Máximo 50 caracteres."),
            new("telefono", "Teléfono", 18, "+502 6000-0000", "Opcional. Máximo 30 caracteres."),
            new("correo", "Correo", 30, "compras@empresa.com", "Opcional. Debe tener dominio completo."),
            new("direccion", "Dirección", 40, "Zona 4, Ciudad de Guatemala", "Opcional. Máximo 300 caracteres."),
            new("activo", "Activo (Sí/No)", 14, "Sí", "Sí o No. Vacío se toma como Sí.")
        },
        _ => new()
        {
            new("codigo", "Código *", 16, "EJEMPLO-PRV", "Obligatorio y único. Máximo 30 caracteres."),
            new("razonsocial", "Razón social *", 34, "Proveedor de ejemplo", "Obligatorio. Máximo 200 caracteres."),
            new("documento", "Documento/NIT", 18, "1234567-8", "Opcional. Máximo 50 caracteres."),
            new("contacto", "Contacto", 24, "Luis Pérez", "Opcional. Máximo 150 caracteres."),
            new("telefono", "Teléfono", 18, "+502 6000-0000", "Opcional. Máximo 30 caracteres."),
            new("correo", "Correo", 30, "ventas@empresa.com", "Opcional. Debe tener dominio completo."),
            new("direccion", "Dirección", 40, "Zona 12, Ciudad de Guatemala", "Opcional. Máximo 300 caracteres."),
            new("activo", "Activo (Sí/No)", 14, "Sí", "Sí o No. Vacío se toma como Sí.")
        }
    };

    private static Dictionary<string, string> MapaColumnas()
    {
        var mapa = new Dictionary<string, string>(StringComparer.Ordinal);

        void Agregar(string canonico, params string[] alias)
        {
            foreach (var nombre in alias)
            {
                mapa[Normalizar(nombre)] = canonico;
            }
        }

        Agregar("codigo", "Codigo", "Code");
        Agregar("nombre", "Nombre", "Nombre del producto", "Producto", "Nombre completo");
        Agregar("razonsocial", "Razon social", "Proveedor");
        Agregar("categoria", "Categoria");
        Agregar("unidad", "Unidad de medida", "Unidad");
        Agregar("costo", "Precio de costo", "Costo", "Precio de compra");
        Agregar("precio", "Precio de venta", "Precio", "Precio venta");
        Agregar("existencia", "Existencia inicial", "Existencia", "Stock");
        Agregar("minima", "Existencia minima", "Minimo");
        Agregar("activo", "Activo", "Activo (Si/No)");
        Agregar("descripcion", "Descripcion");
        Agregar("documento", "Documento", "Documento/NIT", "NIT");
        Agregar("contacto", "Contacto");
        Agregar("telefono", "Telefono");
        Agregar("correo", "Correo", "Email");
        Agregar("direccion", "Direccion");

        return mapa;
    }

    private async Task<HashSet<string>> CodigosExistentesAsync(string tipo)
    {
        List<string> codigos = tipo switch
        {
            TiposImportacion.Productos => await _contexto.Productos
                .Select(producto => producto.Codigo).ToListAsync(),
            TiposImportacion.Clientes => await _contexto.Clientes
                .Select(cliente => cliente.Codigo).ToListAsync(),
            _ => await _contexto.Proveedores
                .Select(proveedor => proveedor.Codigo).ToListAsync()
        };

        return codigos.ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    // ---------------------------------------------------------------- Utilidades

    private static string Normalizar(string texto)
    {
        var descompuesto = texto.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var limpio = new StringBuilder();

        foreach (var caracter in descompuesto)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caracter) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            limpio.Append(char.IsLetterOrDigit(caracter) ? caracter : ' ');
        }

        return string.Join(" ", limpio.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static bool TryBooleano(string? texto, out bool valor)
    {
        var normalizado = Normalizar(texto ?? "");
        switch (normalizado)
        {
            case "":
            case "si":
            case "1":
            case "true":
            case "activo":
            case "x":
                valor = true;
                return true;
            case "no":
            case "0":
            case "false":
            case "inactivo":
                valor = false;
                return true;
            default:
                valor = false;
                return false;
        }
    }

    private static bool ParseDecimal(string? texto, out decimal valor)
    {
        valor = 0;
        var limpio = (texto ?? "").Trim()
            .Replace("Q", "", StringComparison.OrdinalIgnoreCase)
            .Replace(" ", "")
            .Replace("\u00A0", "");

        if (limpio.Length == 0) return true;

        if (limpio.Contains(',') && limpio.Contains('.'))
        {
            limpio = limpio.LastIndexOf(',') > limpio.LastIndexOf('.')
                ? limpio.Replace(".", "").Replace(',', '.')
                : limpio.Replace(",", "");
        }
        else if (limpio.Contains(','))
        {
            limpio = limpio.Replace(',', '.');
        }

        return decimal.TryParse(limpio, NumberStyles.Number, CultureInfo.InvariantCulture, out valor);
    }

    private static string? TextoOpcional(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

    private static string TituloTipo(string tipo) => tipo switch
    {
        TiposImportacion.Productos => "Productos",
        TiposImportacion.Clientes => "Clientes",
        _ => "Proveedores"
    };

    private static string Etiqueta(string tipo, string clave) => ColumnasPlantilla(tipo)
        .FirstOrDefault(columna => columna.Clave == clave)?.Titulo ?? clave;

    private sealed class FilaValidada
    {
        public int Numero { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public Dictionary<string, string> Datos { get; set; } = new();
        public List<string> Errores { get; } = new();
        public List<string> Advertencias { get; } = new();
        public bool Existe { get; set; }
        public bool Omitir { get; set; }
    }

    private sealed record ColumnaPlantilla(string Clave, string Titulo, double Ancho, string Ejemplo, string Ayuda);
}

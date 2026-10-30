using System.Security.Claims;
using ClosedXML.Excel;
using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

/// <summary>
/// Genera el informe gerencial en Excel. Se hace en el servidor para reutilizar
/// las mismas consultas de reportes y mantener el estilo en un solo lugar.
/// </summary>
public class ServicioExportacion
{
    private readonly ServicioReportes _reportes;
    private readonly ContextoInventarios _contexto;
    private readonly IHttpContextAccessor _http;

    private const string FondoEncabezado = "#065F46";
    private const string FondoSubtotal = "#ECFDF5";
    private const string Borde = "#CBD5E1";

    public ServicioExportacion(
        ServicioReportes reportes,
        ContextoInventarios contexto,
        IHttpContextAccessor http)
    {
        _reportes = reportes;
        _contexto = contexto;
        _http = http;
    }

    public async Task<(byte[] Archivo, string Nombre)> ReporteAsync(
        string tipo,
        DateTime desde,
        DateTime hasta,
        string? estado,
        string? tipoNota)
    {
        tipo = NormalizarTipo(tipo);
        var resumen = await _reportes.ResumenPeriodoAsync(desde, hasta);
        var empresa = await _contexto.ParametrosSistema.AsNoTracking()
            .Where(parametro => parametro.Clave.StartsWith("Empresa."))
            .ToDictionaryAsync(parametro => parametro.Clave, parametro => parametro.Valor ?? "");
        var usuario = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Name) ?? "Sistema";

        using var libro = new XLWorkbook();
        libro.Properties.Author = "Sistema de Inventarios";
        libro.Properties.Title = $"Informe gerencial - {tipo}";
        libro.Properties.Created = DateTime.Now;

        switch (tipo)
        {
            case "ventas":
                await HojaVentasAsync(libro, desde, hasta, estado, empresa, usuario, resumen);
                break;
            case "compras":
                await HojaComprasAsync(libro, desde, hasta, estado, empresa, usuario, resumen);
                break;
            case "notas":
                await HojaNotasAsync(libro, desde, hasta, tipoNota, empresa, usuario, resumen);
                break;
            default:
                tipo = "resumen";
                await HojaResumenAsync(libro, desde, hasta, empresa, usuario, resumen);
                break;
        }

        using var memoria = new MemoryStream();
        libro.SaveAs(memoria);

        var nombre = $"Informe-Gerencial_{tipo}_{desde:yyyy-MM-dd}_{hasta:yyyy-MM-dd}.xlsx";
        return (memoria.ToArray(), nombre);
    }

    public async Task<(byte[] Archivo, string Nombre)> PanelAsync()
    {
        var datos = await _reportes.DashboardAsync();
        var empresa = await _contexto.ParametrosSistema.AsNoTracking()
            .Where(parametro => parametro.Clave.StartsWith("Empresa."))
            .ToDictionaryAsync(parametro => parametro.Clave, parametro => parametro.Valor ?? "");
        var usuario = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Name) ?? "Sistema";
        var hoy = DateTime.Today;
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

        using var libro = new XLWorkbook();
        libro.Properties.Author = "Sistema de Inventarios";
        libro.Properties.Title = "Panel gerencial";
        libro.Properties.Created = DateTime.Now;

        var hoja = libro.Worksheets.Add("Panel");
        var resumen = new ResumenPeriodoDto
        {
            TotalVentas = datos.VentasMes,
            CantidadVentas = datos.CantidadVentasMes,
            TotalCompras = datos.ComprasMes,
            CantidadCompras = datos.CantidadComprasMes
        };

        EscribirEncabezado(hoja, 6, "PANEL GERENCIAL", inicioMes, hoy, empresa, usuario, resumen);
        AplicarAnchos(hoja, 34d, 22d, 22d, 22d, 20d, 20d);

        var fila = 9;
        fila = EscribirSeccion(hoja, fila, "COMPARATIVO MENSUAL");
        fila = EscribirTabla(hoja, fila,
            new[] { "Indicador", "Mes actual", "Mes anterior", "Variación" },
            new[] { 34d, 22d, 22d, 18d },
            4,
            (indice) => indice switch
            {
                0 => new object?[] { "Ventas", datos.VentasMes, datos.VentasMesAnterior, Variacion(datos.VentasMes, datos.VentasMesAnterior) },
                1 => new object?[] { "Compras", datos.ComprasMes, datos.ComprasMesAnterior, Variacion(datos.ComprasMes, datos.ComprasMesAnterior) },
                2 => new object?[] { "Ticket promedio", datos.TicketPromedioMes, TicketPromedio(datos.VentasMesAnterior, datos.CantidadVentasMesAnterior), Variacion(datos.TicketPromedioMes, TicketPromedio(datos.VentasMesAnterior, datos.CantidadVentasMesAnterior)) },
                _ => new object?[] { "Documentos de venta", datos.CantidadVentasMes, datos.CantidadVentasMesAnterior, Variacion(datos.CantidadVentasMes, datos.CantidadVentasMesAnterior) }
            },
            null);

        fila = EscribirSeccion(hoja, fila + 1, "INDICADORES DEL MES");
        fila = EscribirTabla(hoja, fila,
            new[] { "Indicador", "Valor" },
            new[] { 34d, 22d },
            6,
            (indice) => indice switch
            {
                0 => new object?[] { "Margen bruto estimado", datos.MargenBrutoMes },
                1 => new object?[] { "Margen sobre ventas netas (%)", $"{datos.PorcentajeMargenMes:0.00}%" },
                2 => new object?[] { "Inventario al costo", datos.ValorInventarioCosto },
                3 => new object?[] { "Inventario al precio de venta", datos.ValorInventarioVenta },
                4 => new object?[] { "Margen potencial del inventario", datos.MargenPotencialInventario },
                _ => new object?[] { "Productos bajo mínimo / sin existencia", $"{datos.ProductosBajoMinimo} / {datos.ProductosSinExistencia}" }
            },
            null);

        fila = EscribirSeccion(hoja, fila + 1, "VENTAS POR FORMA DE PAGO");
        fila = EscribirTabla(hoja, fila,
            new[] { "Forma de pago", "Documentos", "Total" },
            new[] { 26d, 16d, 20d },
            datos.VentasPorFormaPago.Count,
            (indice) => new object?[]
            {
                datos.VentasPorFormaPago[indice].FormaPago,
                datos.VentasPorFormaPago[indice].Cantidad,
                datos.VentasPorFormaPago[indice].Total
            },
            null);

        fila = EscribirSeccion(hoja, fila + 1, "TOP CLIENTES DEL MES");
        fila = EscribirTabla(hoja, fila,
            new[] { "Cliente", "Documentos", "Total" },
            new[] { 36d, 16d, 20d },
            datos.TopClientes.Count,
            (indice) => new object?[]
            {
                datos.TopClientes[indice].Cliente,
                datos.TopClientes[indice].Cantidad,
                datos.TopClientes[indice].Total
            },
            null);

        fila = EscribirSeccion(hoja, fila + 1, "PRODUCTOS MÁS VENDIDOS");
        fila = EscribirTabla(hoja, fila,
            new[] { "Código", "Producto", "Cantidad", "Total vendido" },
            new[] { 16d, 38d, 16d, 20d },
            datos.TopProductos.Count,
            (indice) => new object?[]
            {
                datos.TopProductos[indice].Codigo,
                datos.TopProductos[indice].Nombre,
                datos.TopProductos[indice].CantidadVendida,
                datos.TopProductos[indice].TotalVendido
            },
            null,
            null,
            new[] { 3 });

        fila = EscribirSeccion(hoja, fila + 1, "PRODUCTOS BAJO MÍNIMO");
        fila = EscribirTabla(hoja, fila,
            new[] { "Código", "Producto", "Categoría", "Existencia", "Mínimo", "Faltante" },
            new[] { 16d, 34d, 20d, 14d, 14d, 14d },
            datos.ProductosBajoMinimoLista.Count,
            (indice) => new object?[]
            {
                datos.ProductosBajoMinimoLista[indice].Codigo,
                datos.ProductosBajoMinimoLista[indice].Nombre,
                datos.ProductosBajoMinimoLista[indice].Categoria,
                datos.ProductosBajoMinimoLista[indice].ExistenciaActual,
                datos.ProductosBajoMinimoLista[indice].ExistenciaMinima,
                datos.ProductosBajoMinimoLista[indice].Faltante
            },
            null,
            null,
            new[] { 4, 5, 6 });

        hoja.SheetView.FreezeRows(9);
        ConfigurarImpresion(hoja, 9, fila);

        using var memoria = new MemoryStream();
        libro.SaveAs(memoria);

        return (memoria.ToArray(), $"Panel-Gerencial_{hoy:yyyy-MM-dd}.xlsx");
    }

    private static int EscribirSeccion(IXLWorksheet hoja, int fila, string titulo)
    {
        hoja.Cell(fila, 1).Value = titulo;
        hoja.Range(fila, 1, fila, 4).Merge();
        hoja.Cell(fila, 1).Style.Font.Bold = true;
        hoja.Cell(fila, 1).Style.Font.FontSize = 11;
        hoja.Cell(fila, 1).Style.Font.FontColor = XLColor.FromHtml(FondoEncabezado);
        return fila + 1;
    }

    private static decimal TicketPromedio(decimal total, int cantidad) =>
        cantidad > 0 ? Math.Round(total / cantidad, 2) : 0m;

    private static string Variacion(decimal actual, decimal anterior)
    {
        if (anterior == 0)
        {
            return actual == 0 ? "0.0%" : "sin base";
        }

        var variacion = (actual - anterior) / anterior * 100m;
        return $"{(variacion >= 0 ? "+" : "")}{variacion:0.0}%";
    }

    private async Task HojaVentasAsync(
        XLWorkbook libro, DateTime desde, DateTime hasta, string? estado,
        Dictionary<string, string> empresa, string usuario, ResumenPeriodoDto resumen)
    {
        var filas = await _reportes.VentasAsync(desde, hasta, null, null, estado);
        var hoja = libro.Worksheets.Add("Ventas");
        var fila = EscribirEncabezado(hoja, 9, "VENTAS DEL PERÍODO", desde, hasta, empresa, usuario, resumen);
        var encabezados = new[] { "Documento", "Fecha", "Cliente", "Vendedor", "Forma de pago", "Subtotal", "Impuesto", "Total", "Estado" };
        var anchos = new[] { 14d, 12d, 28d, 22d, 16d, 13d, 13d, 14d, 12d };

        var filaFin = EscribirTabla(hoja, fila, encabezados, anchos, filas.Count, (indice) =>
        {
            var venta = filas[indice];
            return new object?[]
            {
                venta.Numero, venta.Fecha, venta.Cliente, venta.Usuario, venta.FormaPago,
                venta.Subtotal, venta.Impuesto, venta.Total, venta.Estado
            };
        }, new decimal?[]
        {
            null, null, null, null, null,
            filas.Sum(x => x.Subtotal), filas.Sum(x => x.Impuesto), filas.Sum(x => x.Total),
            null
        }, $"{filas.Count} documento(s)");

        FinalizarHoja(hoja, fila, filaFin);
    }

    private async Task HojaComprasAsync(
        XLWorkbook libro, DateTime desde, DateTime hasta, string? estado,
        Dictionary<string, string> empresa, string usuario, ResumenPeriodoDto resumen)
    {
        var filas = await _reportes.ComprasAsync(desde, hasta, null, estado);
        var hoja = libro.Worksheets.Add("Compras");
        var fila = EscribirEncabezado(hoja, 9, "COMPRAS DEL PERÍODO", desde, hasta, empresa, usuario, resumen);
        var encabezados = new[] { "Documento", "Fecha", "Proveedor", "Registrado por", "Subtotal", "Impuesto", "Total", "Estado" };
        var anchos = new[] { 14d, 12d, 30d, 24d, 14d, 14d, 14d, 12d };

        var filaFin = EscribirTabla(hoja, fila, encabezados, anchos, filas.Count, (indice) =>
        {
            var compra = filas[indice];
            return new object?[]
            {
                compra.Numero, compra.Fecha, compra.Proveedor, compra.Usuario,
                compra.Subtotal, compra.Impuesto, compra.Total, compra.Estado
            };
        }, new decimal?[]
        {
            null, null, null, null,
            filas.Sum(x => x.Subtotal), filas.Sum(x => x.Impuesto), filas.Sum(x => x.Total), null
        }, $"{filas.Count} documento(s)");

        FinalizarHoja(hoja, fila, filaFin);
    }

    private async Task HojaNotasAsync(
        XLWorkbook libro, DateTime desde, DateTime hasta, string? tipoNota,
        Dictionary<string, string> empresa, string usuario, ResumenPeriodoDto resumen)
    {
        var filas = await _reportes.NotasAsync(desde, hasta, tipoNota);
        var hoja = libro.Worksheets.Add("Notas");
        var fila = EscribirEncabezado(hoja, 8, "NOTAS DE AJUSTE DEL PERÍODO", desde, hasta, empresa, usuario, resumen);
        var encabezados = new[] { "Documento", "Tipo", "Fecha", "Venta", "Cliente", "Motivo", "Total", "Estado" };
        var anchos = new[] { 14d, 12d, 12d, 14d, 28d, 34d, 14d, 12d };

        var filaFin = EscribirTabla(hoja, fila, encabezados, anchos, filas.Count, (indice) =>
        {
            var nota = filas[indice];
            return new object?[]
            {
                nota.Numero, nota.Tipo, nota.Fecha, nota.VentaNumero,
                nota.Cliente, nota.Motivo, nota.Total, nota.Estado
            };
        }, new decimal?[]
        {
            null, null, null, null, null, null,
            filas.Sum(x => x.Total), null
        }, $"{filas.Count} nota(s)");

        FinalizarHoja(hoja, fila, filaFin);
    }

    private async Task HojaResumenAsync(
        XLWorkbook libro, DateTime desde, DateTime hasta,
        Dictionary<string, string> empresa, string usuario, ResumenPeriodoDto resumen)
    {
        var top = await _reportes.TopProductosAsync(desde, hasta, 15);
        var bajoMinimo = await _reportes.BajoMinimoAsync();
        var hoja = libro.Worksheets.Add("Resumen");
        EscribirEncabezado(hoja, 6, "RESUMEN EJECUTIVO", desde, hasta, empresa, usuario, resumen);
        AplicarAnchos(hoja, 16d, 38d, 18d, 16d, 16d, 16d);

        var fila = 9;
        hoja.Cell(fila, 1).Value = "PRODUCTOS MÁS VENDIDOS";
        hoja.Range(fila, 1, fila, 4).Merge();
        hoja.Cell(fila, 1).Style.Font.Bold = true;
        hoja.Cell(fila, 1).Style.Font.FontSize = 11;
        fila++;

        fila = EscribirTabla(hoja, fila,
            new[] { "Código", "Producto", "Cantidad vendida", "Total vendido" },
            new[] { 16d, 38d, 20d, 18d },
            top.Count,
            (indice) => new object?[]
            {
                top[indice].Codigo, top[indice].Nombre,
                top[indice].CantidadVendida, top[indice].TotalVendido
            },
            new decimal?[]
            {
                null, null, top.Sum(x => x.CantidadVendida), top.Sum(x => x.TotalVendido)
            });

        fila += 1;
        hoja.Cell(fila, 1).Value = "PRODUCTOS BAJO MÍNIMO";
        hoja.Range(fila, 1, fila, 6).Merge();
        hoja.Cell(fila, 1).Style.Font.Bold = true;
        hoja.Cell(fila, 1).Style.Font.FontSize = 11;
        fila++;

        var filaFin = EscribirTabla(hoja, fila,
            new[] { "Código", "Producto", "Categoría", "Existencia", "Mínimo", "Faltante" },
            new[] { 16d, 38d, 20d, 14d, 14d, 14d },
            bajoMinimo.Count,
            (indice) => new object?[]
            {
                bajoMinimo[indice].Codigo, bajoMinimo[indice].Nombre, bajoMinimo[indice].Categoria,
                bajoMinimo[indice].ExistenciaActual, bajoMinimo[indice].ExistenciaMinima, bajoMinimo[indice].Faltante
            },
            null);

        hoja.SheetView.FreezeRows(9);
        ConfigurarImpresion(hoja, 9, filaFin);
    }

    private static int EscribirEncabezado(
        IXLWorksheet hoja, int columnas, string titulo, DateTime desde, DateTime hasta,
        Dictionary<string, string> empresa, string usuario, ResumenPeriodoDto resumen)
    {
        var ultimaColumna = Math.Max(columnas, 5);

        hoja.Cell(1, 1).Value = Valor(empresa, "Empresa.Nombre", "Sistema de Inventarios");
        hoja.Range(1, 1, 1, ultimaColumna).Merge();
        hoja.Cell(1, 1).Style.Font.Bold = true;
        hoja.Cell(1, 1).Style.Font.FontSize = 16;
        hoja.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml(FondoEncabezado);

        var contacto = string.Join(" · ", new[]
        {
            Etiqueta(empresa, "Empresa.Documento", "NIT "),
            Valor(empresa, "Empresa.Direccion", ""),
            Valor(empresa, "Empresa.Telefono", ""),
            Valor(empresa, "Empresa.Correo", "")
        }.Where(texto => !string.IsNullOrWhiteSpace(texto)));

        hoja.Cell(2, 1).Value = contacto;
        hoja.Range(2, 1, 2, ultimaColumna).Merge();
        hoja.Cell(2, 1).Style.Font.FontSize = 9;
        hoja.Cell(2, 1).Style.Font.FontColor = XLColor.FromHtml("#475569");

        hoja.Cell(3, 1).Value = $"INFORME GERENCIAL — {titulo}";
        hoja.Range(3, 1, 3, ultimaColumna).Merge();
        hoja.Cell(3, 1).Style.Font.Bold = true;
        hoja.Cell(3, 1).Style.Font.FontSize = 12;
        hoja.Cell(3, 1).Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        hoja.Cell(4, 1).Value =
            $"Período: {desde:dd/MM/yyyy} al {hasta:dd/MM/yyyy} · Generado: {DateTime.Now:dd/MM/yyyy HH:mm} · Usuario: {usuario}";
        hoja.Range(4, 1, 4, ultimaColumna).Merge();
        hoja.Cell(4, 1).Style.Font.FontSize = 9;
        hoja.Cell(4, 1).Style.Font.FontColor = XLColor.FromHtml("#64748B");

        var indicadores = new (string Etiqueta, decimal Valor, bool Moneda)[]
        {
            ("VENTAS DEL PERÍODO", resumen.TotalVentas, true),
            ("COMPRAS DEL PERÍODO", resumen.TotalCompras, true),
            ("NOTAS DE CRÉDITO", resumen.TotalNotasCredito, true),
            ("NOTAS DE DÉBITO", resumen.TotalNotasDebito, true),
            ("DOCUMENTOS DEL PERÍODO", resumen.CantidadVentas + resumen.CantidadCompras, false)
        };

        for (var columna = 1; columna <= Math.Min(indicadores.Length, columnas); columna++)
        {
            var indicador = indicadores[columna - 1];
            hoja.Cell(6, columna).Value = indicador.Etiqueta;
            hoja.Cell(6, columna).Style.Font.Bold = true;
            hoja.Cell(6, columna).Style.Font.FontSize = 8;
            hoja.Cell(6, columna).Style.Font.FontColor = XLColor.FromHtml("#475569");

            if (indicador.Moneda)
            {
                hoja.Cell(7, columna).Value = indicador.Valor;
                hoja.Cell(7, columna).Style.NumberFormat.Format = "\"Q\" #,##0.00";
            }
            else
            {
                hoja.Cell(7, columna).Value = indicador.Valor;
                hoja.Cell(7, columna).Style.NumberFormat.Format = "#,##0";
            }

            hoja.Cell(7, columna).Style.Font.Bold = true;
            hoja.Cell(7, columna).Style.Font.FontSize = 11;
        }

        hoja.Row(1).Height = 24;
        hoja.Row(3).Height = 18;
        hoja.Row(6).Height = 14;
        hoja.Row(7).Height = 18;

        return 9;
    }

    private static int EscribirTabla(
        IXLWorksheet hoja, int fila,
        string[] encabezados, double[] anchos, int cantidadFilas,
        Func<int, object?[]> valorFila,
        decimal?[]? totales,
        string? textoTotal = null,
        int[]? columnasCantidad = null)
    {
        AplicarAnchos(hoja, anchos);

        for (var columna = 1; columna <= encabezados.Length; columna++)
        {
            var celda = hoja.Cell(fila, columna);
            celda.Value = encabezados[columna - 1];
            celda.Style.Fill.BackgroundColor = XLColor.FromHtml(FondoEncabezado);
            celda.Style.Font.Bold = true;
            celda.Style.Font.FontColor = XLColor.White;
            celda.Style.Font.FontSize = 9;
            celda.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            celda.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }

        hoja.Row(fila).Height = 22;
        fila++;

        for (var indice = 0; indice < cantidadFilas; indice++)
        {
            var valores = valorFila(indice);
            for (var columna = 1; columna <= encabezados.Length; columna++)
            {
                var celda = hoja.Cell(fila, columna);
                var valor = valores[columna - 1];

                if (valor is DateTime fecha)
                {
                    celda.Value = fecha;
                    celda.Style.NumberFormat.Format = "dd/mm/yyyy";
                }
                else if (valor is decimal numero)
                {
                    celda.Value = numero;
                    celda.Style.NumberFormat.Format =
                        columnasCantidad?.Contains(columna) == true
                            ? "#,##0.####"
                            : "\"Q\" #,##0.00";
                }
                else if (valor is int entero)
                {
                    celda.Value = entero;
                }
                else
                {
                    celda.Value = valor?.ToString() ?? "";
                }

                celda.Style.Font.FontSize = 9;
                celda.Style.Border.BottomBorder = XLBorderStyleValues.Hair;
                celda.Style.Border.BottomBorderColor = XLColor.FromHtml(Borde);
                if (indice % 2 == 1)
                {
                    celda.Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
                }
            }

            fila++;
        }

        var filaFinDatos = fila - 1;

        if (totales is not null)
        {
            hoja.Cell(fila, 1).Value = "TOTALES";
            for (var columna = 2; columna <= encabezados.Length; columna++)
            {
                var total = totales.Length >= columna ? totales[columna - 1] : null;
                if (total.HasValue)
                {
                    hoja.Cell(fila, columna).Value = total.Value;
                    hoja.Cell(fila, columna).Style.NumberFormat.Format =
                        columna == 3 ? "#,##0.####" : "\"Q\" #,##0.00";
                }
            }

            if (!string.IsNullOrWhiteSpace(textoTotal))
            {
                hoja.Cell(fila, encabezados.Length).Value = textoTotal;
            }

            for (var columna = 1; columna <= encabezados.Length; columna++)
            {
                var celda = hoja.Cell(fila, columna);
                celda.Style.Font.Bold = true;
                celda.Style.Font.FontSize = 9;
                celda.Style.Fill.BackgroundColor = XLColor.FromHtml(FondoSubtotal);
                celda.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                celda.Style.Border.TopBorderColor = XLColor.FromHtml(FondoEncabezado);
            }

            fila++;
        }

        return fila;
    }

    private static void FinalizarHoja(IXLWorksheet hoja, int filaEncabezado, int filaFin)
    {
        hoja.SheetView.FreezeRows(filaEncabezado);

        // filaFin es la fila siguiente a los totales; el filtro cubre solo datos.
        var ultimaFilaDatos = filaFin - 2;
        if (ultimaFilaDatos > filaEncabezado)
        {
            hoja.Range(filaEncabezado, 1, ultimaFilaDatos, hoja.LastColumnUsed()?.ColumnNumber() ?? 1)
                .SetAutoFilter();
        }

        ConfigurarImpresion(hoja, filaEncabezado, filaFin);
    }

    private static void ConfigurarImpresion(IXLWorksheet hoja, int filaEncabezado, int filaFin)
    {
        hoja.PageSetup.PageOrientation = XLPageOrientation.Landscape;
        hoja.PageSetup.PaperSize = XLPaperSize.A4Paper;
        hoja.PageSetup.PagesWide = 1;
        hoja.PageSetup.PagesTall = 0;
        hoja.PageSetup.SetRowsToRepeatAtTop(filaEncabezado, filaEncabezado);
        hoja.PageSetup.Margins.Top = 0.5;
        hoja.PageSetup.Margins.Bottom = 0.5;
        hoja.PageSetup.Margins.Left = 0.4;
        hoja.PageSetup.Margins.Right = 0.4;

        var ultimaColumna = hoja.LastColumnUsed()?.ColumnNumber() ?? 1;
        hoja.PageSetup.PrintAreas.Add(1, 1, Math.Max(filaFin, filaEncabezado), ultimaColumna);
    }

    private static void AplicarAnchos(IXLWorksheet hoja, params double[] anchos)
    {
        for (var columna = 1; columna <= anchos.Length; columna++)
        {
            hoja.Column(columna).Width = anchos[columna - 1];
        }
    }

    private static string NormalizarTipo(string? tipo) => (tipo ?? "resumen").Trim().ToLowerInvariant() switch
    {
        "ventas" => "ventas",
        "compras" => "compras",
        "notas" => "notas",
        _ => "resumen"
    };

    private static string Valor(Dictionary<string, string> empresa, string clave, string defecto) =>
        empresa.TryGetValue(clave, out var valor) && !string.IsNullOrWhiteSpace(valor) ? valor : defecto;

    private static string Etiqueta(Dictionary<string, string> empresa, string clave, string prefijo) =>
        empresa.TryGetValue(clave, out var valor) && !string.IsNullOrWhiteSpace(valor)
            ? $"{prefijo}{valor}"
            : "";
}

using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioNotas
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioSecuencias _secuencias;
    private readonly ServicioInventario _inventario;
    private readonly ServicioParametros _parametros;
    private readonly ServicioBitacora _bitacora;

    public ServicioNotas(
        ContextoInventarios contexto,
        ServicioSecuencias secuencias,
        ServicioInventario inventario,
        ServicioParametros parametros,
        ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _secuencias = secuencias;
        _inventario = inventario;
        _parametros = parametros;
        _bitacora = bitacora;
    }

    public async Task<ResultadoPaginado<NotaResumenDto>> ListarAsync(
        ConsultaPaginada consulta,
        DateTime? desde,
        DateTime? hasta,
        string? tipo,
        int? ventaId,
        string? estado)
    {
        var query = _contexto.NotasAjuste.AsNoTracking().AsQueryable();

        if (desde.HasValue)
        {
            query = query.Where(nota => nota.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(nota => nota.Fecha < limite);
        }

        if (!string.IsNullOrWhiteSpace(tipo) && Enum.TryParse<TipoNota>(tipo, true, out var tipoNota))
        {
            query = query.Where(nota => nota.Tipo == tipoNota);
        }

        if (ventaId.HasValue)
        {
            query = query.Where(nota => nota.VentaId == ventaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoDocumento>(estado, true, out var estadoDocumento))
        {
            query = query.Where(nota => nota.Estado == estadoDocumento);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(nota =>
                nota.Numero.Contains(termino) ||
                nota.Motivo.Contains(termino) ||
                nota.Venta.Numero.Contains(termino));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(nota => nota.Fecha)
            .ThenByDescending(nota => nota.Id)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(nota => new NotaResumenDto
            {
                Id = nota.Id,
                Numero = nota.Numero,
                Tipo = nota.Tipo.ToString(),
                Fecha = nota.Fecha,
                VentaId = nota.VentaId,
                VentaNumero = nota.Venta.Numero,
                Cliente = nota.Venta.Cliente != null ? nota.Venta.Cliente.Nombre : "Consumidor final",
                Motivo = nota.Motivo,
                Total = nota.Total,
                Estado = nota.Estado.ToString()
            })
            .ToListAsync();

        return new ResultadoPaginado<NotaResumenDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        };
    }

    public async Task<NotaDto> ObtenerAsync(int id)
    {
        var nota = await _contexto.NotasAjuste
            .AsNoTracking()
            .Include(nota => nota.Venta)
                .ThenInclude(venta => venta.Cliente)
            .Include(nota => nota.Usuario)
            .Include(nota => nota.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .FirstOrDefaultAsync(nota => nota.Id == id)
            ?? throw new ExcepcionNegocio("Nota no encontrada.");

        return Mapear(nota);
    }

    public async Task<NotaDto> CrearAsync(NotaCrearSolicitud solicitud, int usuarioId)
    {
        if (solicitud.Detalles.Count == 0)
        {
            throw new ExcepcionNegocio("La nota debe tener al menos un producto.");
        }

        if (solicitud.Detalles.GroupBy(detalle => detalle.ProductoId).Any(grupo => grupo.Count() > 1))
        {
            throw new ExcepcionNegocio("No se puede repetir el mismo producto en la nota.");
        }

        var tipo = InterpretarTipo(solicitud.Tipo);

        var venta = await _contexto.Ventas
            .Include(venta => venta.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .FirstOrDefaultAsync(venta => venta.Id == solicitud.VentaId)
            ?? throw new ExcepcionNegocio("La venta no existe.");

        if (venta.Estado == EstadoDocumento.Anulada)
        {
            throw new ExcepcionNegocio("No se pueden registrar notas sobre una venta anulada.");
        }

        var productosVenta = venta.Detalles.Select(detalle => detalle.ProductoId).ToHashSet();

        var idsProductos = solicitud.Detalles.Select(detalle => detalle.ProductoId).ToList();
        var productos = await _contexto.Productos
            .Where(producto => idsProductos.Contains(producto.Id))
            .ToDictionaryAsync(producto => producto.Id);

        var detalles = new List<NotaAjusteDetalle>();

        foreach (var linea in solicitud.Detalles)
        {
            if (!productos.TryGetValue(linea.ProductoId, out var producto))
            {
                throw new ExcepcionNegocio($"El producto con id {linea.ProductoId} no existe.");
            }

            if (!productosVenta.Contains(producto.Id))
            {
                throw new ExcepcionNegocio($"El producto '{producto.Nombre}' no pertenece a la venta {venta.Numero}.");
            }

            if (linea.Cantidad <= 0 || linea.PrecioUnitario < 0)
            {
                throw new ExcepcionNegocio("Las cantidades y los precios de la nota no son válidos.");
            }

            detalles.Add(new NotaAjusteDetalle
            {
                ProductoId = linea.ProductoId,
                Cantidad = linea.Cantidad,
                PrecioUnitario = linea.PrecioUnitario,
                Subtotal = Math.Round(linea.Cantidad * linea.PrecioUnitario, 2, MidpointRounding.AwayFromZero)
            });
        }

        var subtotal = detalles.Sum(detalle => detalle.Subtotal);
        var impuestoPorcentaje = solicitud.ImpuestoPorcentaje ?? await _parametros.ImpuestoPorcentajeAsync();

        if (impuestoPorcentaje is < 0 or > 100)
        {
            throw new ExcepcionNegocio("El porcentaje de impuesto debe estar entre 0 y 100.");
        }

        var impuesto = Math.Round(subtotal * impuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);
        var totalNota = subtotal + impuesto;

        if (tipo == TipoNota.Credito)
        {
            var notasCreditoPrevias = await _contexto.NotasAjuste
                .Where(nota => nota.VentaId == venta.Id &&
                               nota.Tipo == TipoNota.Credito &&
                               nota.Estado == EstadoDocumento.Registrada)
                .SumAsync(nota => (decimal?)nota.Total) ?? 0m;

            if (notasCreditoPrevias + totalNota > venta.Total)
            {
                throw new ExcepcionNegocio(
                    $"El total de notas de crédito ({notasCreditoPrevias + totalNota:0.00}) supera el total de la venta ({venta.Total:0.00}).");
            }
        }

        var fecha = solicitud.Fecha ?? DateTime.Now;

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            var clavePrefijo = tipo == TipoNota.Credito ? "Documento.PrefijoNotaCredito" : "Documento.PrefijoNotaDebito";
            var prefijoDefecto = tipo == TipoNota.Credito ? "NC" : "ND";
            var tipoSecuencia = tipo == TipoNota.Credito ? "NotaCredito" : "NotaDebito";
            var prefijo = await _parametros.ObtenerPrefijoAsync(clavePrefijo, prefijoDefecto);
            var numero = await _secuencias.GenerarNumeroAsync(tipoSecuencia, prefijo);

            var nota = new NotaAjuste
            {
                Numero = numero,
                Tipo = tipo,
                Fecha = fecha,
                VentaId = venta.Id,
                Motivo = solicitud.Motivo.Trim(),
                Subtotal = subtotal,
                ImpuestoPorcentaje = impuestoPorcentaje,
                Impuesto = impuesto,
                Total = totalNota,
                Estado = EstadoDocumento.Registrada,
                UsuarioId = usuarioId,
                Detalles = detalles
            };

            _contexto.NotasAjuste.Add(nota);
            await _contexto.SaveChangesAsync();

            foreach (var detalle in nota.Detalles)
            {
                var producto = productos[detalle.ProductoId];

                if (tipo == TipoNota.Credito)
                {
                    await _inventario.RegistrarEntradaAsync(
                        producto,
                        detalle.Cantidad,
                        producto.PrecioCosto,
                        OrigenMovimiento.NotaCredito,
                        nota.Id,
                        nota.Numero,
                        usuarioId,
                        $"Nota de crédito {nota.Numero}",
                        fecha);
                }
                else
                {
                    await _inventario.RegistrarSalidaAsync(
                        producto,
                        detalle.Cantidad,
                        producto.PrecioCosto,
                        OrigenMovimiento.NotaDebito,
                        nota.Id,
                        nota.Numero,
                        usuarioId,
                        $"Nota de débito {nota.Numero}",
                        fecha);
                }
            }

            _bitacora.Registrar(
                tipo == TipoNota.Credito ? "Nota de crédito" : "Nota de débito",
                "Notas",
                nota.Id,
                $"{nota.Numero} sobre venta {venta.Numero} por {nota.Total:0.00}");

            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(nota.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    public async Task<NotaDto> AnularAsync(int id, int usuarioId)
    {
        var nota = await _contexto.NotasAjuste
            .Include(nota => nota.Venta)
            .Include(nota => nota.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .FirstOrDefaultAsync(nota => nota.Id == id)
            ?? throw new ExcepcionNegocio("Nota no encontrada.");

        if (nota.Estado == EstadoDocumento.Anulada)
        {
            throw new ExcepcionNegocio("La nota ya está anulada.");
        }

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            foreach (var detalle in nota.Detalles)
            {
                if (nota.Tipo == TipoNota.Credito)
                {
                    await _inventario.RegistrarSalidaAsync(
                        detalle.Producto,
                        detalle.Cantidad,
                        detalle.Producto.PrecioCosto,
                        OrigenMovimiento.Anulacion,
                        nota.Id,
                        nota.Numero,
                        usuarioId,
                        $"Anulación de nota de crédito {nota.Numero}",
                        DateTime.Now);
                }
                else
                {
                    await _inventario.RegistrarEntradaAsync(
                        detalle.Producto,
                        detalle.Cantidad,
                        detalle.Producto.PrecioCosto,
                        OrigenMovimiento.Anulacion,
                        nota.Id,
                        nota.Numero,
                        usuarioId,
                        $"Anulación de nota de débito {nota.Numero}",
                        DateTime.Now);
                }
            }

            nota.Estado = EstadoDocumento.Anulada;
            nota.FechaAnulacion = DateTime.Now;

            _bitacora.Registrar("Anulación de nota", "Notas", nota.Id, $"Nota {nota.Numero}");
            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(nota.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    private static TipoNota InterpretarTipo(string tipo)
    {
        var normalizado = tipo.Trim().ToLowerInvariant();

        if (normalizado.StartsWith("cred") || normalizado.Contains("crédito"))
        {
            return TipoNota.Credito;
        }

        if (normalizado.StartsWith("deb") || normalizado.Contains("débito"))
        {
            return TipoNota.Debito;
        }

        throw new ExcepcionNegocio("El tipo de nota debe ser Crédito o Débito.");
    }

    private static NotaDto Mapear(NotaAjuste nota) => new()
    {
        Id = nota.Id,
        Numero = nota.Numero,
        Tipo = nota.Tipo.ToString(),
        Fecha = nota.Fecha,
        VentaId = nota.VentaId,
        VentaNumero = nota.Venta.Numero,
        Cliente = nota.Venta.Cliente?.Nombre ?? "Consumidor final",
        Motivo = nota.Motivo,
        Subtotal = nota.Subtotal,
        ImpuestoPorcentaje = nota.ImpuestoPorcentaje,
        Impuesto = nota.Impuesto,
        Total = nota.Total,
        Estado = nota.Estado.ToString(),
        Usuario = nota.Usuario.NombreCompleto,
        FechaAnulacion = nota.FechaAnulacion,
        Detalles = nota.Detalles.Select(detalle => new NotaDetalleDto
        {
            Id = detalle.Id,
            ProductoId = detalle.ProductoId,
            CodigoProducto = detalle.Producto.Codigo,
            Producto = detalle.Producto.Nombre,
            Cantidad = detalle.Cantidad,
            PrecioUnitario = detalle.PrecioUnitario,
            Subtotal = detalle.Subtotal
        }).ToList()
    };
}

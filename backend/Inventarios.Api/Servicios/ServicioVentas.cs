using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioVentas
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioSecuencias _secuencias;
    private readonly ServicioInventario _inventario;
    private readonly ServicioParametros _parametros;
    private readonly ServicioBitacora _bitacora;

    public ServicioVentas(
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

    public async Task<ResultadoPaginado<VentaResumenDto>> ListarAsync(
        ConsultaPaginada consulta,
        DateTime? desde,
        DateTime? hasta,
        int? clienteId,
        string? estado)
    {
        var query = _contexto.Ventas.AsNoTracking().AsQueryable();

        if (desde.HasValue)
        {
            query = query.Where(venta => venta.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(venta => venta.Fecha < limite);
        }

        if (clienteId.HasValue)
        {
            query = query.Where(venta => venta.ClienteId == clienteId.Value);
        }

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoDocumento>(estado, true, out var estadoDocumento))
        {
            query = query.Where(venta => venta.Estado == estadoDocumento);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(venta =>
                venta.Numero.Contains(termino) ||
                (venta.Cliente != null && venta.Cliente.Nombre.Contains(termino)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(venta => venta.Fecha)
            .ThenByDescending(venta => venta.Id)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(venta => new VentaResumenDto
            {
                Id = venta.Id,
                Numero = venta.Numero,
                Fecha = venta.Fecha,
                Cliente = venta.Cliente != null ? venta.Cliente.Nombre : "Consumidor final",
                Usuario = venta.Usuario.NombreCompleto,
                Total = venta.Total,
                FormaPago = venta.FormaPago,
                Estado = venta.Estado.ToString(),
                CantidadProductos = venta.Detalles.Count
            })
            .ToListAsync();

        return new ResultadoPaginado<VentaResumenDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        };
    }

    public async Task<VentaDto> ObtenerAsync(int id)
    {
        var venta = await _contexto.Ventas
            .AsNoTracking()
            .Include(venta => venta.Cliente)
            .Include(venta => venta.Usuario)
            .Include(venta => venta.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .Include(venta => venta.Notas)
            .FirstOrDefaultAsync(venta => venta.Id == id)
            ?? throw new ExcepcionNegocio("Venta no encontrada.");

        return Mapear(venta);
    }

    public async Task<VentaDto> CrearAsync(VentaCrearSolicitud solicitud, int usuarioId)
    {
        if (solicitud.Detalles.Count == 0)
        {
            throw new ExcepcionNegocio("La venta debe tener al menos un producto.");
        }

        if (solicitud.Detalles.GroupBy(detalle => detalle.ProductoId).Any(grupo => grupo.Count() > 1))
        {
            throw new ExcepcionNegocio("No se puede repetir el mismo producto en la venta.");
        }

        Cliente? cliente = null;

        if (solicitud.ClienteId.HasValue)
        {
            cliente = await _contexto.Clientes
                .FirstOrDefaultAsync(cliente => cliente.Id == solicitud.ClienteId.Value && cliente.Activo)
                ?? throw new ExcepcionNegocio("El cliente no existe o está inactivo.");
        }

        var idsProductos = solicitud.Detalles.Select(detalle => detalle.ProductoId).ToList();
        var productos = await _contexto.Productos
            .Where(producto => idsProductos.Contains(producto.Id))
            .ToDictionaryAsync(producto => producto.Id);

        var detalles = new List<VentaDetalle>();

        foreach (var linea in solicitud.Detalles)
        {
            if (!productos.TryGetValue(linea.ProductoId, out var producto))
            {
                throw new ExcepcionNegocio($"El producto con id {linea.ProductoId} no existe.");
            }

            if (!producto.Activo)
            {
                throw new ExcepcionNegocio($"El producto '{producto.Nombre}' está inactivo.");
            }

            if (linea.Cantidad <= 0 || linea.PrecioUnitario < 0 || linea.Descuento < 0)
            {
                throw new ExcepcionNegocio("Las cantidades, precios y descuentos de la venta no son válidos.");
            }

            var subtotalLinea = Math.Round(linea.Cantidad * linea.PrecioUnitario, 2, MidpointRounding.AwayFromZero) - linea.Descuento;

            if (subtotalLinea < 0)
            {
                throw new ExcepcionNegocio($"El descuento supera el valor de la línea del producto '{producto.Nombre}'.");
            }

            detalles.Add(new VentaDetalle
            {
                ProductoId = linea.ProductoId,
                Cantidad = linea.Cantidad,
                PrecioUnitario = linea.PrecioUnitario,
                Descuento = linea.Descuento,
                Subtotal = Math.Round(subtotalLinea, 2, MidpointRounding.AwayFromZero)
            });
        }

        var subtotal = detalles.Sum(detalle => detalle.Subtotal);

        if (solicitud.Descuento < 0 || solicitud.Descuento > subtotal)
        {
            throw new ExcepcionNegocio("El descuento general no puede superar el subtotal de la venta.");
        }

        var baseImponible = subtotal - solicitud.Descuento;
        var impuestoPorcentaje = solicitud.ImpuestoPorcentaje ?? await _parametros.ImpuestoPorcentajeAsync();

        if (impuestoPorcentaje is < 0 or > 100)
        {
            throw new ExcepcionNegocio("El porcentaje de impuesto debe estar entre 0 y 100.");
        }

        var impuesto = Math.Round(baseImponible * impuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);
        var fecha = solicitud.Fecha ?? DateTime.Now;

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            var prefijo = await _parametros.ObtenerPrefijoAsync("Documento.PrefijoVenta", "VENT");
            var numero = await _secuencias.GenerarNumeroAsync("Venta", prefijo);

            var venta = new Venta
            {
                Numero = numero,
                Fecha = fecha,
                ClienteId = cliente?.Id,
                UsuarioId = usuarioId,
                Subtotal = subtotal,
                Descuento = solicitud.Descuento,
                ImpuestoPorcentaje = impuestoPorcentaje,
                Impuesto = impuesto,
                Total = baseImponible + impuesto,
                FormaPago = solicitud.FormaPago.Trim(),
                Estado = EstadoDocumento.Registrada,
                Observaciones = solicitud.Observaciones?.Trim(),
                Detalles = detalles
            };

            _contexto.Ventas.Add(venta);
            await _contexto.SaveChangesAsync();

            foreach (var detalle in venta.Detalles)
            {
                var producto = productos[detalle.ProductoId];
                await _inventario.RegistrarSalidaAsync(
                    producto,
                    detalle.Cantidad,
                    producto.PrecioCosto,
                    OrigenMovimiento.Venta,
                    venta.Id,
                    venta.Numero,
                    usuarioId,
                    $"Venta {venta.Numero}",
                    fecha);
            }

            _bitacora.Registrar("Registro de venta", "Ventas", venta.Id, $"Venta {venta.Numero} por {venta.Total:0.00}");
            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(venta.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    public async Task<VentaDto> AnularAsync(int id, int usuarioId)
    {
        var venta = await _contexto.Ventas
            .Include(venta => venta.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .Include(venta => venta.Notas)
            .FirstOrDefaultAsync(venta => venta.Id == id)
            ?? throw new ExcepcionNegocio("Venta no encontrada.");

        if (venta.Estado == EstadoDocumento.Anulada)
        {
            throw new ExcepcionNegocio("La venta ya está anulada.");
        }

        if (venta.Notas.Any(nota => nota.Estado == EstadoDocumento.Registrada))
        {
            throw new ExcepcionNegocio("No se puede anular la venta porque tiene notas de crédito o débito registradas.");
        }

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            foreach (var detalle in venta.Detalles)
            {
                await _inventario.RegistrarEntradaAsync(
                    detalle.Producto,
                    detalle.Cantidad,
                    detalle.Producto.PrecioCosto,
                    OrigenMovimiento.Anulacion,
                    venta.Id,
                    venta.Numero,
                    usuarioId,
                    $"Anulación de venta {venta.Numero}",
                    DateTime.Now);
            }

            venta.Estado = EstadoDocumento.Anulada;
            venta.FechaAnulacion = DateTime.Now;
            venta.UsuarioAnulacionId = usuarioId;

            _bitacora.Registrar("Anulación de venta", "Ventas", venta.Id, $"Venta {venta.Numero}");
            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(venta.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    private static VentaDto Mapear(Venta venta) => new()
    {
        Id = venta.Id,
        Numero = venta.Numero,
        Fecha = venta.Fecha,
        ClienteId = venta.ClienteId,
        Cliente = venta.Cliente?.Nombre ?? "Consumidor final",
        Usuario = venta.Usuario.NombreCompleto,
        Subtotal = venta.Subtotal,
        Descuento = venta.Descuento,
        ImpuestoPorcentaje = venta.ImpuestoPorcentaje,
        Impuesto = venta.Impuesto,
        Total = venta.Total,
        FormaPago = venta.FormaPago,
        Estado = venta.Estado.ToString(),
        Observaciones = venta.Observaciones,
        FechaAnulacion = venta.FechaAnulacion,
        Detalles = venta.Detalles.Select(detalle => new VentaDetalleDto
        {
            Id = detalle.Id,
            ProductoId = detalle.ProductoId,
            CodigoProducto = detalle.Producto.Codigo,
            Producto = detalle.Producto.Nombre,
            Cantidad = detalle.Cantidad,
            PrecioUnitario = detalle.PrecioUnitario,
            Descuento = detalle.Descuento,
            Subtotal = detalle.Subtotal
        }).ToList(),
        Notas = venta.Notas
            .OrderByDescending(nota => nota.Fecha)
            .Select(nota => new NotaResumenDto
            {
                Id = nota.Id,
                Numero = nota.Numero,
                Tipo = nota.Tipo.ToString(),
                Fecha = nota.Fecha,
                VentaId = nota.VentaId,
                VentaNumero = venta.Numero,
                Cliente = venta.Cliente?.Nombre ?? "Consumidor final",
                Motivo = nota.Motivo,
                Total = nota.Total,
                Estado = nota.Estado.ToString()
            })
            .ToList()
    };
}

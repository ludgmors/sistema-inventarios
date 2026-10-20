using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioCompras
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioSecuencias _secuencias;
    private readonly ServicioInventario _inventario;
    private readonly ServicioParametros _parametros;
    private readonly ServicioBitacora _bitacora;

    public ServicioCompras(
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

    public async Task<ResultadoPaginado<CompraResumenDto>> ListarAsync(
        ConsultaPaginada consulta,
        DateTime? desde,
        DateTime? hasta,
        int? proveedorId,
        string? estado)
    {
        var query = _contexto.Compras.AsNoTracking().AsQueryable();

        if (desde.HasValue)
        {
            query = query.Where(compra => compra.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(compra => compra.Fecha < limite);
        }

        if (proveedorId.HasValue)
        {
            query = query.Where(compra => compra.ProveedorId == proveedorId.Value);
        }

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoDocumento>(estado, true, out var estadoDocumento))
        {
            query = query.Where(compra => compra.Estado == estadoDocumento);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(compra =>
                compra.Numero.Contains(termino) ||
                compra.Proveedor.RazonSocial.Contains(termino));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(compra => compra.Fecha)
            .ThenByDescending(compra => compra.Id)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(compra => new CompraResumenDto
            {
                Id = compra.Id,
                Numero = compra.Numero,
                Fecha = compra.Fecha,
                Proveedor = compra.Proveedor.RazonSocial,
                Usuario = compra.Usuario.NombreCompleto,
                Total = compra.Total,
                Estado = compra.Estado.ToString(),
                CantidadProductos = compra.Detalles.Count
            })
            .ToListAsync();

        return new ResultadoPaginado<CompraResumenDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        };
    }

    public async Task<CompraDto> ObtenerAsync(int id)
    {
        var compra = await _contexto.Compras
            .AsNoTracking()
            .Include(compra => compra.Proveedor)
            .Include(compra => compra.Usuario)
            .Include(compra => compra.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .FirstOrDefaultAsync(compra => compra.Id == id)
            ?? throw new ExcepcionNegocio("Compra no encontrada.");

        return Mapear(compra);
    }

    public async Task<CompraDto> CrearAsync(CompraCrearSolicitud solicitud, int usuarioId)
    {
        if (solicitud.Detalles.Count == 0)
        {
            throw new ExcepcionNegocio("La compra debe tener al menos un producto.");
        }

        if (solicitud.Detalles.GroupBy(detalle => detalle.ProductoId).Any(grupo => grupo.Count() > 1))
        {
            throw new ExcepcionNegocio("No se puede repetir el mismo producto en la compra.");
        }

        var proveedor = await _contexto.Proveedores
            .FirstOrDefaultAsync(proveedor => proveedor.Id == solicitud.ProveedorId && proveedor.Activo)
            ?? throw new ExcepcionNegocio("El proveedor no existe o está inactivo.");

        var idsProductos = solicitud.Detalles.Select(detalle => detalle.ProductoId).ToList();
        var productos = await _contexto.Productos
            .Where(producto => idsProductos.Contains(producto.Id))
            .ToDictionaryAsync(producto => producto.Id);

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

            if (linea.Cantidad <= 0 || linea.PrecioUnitario < 0)
            {
                throw new ExcepcionNegocio("Las cantidades y los precios de la compra no son válidos.");
            }
        }

        var detalles = solicitud.Detalles.Select(linea => new CompraDetalle
        {
            ProductoId = linea.ProductoId,
            Cantidad = linea.Cantidad,
            PrecioUnitario = linea.PrecioUnitario,
            Subtotal = Math.Round(linea.Cantidad * linea.PrecioUnitario, 2, MidpointRounding.AwayFromZero)
        }).ToList();

        var subtotal = detalles.Sum(detalle => detalle.Subtotal);
        var impuestoPorcentaje = solicitud.ImpuestoPorcentaje ?? await _parametros.ImpuestoPorcentajeAsync();

        if (impuestoPorcentaje is < 0 or > 100)
        {
            throw new ExcepcionNegocio("El porcentaje de impuesto debe estar entre 0 y 100.");
        }

        var impuesto = Math.Round(subtotal * impuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            var prefijo = await _parametros.ObtenerPrefijoAsync("Documento.PrefijoCompra", "COMP");
            var numero = await _secuencias.GenerarNumeroAsync("Compra", prefijo);
            var fecha = solicitud.Fecha ?? DateTime.Now;

            var compra = new Compra
            {
                Numero = numero,
                Fecha = fecha,
                ProveedorId = proveedor.Id,
                UsuarioId = usuarioId,
                Subtotal = subtotal,
                ImpuestoPorcentaje = impuestoPorcentaje,
                Impuesto = impuesto,
                Total = subtotal + impuesto,
                Estado = EstadoDocumento.Registrada,
                Observaciones = solicitud.Observaciones?.Trim(),
                Detalles = detalles
            };

            _contexto.Compras.Add(compra);
            await _contexto.SaveChangesAsync();

            foreach (var detalle in compra.Detalles)
            {
                var producto = productos[detalle.ProductoId];
                await _inventario.RegistrarEntradaAsync(
                    producto,
                    detalle.Cantidad,
                    detalle.PrecioUnitario,
                    OrigenMovimiento.Compra,
                    compra.Id,
                    compra.Numero,
                    usuarioId,
                    $"Compra {compra.Numero}",
                    fecha,
                    actualizarCostoPromedio: true);
            }

            _bitacora.Registrar("Registro de compra", "Compras", compra.Id, $"Compra {compra.Numero} por {compra.Total:0.00}");
            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(compra.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    public async Task<CompraDto> AnularAsync(int id, int usuarioId)
    {
        var compra = await _contexto.Compras
            .Include(compra => compra.Detalles)
                .ThenInclude(detalle => detalle.Producto)
            .FirstOrDefaultAsync(compra => compra.Id == id)
            ?? throw new ExcepcionNegocio("Compra no encontrada.");

        if (compra.Estado == EstadoDocumento.Anulada)
        {
            throw new ExcepcionNegocio("La compra ya está anulada.");
        }

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            foreach (var detalle in compra.Detalles)
            {
                await _inventario.RegistrarSalidaAsync(
                    detalle.Producto,
                    detalle.Cantidad,
                    detalle.PrecioUnitario,
                    OrigenMovimiento.Anulacion,
                    compra.Id,
                    compra.Numero,
                    usuarioId,
                    $"Anulación de compra {compra.Numero}",
                    DateTime.Now);
            }

            compra.Estado = EstadoDocumento.Anulada;
            compra.FechaAnulacion = DateTime.Now;
            compra.UsuarioAnulacionId = usuarioId;

            _bitacora.Registrar("Anulación de compra", "Compras", compra.Id, $"Compra {compra.Numero}");
            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return await ObtenerAsync(compra.Id);
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }

    private static CompraDto Mapear(Compra compra) => new()
    {
        Id = compra.Id,
        Numero = compra.Numero,
        Fecha = compra.Fecha,
        ProveedorId = compra.ProveedorId,
        Proveedor = compra.Proveedor.RazonSocial,
        Usuario = compra.Usuario.NombreCompleto,
        Subtotal = compra.Subtotal,
        ImpuestoPorcentaje = compra.ImpuestoPorcentaje,
        Impuesto = compra.Impuesto,
        Total = compra.Total,
        Estado = compra.Estado.ToString(),
        Observaciones = compra.Observaciones,
        FechaAnulacion = compra.FechaAnulacion,
        Detalles = compra.Detalles.Select(detalle => new CompraDetalleDto
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

using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioReportes
{
    private readonly ContextoInventarios _contexto;

    public ServicioReportes(ContextoInventarios contexto)
    {
        _contexto = contexto;
    }

    public async Task<ResultadoPaginado<ExistenciaDto>> ExistenciasAsync(
        ConsultaPaginada consulta,
        int? categoriaId,
        bool? soloBajoMinimo,
        bool? soloActivos)
    {
        var query = _contexto.Productos.AsNoTracking().AsQueryable();

        if (categoriaId.HasValue)
        {
            query = query.Where(producto => producto.CategoriaId == categoriaId.Value);
        }

        if (soloBajoMinimo == true)
        {
            query = query.Where(producto => producto.ExistenciaActual <= producto.ExistenciaMinima);
        }

        if (soloActivos == true)
        {
            query = query.Where(producto => producto.Activo);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(producto =>
                producto.Codigo.Contains(termino) ||
                producto.Nombre.Contains(termino) ||
                producto.Categoria.Nombre.Contains(termino));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(producto => producto.Nombre)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(producto => new ExistenciaDto
            {
                ProductoId = producto.Id,
                Codigo = producto.Codigo,
                Nombre = producto.Nombre,
                Categoria = producto.Categoria.Nombre,
                UnidadMedida = producto.UnidadMedida,
                ExistenciaActual = producto.ExistenciaActual,
                ExistenciaMinima = producto.ExistenciaMinima,
                PrecioCosto = producto.PrecioCosto,
                PrecioVenta = producto.PrecioVenta,
                ValorCosto = producto.ExistenciaActual * producto.PrecioCosto,
                ValorVenta = producto.ExistenciaActual * producto.PrecioVenta,
                BajoMinimo = producto.ExistenciaActual <= producto.ExistenciaMinima,
                Activo = producto.Activo
            })
            .ToListAsync();

        return new ResultadoPaginado<ExistenciaDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        };
    }

    public async Task<ResumenExistenciasDto> ResumenExistenciasAsync()
    {
        return await _contexto.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo)
            .GroupBy(_ => 1)
            .Select(grupo => new ResumenExistenciasDto
            {
                TotalProductos = grupo.Count(),
                ProductosBajoMinimo = grupo.Count(producto => producto.ExistenciaActual <= producto.ExistenciaMinima),
                UnidadesEnStock = grupo.Sum(producto => producto.ExistenciaActual),
                ValorCosto = grupo.Sum(producto => producto.ExistenciaActual * producto.PrecioCosto),
                ValorVenta = grupo.Sum(producto => producto.ExistenciaActual * producto.PrecioVenta)
            })
            .FirstOrDefaultAsync() ?? new ResumenExistenciasDto();
    }

    public async Task<List<KardexFilaDto>> KardexAsync(
        int productoId,
        DateTime? desde,
        DateTime? hasta)
    {
        var query = _contexto.MovimientosInventario
            .AsNoTracking()
            .Where(movimiento => movimiento.ProductoId == productoId);

        if (desde.HasValue)
        {
            query = query.Where(movimiento => movimiento.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(movimiento => movimiento.Fecha < limite);
        }

        return await query
            .OrderBy(movimiento => movimiento.Fecha)
            .ThenBy(movimiento => movimiento.Id)
            .Select(movimiento => new KardexFilaDto
            {
                Id = movimiento.Id,
                Fecha = movimiento.Fecha,
                Tipo = movimiento.Tipo.ToString(),
                Origen = movimiento.Origen.ToString(),
                DocumentoNumero = movimiento.DocumentoNumero,
                Cantidad = movimiento.Cantidad,
                CostoUnitario = movimiento.CostoUnitario,
                SaldoAnterior = movimiento.SaldoAnterior,
                SaldoNuevo = movimiento.SaldoNuevo,
                Usuario = movimiento.Usuario.NombreCompleto,
                Observacion = movimiento.Observacion
            })
            .ToListAsync();
    }

    public async Task<List<ReporteVentaDto>> VentasAsync(
        DateTime? desde,
        DateTime? hasta,
        int? clienteId,
        int? usuarioId,
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

        if (usuarioId.HasValue)
        {
            query = query.Where(venta => venta.UsuarioId == usuarioId.Value);
        }

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoDocumento>(estado, true, out var estadoDocumento))
        {
            query = query.Where(venta => venta.Estado == estadoDocumento);
        }

        return await query
            .OrderByDescending(venta => venta.Fecha)
            .ThenByDescending(venta => venta.Id)
            .Take(2000)
            .Select(venta => new ReporteVentaDto
            {
                Id = venta.Id,
                Numero = venta.Numero,
                Fecha = venta.Fecha,
                Cliente = venta.Cliente != null ? venta.Cliente.Nombre : "Consumidor final",
                Usuario = venta.Usuario.NombreCompleto,
                FormaPago = venta.FormaPago,
                Subtotal = venta.Subtotal,
                Impuesto = venta.Impuesto,
                Total = venta.Total,
                Estado = venta.Estado.ToString()
            })
            .ToListAsync();
    }

    public async Task<List<ReporteCompraDto>> ComprasAsync(
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

        return await query
            .OrderByDescending(compra => compra.Fecha)
            .ThenByDescending(compra => compra.Id)
            .Take(2000)
            .Select(compra => new ReporteCompraDto
            {
                Id = compra.Id,
                Numero = compra.Numero,
                Fecha = compra.Fecha,
                Proveedor = compra.Proveedor.RazonSocial,
                Usuario = compra.Usuario.NombreCompleto,
                Subtotal = compra.Subtotal,
                Impuesto = compra.Impuesto,
                Total = compra.Total,
                Estado = compra.Estado.ToString()
            })
            .ToListAsync();
    }

    public async Task<List<ReporteNotaDto>> NotasAsync(DateTime? desde, DateTime? hasta, string? tipo)
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

        return await query
            .OrderByDescending(nota => nota.Fecha)
            .Take(2000)
            .Select(nota => new ReporteNotaDto
            {
                Id = nota.Id,
                Numero = nota.Numero,
                Tipo = nota.Tipo.ToString(),
                Fecha = nota.Fecha,
                VentaNumero = nota.Venta.Numero,
                Cliente = nota.Venta.Cliente != null ? nota.Venta.Cliente.Nombre : "Consumidor final",
                Motivo = nota.Motivo,
                Total = nota.Total,
                Estado = nota.Estado.ToString()
            })
            .ToListAsync();
    }

    public async Task<List<TopProductoDto>> TopProductosAsync(DateTime? desde, DateTime? hasta, int limite)
    {
        var query = _contexto.VentaDetalles.AsNoTracking()
            .Where(detalle => detalle.Venta.Estado == EstadoDocumento.Registrada);

        if (desde.HasValue)
        {
            query = query.Where(detalle => detalle.Venta.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var fechaLimite = hasta.Value.Date.AddDays(1);
            query = query.Where(detalle => detalle.Venta.Fecha < fechaLimite);
        }

        return await query
            .GroupBy(detalle => new
            {
                detalle.ProductoId,
                detalle.Producto.Codigo,
                detalle.Producto.Nombre
            })
            .Select(grupo => new TopProductoDto
            {
                ProductoId = grupo.Key.ProductoId,
                Codigo = grupo.Key.Codigo,
                Nombre = grupo.Key.Nombre,
                CantidadVendida = grupo.Sum(detalle => detalle.Cantidad),
                TotalVendido = grupo.Sum(detalle => detalle.Subtotal)
            })
            .OrderByDescending(producto => producto.CantidadVendida)
            .Take(limite <= 0 ? 10 : limite)
            .ToListAsync();
    }

    public async Task<List<BajoMinimoDto>> BajoMinimoAsync()
    {
        return await _contexto.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo && producto.ExistenciaActual <= producto.ExistenciaMinima)
            .OrderBy(producto => producto.ExistenciaActual)
            .Select(producto => new BajoMinimoDto
            {
                ProductoId = producto.Id,
                Codigo = producto.Codigo,
                Nombre = producto.Nombre,
                Categoria = producto.Categoria.Nombre,
                ExistenciaActual = producto.ExistenciaActual,
                ExistenciaMinima = producto.ExistenciaMinima,
                Faltante = producto.ExistenciaMinima - producto.ExistenciaActual
            })
            .ToListAsync();
    }

    public async Task<ResumenPeriodoDto> ResumenPeriodoAsync(DateTime desde, DateTime hasta)
    {
        var limite = hasta.Date.AddDays(1);

        var ventas = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada &&
                            venta.Fecha >= desde.Date &&
                            venta.Fecha < limite)
            .GroupBy(_ => 1)
            .Select(grupo => new
            {
                Total = grupo.Sum(venta => venta.Total),
                Cantidad = grupo.Count()
            })
            .FirstOrDefaultAsync();

        var compras = await _contexto.Compras
            .AsNoTracking()
            .Where(compra => compra.Estado == EstadoDocumento.Registrada &&
                             compra.Fecha >= desde.Date &&
                             compra.Fecha < limite)
            .GroupBy(_ => 1)
            .Select(grupo => new
            {
                Total = grupo.Sum(compra => compra.Total),
                Cantidad = grupo.Count()
            })
            .FirstOrDefaultAsync();

        var notasCredito = await _contexto.NotasAjuste
            .AsNoTracking()
            .Where(nota => nota.Estado == EstadoDocumento.Registrada &&
                           nota.Tipo == TipoNota.Credito &&
                           nota.Fecha >= desde.Date &&
                           nota.Fecha < limite)
            .SumAsync(nota => (decimal?)nota.Total) ?? 0m;

        var notasDebito = await _contexto.NotasAjuste
            .AsNoTracking()
            .Where(nota => nota.Estado == EstadoDocumento.Registrada &&
                           nota.Tipo == TipoNota.Debito &&
                           nota.Fecha >= desde.Date &&
                           nota.Fecha < limite)
            .SumAsync(nota => (decimal?)nota.Total) ?? 0m;

        return new ResumenPeriodoDto
        {
            TotalVentas = ventas?.Total ?? 0m,
            CantidadVentas = ventas?.Cantidad ?? 0,
            TotalCompras = compras?.Total ?? 0m,
            CantidadCompras = compras?.Cantidad ?? 0,
            TotalNotasCredito = notasCredito,
            TotalNotasDebito = notasDebito
        };
    }

    private static readonly string[] NombresMes =
    {
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    };

    public async Task<DashboardDto> DashboardAsync()
    {
        var hoy = DateTime.Today;
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);
        var inicioMesAnterior = inicioMes.AddMonths(-1);
        var inicioTendencia = hoy.AddDays(-29);
        var inicioSeisMeses = inicioMes.AddMonths(-5);

        var ventasHoy = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada && venta.Fecha >= hoy)
            .SumAsync(venta => (decimal?)venta.Total) ?? 0m;

        var ventasMesConsulta = _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada && venta.Fecha >= inicioMes);

        var ventasMes = await ventasMesConsulta.SumAsync(venta => (decimal?)venta.Total) ?? 0m;
        var cantidadVentasMes = await ventasMesConsulta.CountAsync();
        var ventasNetasMes = await ventasMesConsulta
            .SumAsync(venta => (decimal?)(venta.Subtotal - venta.Descuento)) ?? 0m;

        var comprasHoy = await _contexto.Compras
            .AsNoTracking()
            .Where(compra => compra.Estado == EstadoDocumento.Registrada && compra.Fecha >= hoy)
            .SumAsync(compra => (decimal?)compra.Total) ?? 0m;

        var comprasMesConsulta = _contexto.Compras
            .AsNoTracking()
            .Where(compra => compra.Estado == EstadoDocumento.Registrada && compra.Fecha >= inicioMes);

        var comprasMes = await comprasMesConsulta.SumAsync(compra => (decimal?)compra.Total) ?? 0m;
        var cantidadComprasMes = await comprasMesConsulta.CountAsync();

        var ventasMesAnterior = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada &&
                venta.Fecha >= inicioMesAnterior && venta.Fecha < inicioMes)
            .SumAsync(venta => (decimal?)venta.Total) ?? 0m;

        var comprasMesAnterior = await _contexto.Compras
            .AsNoTracking()
            .Where(compra => compra.Estado == EstadoDocumento.Registrada &&
                compra.Fecha >= inicioMesAnterior && compra.Fecha < inicioMes)
            .SumAsync(compra => (decimal?)compra.Total) ?? 0m;

        var cantidadVentasMesAnterior = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada &&
                venta.Fecha >= inicioMesAnterior && venta.Fecha < inicioMes)
            .CountAsync();

        // El costo se toma de los movimientos de salida de las ventas vigentes.
        var costoVentasMes = await _contexto.MovimientosInventario
            .AsNoTracking()
            .Where(movimiento => movimiento.Origen == OrigenMovimiento.Venta &&
                movimiento.DocumentoId != null &&
                _contexto.Ventas.Any(venta =>
                    venta.Id == movimiento.DocumentoId.Value &&
                    venta.Estado == EstadoDocumento.Registrada &&
                    venta.Fecha >= inicioMes))
            .SumAsync(movimiento => (decimal?)(movimiento.CostoUnitario * movimiento.Cantidad)) ?? 0m;

        var margenBrutoMes = ventasNetasMes - costoVentasMes;
        var porcentajeMargenMes = ventasNetasMes > 0
            ? Math.Round(margenBrutoMes / ventasNetasMes * 100m, 2)
            : 0m;

        var valorInventarioCosto = await _contexto.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo)
            .SumAsync(producto => (decimal?)(producto.ExistenciaActual * producto.PrecioCosto)) ?? 0m;

        var valorInventarioVenta = await _contexto.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo)
            .SumAsync(producto => (decimal?)(producto.ExistenciaActual * producto.PrecioVenta)) ?? 0m;

        var ventasPorDia = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada && venta.Fecha >= inicioTendencia)
            .GroupBy(venta => venta.Fecha.Date)
            .Select(grupo => new VentaPorDiaDto
            {
                Fecha = grupo.Key,
                Total = grupo.Sum(venta => venta.Total),
                Cantidad = grupo.Count()
            })
            .ToListAsync();

        var serie = new List<VentaPorDiaDto>();

        for (var i = 0; i < 30; i++)
        {
            var dia = inicioTendencia.AddDays(i);
            var existente = ventasPorDia.FirstOrDefault(venta => venta.Fecha == dia);
            serie.Add(new VentaPorDiaDto
            {
                Fecha = dia,
                Total = existente?.Total ?? 0m,
                Cantidad = existente?.Cantidad ?? 0
            });
        }

        var ventasPorFormaPago = await ventasMesConsulta
            .GroupBy(venta => venta.FormaPago)
            .Select(grupo => new VentaFormaPagoDto
            {
                FormaPago = grupo.Key,
                Total = grupo.Sum(venta => venta.Total),
                Cantidad = grupo.Count()
            })
            .OrderByDescending(item => item.Total)
            .ToListAsync();

        var clientesAgrupados = await ventasMesConsulta
            .GroupBy(venta => venta.ClienteId)
            .Select(grupo => new
            {
                ClienteId = grupo.Key,
                Total = grupo.Sum(venta => venta.Total),
                Cantidad = grupo.Count()
            })
            .OrderByDescending(item => item.Total)
            .Take(5)
            .ToListAsync();

        var idsClientes = clientesAgrupados
            .Where(item => item.ClienteId.HasValue)
            .Select(item => item.ClienteId!.Value)
            .ToList();

        var nombresClientes = idsClientes.Count == 0
            ? new Dictionary<int, string>()
            : await _contexto.Clientes
                .AsNoTracking()
                .Where(cliente => idsClientes.Contains(cliente.Id))
                .ToDictionaryAsync(cliente => cliente.Id, cliente => cliente.Nombre);

        var topClientes = clientesAgrupados.Select(item => new TopClienteDto
        {
            ClienteId = item.ClienteId,
            Cliente = item.ClienteId is int id && nombresClientes.TryGetValue(id, out var nombre)
                ? nombre
                : "Cliente general",
            Total = item.Total,
            Cantidad = item.Cantidad
        }).ToList();

        var ventasPorMesCrudo = await _contexto.Ventas
            .AsNoTracking()
            .Where(venta => venta.Estado == EstadoDocumento.Registrada && venta.Fecha >= inicioSeisMeses)
            .GroupBy(venta => new { venta.Fecha.Year, venta.Fecha.Month })
            .Select(grupo => new
            {
                grupo.Key.Year,
                grupo.Key.Month,
                Total = grupo.Sum(venta => venta.Total)
            })
            .ToListAsync();

        var comprasPorMesCrudo = await _contexto.Compras
            .AsNoTracking()
            .Where(compra => compra.Estado == EstadoDocumento.Registrada && compra.Fecha >= inicioSeisMeses)
            .GroupBy(compra => new { compra.Fecha.Year, compra.Fecha.Month })
            .Select(grupo => new
            {
                grupo.Key.Year,
                grupo.Key.Month,
                Total = grupo.Sum(compra => compra.Total)
            })
            .ToListAsync();

        var ventasPorMes = new List<MesResumenDto>();

        for (var i = 0; i < 6; i++)
        {
            var mes = inicioSeisMeses.AddMonths(i);
            var venta = ventasPorMesCrudo.FirstOrDefault(item => item.Year == mes.Year && item.Month == mes.Month);
            var compra = comprasPorMesCrudo.FirstOrDefault(item => item.Year == mes.Year && item.Month == mes.Month);

            ventasPorMes.Add(new MesResumenDto
            {
                Anio = mes.Year,
                Mes = mes.Month,
                Etiqueta = $"{NombresMes[mes.Month - 1]} {mes:yy}",
                Ventas = venta?.Total ?? 0m,
                Compras = compra?.Total ?? 0m
            });
        }

        var ultimasVentas = await VentasAsync(hoy.AddDays(-30), hoy, null, null, null);

        return new DashboardDto
        {
            VentasHoy = ventasHoy,
            VentasMes = ventasMes,
            ComprasHoy = comprasHoy,
            ComprasMes = comprasMes,
            ProductosActivos = await _contexto.Productos.CountAsync(producto => producto.Activo),
            ProductosBajoMinimo = await _contexto.Productos.CountAsync(producto =>
                producto.Activo && producto.ExistenciaActual <= producto.ExistenciaMinima),
            ClientesActivos = await _contexto.Clientes.CountAsync(cliente => cliente.Activo),
            ProveedoresActivos = await _contexto.Proveedores.CountAsync(proveedor => proveedor.Activo),
            MovimientosHoy = await _contexto.MovimientosInventario.CountAsync(movimiento => movimiento.Fecha >= hoy),
            VentasUltimosDias = serie,
            TopProductos = await TopProductosAsync(hoy.AddDays(-30), hoy, 5),
            ProductosBajoMinimoLista = (await BajoMinimoAsync()).Take(8).ToList(),
            UltimasVentas = ultimasVentas.Take(5).ToList(),
            VentasMesAnterior = ventasMesAnterior,
            ComprasMesAnterior = comprasMesAnterior,
            CantidadVentasMes = cantidadVentasMes,
            CantidadComprasMes = cantidadComprasMes,
            CantidadVentasMesAnterior = cantidadVentasMesAnterior,
            TicketPromedioMes = cantidadVentasMes > 0 ? Math.Round(ventasMes / cantidadVentasMes, 2) : 0m,
            CostoVentasMes = costoVentasMes,
            MargenBrutoMes = margenBrutoMes,
            PorcentajeMargenMes = porcentajeMargenMes,
            ValorInventarioCosto = valorInventarioCosto,
            ValorInventarioVenta = valorInventarioVenta,
            MargenPotencialInventario = valorInventarioVenta - valorInventarioCosto,
            ProductosSinExistencia = await _contexto.Productos.CountAsync(producto =>
                producto.Activo && producto.ExistenciaActual <= 0),
            VentasPorFormaPago = ventasPorFormaPago,
            TopClientes = topClientes,
            VentasPorMes = ventasPorMes,
            ActualizadoUtc = DateTime.UtcNow
        };
    }
}

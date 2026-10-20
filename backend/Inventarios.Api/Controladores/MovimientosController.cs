using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/movimientos")]
[Authorize]
public class MovimientosController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioInventario _inventario;
    private readonly ServicioSecuencias _secuencias;
    private readonly ServicioParametros _parametros;
    private readonly ServicioBitacora _bitacora;

    public MovimientosController(
        ContextoInventarios contexto,
        ServicioInventario inventario,
        ServicioSecuencias secuencias,
        ServicioParametros parametros,
        ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _inventario = inventario;
        _secuencias = secuencias;
        _parametros = parametros;
        _bitacora = bitacora;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<MovimientoDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] int? productoId,
        [FromQuery] string? tipo,
        [FromQuery] string? origen,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var query = _contexto.MovimientosInventario.AsNoTracking().AsQueryable();

        if (productoId.HasValue)
        {
            query = query.Where(movimiento => movimiento.ProductoId == productoId.Value);
        }

        if (!string.IsNullOrWhiteSpace(tipo) && Enum.TryParse<TipoMovimiento>(tipo, true, out var tipoMovimiento))
        {
            query = query.Where(movimiento => movimiento.Tipo == tipoMovimiento);
        }

        if (!string.IsNullOrWhiteSpace(origen) && Enum.TryParse<OrigenMovimiento>(origen, true, out var origenMovimiento))
        {
            query = query.Where(movimiento => movimiento.Origen == origenMovimiento);
        }

        if (desde.HasValue)
        {
            query = query.Where(movimiento => movimiento.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(movimiento => movimiento.Fecha < limite);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(movimiento =>
                movimiento.Producto.Codigo.Contains(termino) ||
                movimiento.Producto.Nombre.Contains(termino) ||
                (movimiento.DocumentoNumero != null && movimiento.DocumentoNumero.Contains(termino)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(movimiento => movimiento.Fecha)
            .ThenByDescending(movimiento => movimiento.Id)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(movimiento => new MovimientoDto
            {
                Id = movimiento.Id,
                Fecha = movimiento.Fecha,
                ProductoId = movimiento.ProductoId,
                CodigoProducto = movimiento.Producto.Codigo,
                Producto = movimiento.Producto.Nombre,
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

        return Ok(new ResultadoPaginado<MovimientoDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        });
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<object>> Resumen([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
    {
        var query = _contexto.MovimientosInventario.AsNoTracking().AsQueryable();

        if (desde.HasValue)
        {
            query = query.Where(movimiento => movimiento.Fecha >= desde.Value.Date);
        }

        if (hasta.HasValue)
        {
            var limite = hasta.Value.Date.AddDays(1);
            query = query.Where(movimiento => movimiento.Fecha < limite);
        }

        var entradas = await query
            .Where(movimiento => movimiento.Tipo == TipoMovimiento.Entrada)
            .SumAsync(movimiento => (decimal?)movimiento.Cantidad) ?? 0m;

        var salidas = await query
            .Where(movimiento => movimiento.Tipo == TipoMovimiento.Salida)
            .SumAsync(movimiento => (decimal?)movimiento.Cantidad) ?? 0m;

        var cantidad = await query.CountAsync();

        return Ok(new { entradas, salidas, cantidad });
    }

    [HttpPost("ajuste")]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<AjusteRespuestaDto>> RegistrarAjuste(AjusteInventarioSolicitud solicitud)
    {
        var producto = await _contexto.Productos
            .FirstOrDefaultAsync(producto => producto.Id == solicitud.ProductoId && producto.Activo)
            ?? throw new ExcepcionNegocio("El producto no existe o está inactivo.");

        var usuarioId = User.ObtenerUsuarioId();

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        try
        {
            var prefijo = await _parametros.ObtenerPrefijoAsync("Documento.PrefijoAjuste", "AJU");
            var numero = await _secuencias.GenerarNumeroAsync("Ajuste", prefijo);
            var observacion = string.IsNullOrWhiteSpace(solicitud.Observacion)
                ? $"Ajuste manual de inventario ({solicitud.Tipo})"
                : solicitud.Observacion.Trim();

            if (solicitud.Tipo == TipoMovimiento.Entrada)
            {
                await _inventario.RegistrarEntradaAsync(
                    producto,
                    solicitud.Cantidad,
                    solicitud.CostoUnitario ?? producto.PrecioCosto,
                    OrigenMovimiento.Ajuste,
                    null,
                    numero,
                    usuarioId,
                    observacion);
            }
            else
            {
                await _inventario.RegistrarSalidaAsync(
                    producto,
                    solicitud.Cantidad,
                    solicitud.CostoUnitario ?? producto.PrecioCosto,
                    OrigenMovimiento.Ajuste,
                    null,
                    numero,
                    usuarioId,
                    observacion);
            }

            _bitacora.Registrar(
                "Ajuste de inventario",
                "Movimientos",
                producto.Id,
                $"{numero}: {solicitud.Tipo} de {solicitud.Cantidad:0.####} {producto.Nombre}");

            await _contexto.SaveChangesAsync();
            await transaccion.CommitAsync();

            return Ok(new AjusteRespuestaDto
            {
                Numero = numero,
                ProductoId = producto.Id,
                Producto = producto.Nombre,
                ExistenciaNueva = producto.ExistenciaActual
            });
        }
        catch
        {
            await transaccion.RollbackAsync();
            throw;
        }
    }
}

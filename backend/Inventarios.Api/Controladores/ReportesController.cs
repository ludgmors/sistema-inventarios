using Inventarios.Api.DTOs;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/reportes")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly ServicioReportes _reportes;
    private readonly ServicioExportacion _exportacion;

    public ReportesController(ServicioReportes reportes, ServicioExportacion exportacion)
    {
        _reportes = reportes;
        _exportacion = exportacion;
    }

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(
        [FromQuery] string tipo = "resumen",
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null,
        [FromQuery] string? estado = null,
        [FromQuery] string? tipoNota = null)
    {
        var inicio = desde ?? DateTime.Today.AddDays(-30);
        var fin = hasta ?? DateTime.Today;
        if (fin < inicio) (inicio, fin) = (fin, inicio);

        var (archivo, nombre) = await _exportacion.ReporteAsync(tipo, inicio, fin, estado, tipoNota);
        return File(
            archivo,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            nombre);
    }

    [HttpGet("kardex")]
    public async Task<ActionResult<List<KardexFilaDto>>> Kardex(
        [FromQuery] int productoId,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        return Ok(await _reportes.KardexAsync(productoId, desde, hasta));
    }

    [HttpGet("ventas")]
    public async Task<ActionResult<List<ReporteVentaDto>>> Ventas(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? clienteId,
        [FromQuery] int? usuarioId,
        [FromQuery] string? estado)
    {
        return Ok(await _reportes.VentasAsync(desde, hasta, clienteId, usuarioId, estado));
    }

    [HttpGet("compras")]
    public async Task<ActionResult<List<ReporteCompraDto>>> Compras(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? proveedorId,
        [FromQuery] string? estado)
    {
        return Ok(await _reportes.ComprasAsync(desde, hasta, proveedorId, estado));
    }

    [HttpGet("notas")]
    public async Task<ActionResult<List<ReporteNotaDto>>> Notas(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? tipo)
    {
        return Ok(await _reportes.NotasAsync(desde, hasta, tipo));
    }

    [HttpGet("top-productos")]
    public async Task<ActionResult<List<TopProductoDto>>> TopProductos(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int limite = 10)
    {
        return Ok(await _reportes.TopProductosAsync(desde, hasta, limite));
    }

    [HttpGet("bajo-minimo")]
    public async Task<ActionResult<List<BajoMinimoDto>>> BajoMinimo()
    {
        return Ok(await _reportes.BajoMinimoAsync());
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<ResumenPeriodoDto>> Resumen(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        return Ok(await _reportes.ResumenPeriodoAsync(
            desde ?? DateTime.Today.AddDays(-30),
            hasta ?? DateTime.Today));
    }
}

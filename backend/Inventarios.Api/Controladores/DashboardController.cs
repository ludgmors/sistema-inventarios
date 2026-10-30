using Inventarios.Api.DTOs;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ServicioReportes _reportes;
    private readonly ServicioExportacion _exportacion;

    public DashboardController(ServicioReportes reportes, ServicioExportacion exportacion)
    {
        _reportes = reportes;
        _exportacion = exportacion;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Obtener()
    {
        return Ok(await _reportes.DashboardAsync());
    }

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar()
    {
        var (archivo, nombre) = await _exportacion.PanelAsync();
        return File(
            archivo,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            nombre);
    }
}

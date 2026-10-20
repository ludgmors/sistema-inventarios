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

    public DashboardController(ServicioReportes reportes)
    {
        _reportes = reportes;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Obtener()
    {
        return Ok(await _reportes.DashboardAsync());
    }
}

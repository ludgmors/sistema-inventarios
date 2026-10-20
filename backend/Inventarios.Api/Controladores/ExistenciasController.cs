using Inventarios.Api.DTOs;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/existencias")]
[Authorize]
public class ExistenciasController : ControllerBase
{
    private readonly ServicioReportes _reportes;

    public ExistenciasController(ServicioReportes reportes)
    {
        _reportes = reportes;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<ExistenciaDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] int? categoriaId,
        [FromQuery] bool? soloBajoMinimo,
        [FromQuery] bool? soloActivos)
    {
        return Ok(await _reportes.ExistenciasAsync(consulta, categoriaId, soloBajoMinimo, soloActivos));
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<ResumenExistenciasDto>> Resumen()
    {
        return Ok(await _reportes.ResumenExistenciasAsync());
    }
}

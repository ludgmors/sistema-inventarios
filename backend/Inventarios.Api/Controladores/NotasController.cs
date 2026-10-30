using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/notas")]
[Authorize]
public class NotasController : ControllerBase
{
    private readonly ServicioNotas _notas;

    public NotasController(ServicioNotas notas)
    {
        _notas = notas;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<NotaResumenDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string? tipo,
        [FromQuery] int? ventaId,
        [FromQuery] string? estado)
    {
        return Ok(await _notas.ListarAsync(consulta, desde, hasta, tipo, ventaId, estado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NotaDto>> Obtener(int id)
    {
        return Ok(await _notas.ObtenerAsync(id));
    }

    [HttpPost]
    [Authorize(Roles = "Superadmin,Administrador,Ventas")]
    public async Task<ActionResult<NotaDto>> Crear(NotaCrearSolicitud solicitud)
    {
        var nota = await _notas.CrearAsync(solicitud, User.ObtenerUsuarioId());
        return StatusCode(StatusCodes.Status201Created, nota);
    }

    [HttpPost("{id:int}/anular")]
    [Authorize(Roles = "Superadmin,Administrador")]
    public async Task<ActionResult<NotaDto>> Anular(int id)
    {
        return Ok(await _notas.AnularAsync(id, User.ObtenerUsuarioId()));
    }
}

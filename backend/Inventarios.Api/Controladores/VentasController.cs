using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/ventas")]
[Authorize]
public class VentasController : ControllerBase
{
    private readonly ServicioVentas _ventas;

    public VentasController(ServicioVentas ventas)
    {
        _ventas = ventas;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<VentaResumenDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? clienteId,
        [FromQuery] string? estado)
    {
        return Ok(await _ventas.ListarAsync(consulta, desde, hasta, clienteId, estado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VentaDto>> Obtener(int id)
    {
        return Ok(await _ventas.ObtenerAsync(id));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Ventas")]
    public async Task<ActionResult<VentaDto>> Crear(VentaCrearSolicitud solicitud)
    {
        var venta = await _ventas.CrearAsync(solicitud, User.ObtenerUsuarioId());
        return StatusCode(StatusCodes.Status201Created, venta);
    }

    [HttpPost("{id:int}/anular")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<VentaDto>> Anular(int id)
    {
        return Ok(await _ventas.AnularAsync(id, User.ObtenerUsuarioId()));
    }
}

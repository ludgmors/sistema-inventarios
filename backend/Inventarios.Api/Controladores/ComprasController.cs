using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/compras")]
[Authorize]
public class ComprasController : ControllerBase
{
    private readonly ServicioCompras _compras;

    public ComprasController(ServicioCompras compras)
    {
        _compras = compras;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<CompraResumenDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? proveedorId,
        [FromQuery] string? estado)
    {
        return Ok(await _compras.ListarAsync(consulta, desde, hasta, proveedorId, estado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompraDto>> Obtener(int id)
    {
        return Ok(await _compras.ObtenerAsync(id));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<CompraDto>> Crear(CompraCrearSolicitud solicitud)
    {
        var compra = await _compras.CrearAsync(solicitud, User.ObtenerUsuarioId());
        return StatusCode(StatusCodes.Status201Created, compra);
    }

    [HttpPost("{id:int}/anular")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<CompraDto>> Anular(int id)
    {
        return Ok(await _compras.AnularAsync(id, User.ObtenerUsuarioId()));
    }
}

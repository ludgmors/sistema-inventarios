using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Superadmin,Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly ServicioUsuarios _usuarios;

    public UsuariosController(ServicioUsuarios usuarios)
    {
        _usuarios = usuarios;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> Listar([FromQuery] string? buscar)
    {
        return Ok(await _usuarios.ListarAsync(buscar));
    }

    [HttpGet("roles")]
    public async Task<ActionResult<List<RolDto>>> ListarRoles()
    {
        return Ok(await _usuarios.ListarRolesAsync());
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Crear(UsuarioCrearSolicitud solicitud)
    {
        var usuario = await _usuarios.CrearAsync(solicitud);
        return StatusCode(StatusCodes.Status201Created, usuario);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Actualizar(int id, UsuarioActualizarSolicitud solicitud)
    {
        return Ok(await _usuarios.ActualizarAsync(id, solicitud, User.ObtenerUsuarioId()));
    }

    [HttpPut("{id:int}/contrasena")]
    public async Task<IActionResult> RestablecerContrasena(int id, RestablecerContrasenaSolicitud solicitud)
    {
        await _usuarios.RestablecerContrasenaAsync(id, solicitud);
        return Ok(new MensajeRespuesta("Contraseña restablecida correctamente."));
    }
}

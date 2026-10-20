using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ServicioAutenticacion _autenticacion;
    private readonly IConfiguration _configuracion;

    public AuthController(ServicioAutenticacion autenticacion, IConfiguration configuracion)
    {
        _autenticacion = autenticacion;
        _configuracion = configuracion;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginRespuesta>> IniciarSesion(LoginSolicitud solicitud)
    {
        var respuesta = await _autenticacion.IniciarSesionAsync(solicitud);
        EscribirCookie(respuesta.Token, respuesta.Expira);
        return Ok(respuesta);
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult CerrarSesion()
    {
        Response.Cookies.Delete("access_token", new CookieOptions
        {
            Path = "/",
            Secure = _configuracion.GetValue<bool>("Auth:CookieSegura"),
            SameSite = SameSiteMode.Lax
        });

        return Ok(new MensajeRespuesta("Sesión cerrada correctamente."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioSesionDto>> ObtenerSesion()
    {
        return Ok(await _autenticacion.ObtenerSesionAsync(User.ObtenerUsuarioId()));
    }

    [HttpPost("cambiar-contrasena")]
    [Authorize]
    public async Task<IActionResult> CambiarContrasena(CambiarContrasenaSolicitud solicitud)
    {
        await _autenticacion.CambiarContrasenaAsync(User.ObtenerUsuarioId(), solicitud);
        return Ok(new MensajeRespuesta("Contraseña actualizada correctamente."));
    }

    private void EscribirCookie(string token, DateTime expira)
    {
        Response.Cookies.Append("access_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = _configuracion.GetValue<bool>("Auth:CookieSegura"),
            SameSite = SameSiteMode.Lax,
            Expires = expira,
            Path = "/"
        });
    }
}

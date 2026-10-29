using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Antiforgery;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpGet("csrf")]
    [AllowAnonymous]
    public IActionResult ObtenerCsrf([FromServices] IAntiforgery antiforgery)
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }

    [HttpPost("recuperar")]
    [AllowAnonymous]
    public async Task<IActionResult> Recuperar(RecuperarSolicitud solicitud, [FromServices] ServicioRecuperacion servicio)
    {
        await servicio.SolicitarAsync(solicitud.Correo);
        return Ok(new { mensaje = "Si el correo está registrado, recibirá un enlace para restablecer su contraseña." });
    }

    [HttpPost("restablecer")]
    [AllowAnonymous]
    public async Task<IActionResult> Restablecer(RestablecerSolicitud solicitud, [FromServices] ServicioRecuperacion servicio)
    {
        await servicio.RestablecerAsync(solicitud.Token, solicitud.ContrasenaNueva);
        return Ok(new { mensaje = "Contraseña actualizada. Inicie sesión nuevamente." });
    }
    private readonly ServicioAutenticacion _autenticacion;
    private readonly IConfiguration _configuracion;

    public AuthController(ServicioAutenticacion autenticacion, IConfiguration configuracion)
    {
        _autenticacion = autenticacion;
        _configuracion = configuracion;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<DesafioLoginRespuesta>> IniciarSesion(LoginSolicitud solicitud)
    {
        var respuesta = await _autenticacion.IniciarSesionAsync(solicitud);
        if (User.Identity?.IsAuthenticated == true) await _autenticacion.CerrarSesionAsync(User);
        Response.Cookies.Delete("access_token", new CookieOptions { Path = "/", Secure = CookieSegura });
        Response.Cookies.Append("desafio_acceso", respuesta.Navegador, new CookieOptions {
            HttpOnly = true, Secure = CookieSegura, SameSite = SameSiteMode.Strict,
            Path = "/api/auth", Expires = DateTimeOffset.UtcNow.AddMinutes(15)
        });
        return Ok(respuesta);
    }

    [HttpPost("verificar-codigo")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginRespuesta>> VerificarCodigo(VerificarCodigoSolicitud solicitud)
    {
        var respuesta = await _autenticacion.VerificarCodigoAsync(solicitud, Request.Cookies["desafio_acceso"]);
        Response.Cookies.Delete("desafio_acceso", new CookieOptions { Path = "/api/auth", Secure = CookieSegura });
        EscribirCookie(respuesta.Token, respuesta.Expira);
        return Ok(respuesta);
    }

    [HttpPost("reenviar-codigo")]
    [AllowAnonymous]
    public async Task<ActionResult<DesafioLoginRespuesta>> ReenviarCodigo(ReenviarCodigoSolicitud solicitud)
        => Ok(await _autenticacion.ReenviarCodigoAsync(solicitud.DesafioId, Request.Cookies["desafio_acceso"]));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> CerrarSesion()
    {
        await _autenticacion.CerrarSesionAsync(User);
        Response.Cookies.Delete("access_token", new CookieOptions
        {
            Path = "/",
            Secure = CookieSegura,
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
        Response.Cookies.Delete("access_token", new CookieOptions { Path = "/", Secure = CookieSegura });
        return Ok(new MensajeRespuesta("Contraseña actualizada correctamente."));
    }

    private void EscribirCookie(string token, DateTime expira)
    {
        Response.Cookies.Append("access_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = CookieSegura,
            SameSite = SameSiteMode.Lax,
            Expires = expira,
            Path = "/"
        });
    }

    private bool CookieSegura => !HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment()
        || _configuracion.GetValue<bool>("Auth:CookieSegura");
}

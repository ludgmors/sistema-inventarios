using System.Security.Claims;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Middleware;

public class ProteccionAccesoMiddleware(RequestDelegate siguiente)
{
    public async Task InvokeAsync(HttpContext http, ServicioProteccionAcceso proteccion,
        ServicioBitacora bitacora, Datos.ContextoInventarios db, IAntiforgery antiforgery)
    {
        if (!http.Request.Path.StartsWithSegments("/api")) { await siguiente(http); return; }
        http.Response.Headers.CacheControl = "no-store";
        var ip = http.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "sin-ip";
        var bloqueo = await proteccion.ParametroAsync("Seguridad.MinutosBloqueo") * 60;
        var hasta = await proteccion.ConsumirAsync("api-ip:" + ip,
            await proteccion.ParametroAsync("Seguridad.SolicitudesPorMinuto"), 60, bloqueo);
        var escritura = !HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method)
            && !HttpMethods.IsOptions(http.Request.Method);

        // Se valida también el login: evita que otro sitio inicie una sesión con una cuenta ajena.
        if (hasta == null && escritura)
        {
            try { await antiforgery.ValidateRequestAsync(http); }
            catch (AntiforgeryValidationException)
            {
                http.Response.StatusCode = 400;
                await http.Response.WriteAsJsonAsync(new { detail = "Validación de seguridad inválida. Recargue la página." });
                return;
            }
        }

        var autenticado = int.TryParse(http.User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId);
        var motivo = "Límite de solicitudes por IP";
        if (hasta == null && autenticado && escritura)
        {
            hasta = await proteccion.ConsumirAsync("operaciones:" + usuarioId,
                await proteccion.ParametroAsync("Seguridad.OperacionesPorMinuto"), 60, bloqueo);
            motivo = "Límite de operaciones por usuario";
            if (hasta == null && HttpMethods.IsPost(http.Request.Method) && http.Request.Path == "/api/usuarios"
                && http.User.IsInRole("Administrador"))
            {
                hasta = await proteccion.ConsumirAsync("crear-usuarios:" + usuarioId,
                    await proteccion.ParametroAsync("Seguridad.CreacionUsuarios"), 600, bloqueo);
                motivo = "Límite de creación de usuarios";
            }
            if (hasta != null) await proteccion.BloquearUsuarioAsync(usuarioId, hasta.Value);
        }

        if (hasta != null)
        {
            if (autenticado)
            {
                // El exceso compartido por IP revoca esta sesión, sin bloquear otras cuentas de esa red.
                var sid = http.User.FindFirst("jti")?.Value;
                if (sid != null)
                    await db.SesionesAcceso.Where(x => x.Id == sid && x.RevocadaUtc == null)
                        .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevocadaUtc, DateTime.UtcNow));
                http.Response.Cookies.Delete("access_token");
            }
            if (await proteccion.ConsumirAsync($"auditoria-bloqueo:{ip}:{usuarioId}", 1, 60, 60) == null)
            {
                bitacora.Registrar("Bloqueo por actividad excesiva", "Seguridad", autenticado ? usuarioId : null, motivo);
                await db.SaveChangesAsync();
            }
            http.Response.Headers.RetryAfter = Math.Max(1, (int)(hasta.Value - DateTime.UtcNow).TotalSeconds).ToString();
            http.Response.StatusCode = 429;
            await http.Response.WriteAsJsonAsync(new { detail = "Actividad excesiva. Espere antes de intentar nuevamente.", sesionCerrada = autenticado });
            return;
        }
        await siguiente(http);
    }
}

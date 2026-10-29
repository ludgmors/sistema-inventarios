using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using Inventarios.Api.Datos;
using Inventarios.Api.Entidades;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioRecuperacion(ContextoInventarios db, ServicioProteccionAcceso proteccion,
    IConfiguration config, IPasswordHasher<Usuario> hasher, ServicioBitacora bitacora,
    IWebHostEnvironment entorno, IHttpContextAccessor accessor, ILogger<ServicioRecuperacion> logger)
{
    public async Task SolicitarAsync(string correo)
    {
        correo = correo.Trim().ToLowerInvariant();
        var ip = accessor.HttpContext!.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "sin-ip";
        var hasta = await proteccion.ConsumirAsync("recuperacion-ip:" + ip, 10, 3600, 900);
        hasta ??= await proteccion.ConsumirAsync("recuperacion-correo:" + correo,
            await proteccion.ParametroAsync("Seguridad.RecuperacionesPorHora"), 3600, 900);
        if (hasta != null) throw new AccesoLimitadoException(900);
        var usuario = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(x => x.Correo == correo && x.Activo);
        if (usuario == null) return;
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var recuperacion = new RecuperacionAcceso {
            Hash = ServicioProteccionAcceso.Hash(token), UsuarioId = usuario.Id,
            ExpiraUtc = DateTime.UtcNow.AddMinutes(15)
        };
        db.RecuperacionesAcceso.Add(recuperacion);
        await db.SaveChangesAsync();
        try
        {
            var url = config["Correo:UrlFrontend"] ?? "http://localhost:3000";
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || (!entorno.IsDevelopment() && uri.Scheme != "https"))
                throw new InvalidOperationException("Configure Correo:UrlFrontend con la URL pública HTTPS.");
            var enlace = url.TrimEnd('/') + "/login/restablecer#token=" + token;
            using var cliente = new SmtpClient(config["Correo:Host"] ?? "127.0.0.1", config.GetValue("Correo:Puerto", 1025)) {
                EnableSsl = !entorno.IsDevelopment() || config.GetValue("Correo:Tls", false), Timeout = 10000
            };
            var smtpUsuario = config["Correo:Usuario"];
            if (!string.IsNullOrWhiteSpace(smtpUsuario))
                cliente.Credentials = new NetworkCredential(smtpUsuario, config["Correo:Clave"]);
            using var mensaje = new MailMessage(config["Correo:Remitente"] ?? "inventarios@example.com", correo) {
                Subject = "Restablecer contraseña - Sistema de Inventarios",
                Body = $"Se solicitó restablecer su contraseña. Abra este enlace en los próximos 15 minutos:\n\n{enlace}\n\nSi no lo solicitó, ignore este mensaje."
            };
            await cliente.SendMailAsync(mensaje);
            bitacora.Registrar("Recuperación solicitada", "Seguridad", usuario.Id);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // La respuesta pública permanece genérica. No registrar el token ni el contenido del correo.
            logger.LogError("No se pudo enviar la recuperación: {Tipo}", ex.GetType().Name);
            await db.RecuperacionesAcceso.Where(x => x.Hash == recuperacion.Hash).ExecuteDeleteAsync();
        }
    }

    public async Task RestablecerAsync(string token, string contrasena)
    {
        var ip = accessor.HttpContext!.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "sin-ip";
        if (await proteccion.ConsumirAsync("restablecer-ip:" + ip, 10, 900, 900) != null)
            throw new AccesoLimitadoException(900);
        var hash = ServicioProteccionAcceso.Hash(token);
        await using var transaccion = await db.Database.BeginTransactionAsync();
        // Consumir de forma atómica antes de cambiar credenciales: solo una solicitud puede usarlo.
        var cambiado = await db.RecuperacionesAcceso.Where(x => x.Hash == hash && x.UsadoUtc == null && x.ExpiraUtc > DateTime.UtcNow)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UsadoUtc, DateTime.UtcNow));
        if (cambiado != 1) throw new ExcepcionNegocio("El enlace no es válido o ya expiró.");
        var recuperacion = await db.RecuperacionesAcceso.AsNoTracking().SingleAsync(x => x.Hash == hash);
        var usuario = await db.Usuarios.SingleOrDefaultAsync(x => x.Id == recuperacion.UsuarioId && x.Activo)
            ?? throw new ExcepcionNegocio("El enlace no es válido o ya expiró.");
        usuario.HashContrasena = hasher.HashPassword(usuario, contrasena);
        await proteccion.RevocarAsync(usuario.Id);
        await db.RecuperacionesAcceso.Where(x => x.UsuarioId == usuario.Id && x.UsadoUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UsadoUtc, DateTime.UtcNow));
        bitacora.Registrar("Contraseña recuperada", "Seguridad", usuario.Id);
        await db.SaveChangesAsync();
        await transaccion.CommitAsync();
    }
}

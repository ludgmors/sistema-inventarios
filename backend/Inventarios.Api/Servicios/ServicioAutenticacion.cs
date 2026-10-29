using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Inventarios.Api.Servicios;

public class ServicioAutenticacion(ContextoInventarios db, IConfiguration configuracion,
    IPasswordHasher<Usuario> hasher, ServicioBitacora bitacora,
    ServicioProteccionAcceso proteccion, IHttpContextAccessor accessor, ServicioParametros parametros, ServicioCorreo correo, ILogger<ServicioAutenticacion> logger)
{
    private static readonly Usuario UsuarioFicticio = new();
    private static readonly string HashFicticio = new PasswordHasher<Usuario>().HashPassword(UsuarioFicticio, Guid.NewGuid().ToString());

    private string HashCodigo(string id, string codigo) => Convert.ToHexString(HMACSHA256.HashData(
        Encoding.UTF8.GetBytes(configuracion["Jwt:Key"]!), Encoding.UTF8.GetBytes(id + ":" + codigo)));

    private Task<Usuario> BloquearFilaUsuarioAsync(int id) => db.Usuarios
        .FromSqlInterpolated($"SELECT * FROM Usuarios WITH (UPDLOCK, HOLDLOCK) WHERE Id={id}")
        .AsNoTracking().Include(x => x.Rol).SingleAsync();

    private async Task LimitarEnvioAsync(int id)
    {
        var hasta = await proteccion.ConsumirAsync("2fa-envios:" + id, 3, 900, 900, hastaFinVentana: true);
        if (hasta != null) throw LimiteCorreo(hasta.Value, "Ya se solicitaron 3 envíos de código en esta ventana de 15 minutos.");
    }

    private static AccesoLimitadoException LimiteCorreo(DateTime hasta, string motivo)
    {
        var segundos = Math.Max(1, (int)Math.Ceiling((hasta - DateTime.UtcNow).TotalSeconds));
        var tiempo = segundos >= 60 ? $"{(int)Math.Ceiling(segundos / 60d)} minuto(s)" : $"{segundos} segundo(s)";
        return new AccesoLimitadoException(segundos, $"{motivo} Podrá solicitar otro código en {tiempo}. No es un error de contraseña.");
    }

    private async Task LimitarEsperaCorreoAsync(int id)
    {
        var hasta = await proteccion.ConsumirAsync("2fa-espera:" + id, 1, 60, 60, hastaFinVentana: true);
        if (hasta != null) throw LimiteCorreo(hasta.Value, "Debe esperar entre solicitudes de código.");
    }

    private async Task EnviarCodigoAsync(DesafioAcceso desafio, string codigo)
    {
        try
        {
            await correo.EnviarAsync(desafio.Correo, "Código de acceso - Sistema de Inventarios",
                $"Su código de acceso es: {codigo}\n\nVence en 5 minutos. No lo comparta. Si no solicitó el acceso, ignore este mensaje.");
        }
        catch (Exception ex)
        {
            logger.LogError("Falló el envío del segundo factor: {Tipo}", ex.GetType().Name);
            throw new ExcepcionNegocio("No se pudo enviar el código. Intente más tarde o contacte al administrador.");
        }
    }

    private static DesafioLoginRespuesta RespuestaDesafio(DesafioAcceso d) => new() {
        DesafioId = d.Id, ExpiraUtc = d.ExpiraUtc,
        CorreoOculto = d.Correo[..1] + "***@" + d.Correo.Split('@')[1],
        ReenviarEnSegundos = Math.Max(0, (int)Math.Ceiling((d.UltimoEnvioUtc.AddSeconds(60) - DateTime.UtcNow).TotalSeconds))
    };

    private async Task<DesafioLoginRespuesta> CrearDesafioAsync(Usuario original)
    {
        if (!new CorreoFormalAttribute().IsValid(original.Correo))
            throw new ExcepcionNegocio("Su cuenta necesita un correo real para recibir el código. Contacte al administrador.");
        // La espera se comparte entre nuevos logins y reenvíos, para que no se pueda eludir.
        await using var transaccion = await db.Database.BeginTransactionAsync();
        var usuario = await BloquearFilaUsuarioAsync(original.Id);
        if (!usuario.Activo || !usuario.Rol.Activo || usuario.BloqueadoHastaUtc > DateTime.UtcNow
            || usuario.HashContrasena != original.HashContrasena || usuario.Correo != original.Correo)
            throw new ExcepcionNegocio("La cuenta cambió. Inicie sesión nuevamente.");
        await LimitarEsperaCorreoAsync(original.Id);
        await LimitarEnvioAsync(original.Id);
        await db.DesafiosAcceso.Where(x => x.UsuarioId == usuario.Id && x.UsadoUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UsadoUtc, DateTime.UtcNow));
        var navegador = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var codigo = RandomNumberGenerator.GetInt32(1000000).ToString("D6");
        var desafio = new DesafioAcceso {
            Id = Guid.NewGuid().ToString("N"), UsuarioId = usuario.Id,
            HashNavegador = ServicioProteccionAcceso.Hash(navegador),
            VersionCredenciales = ServicioProteccionAcceso.Hash(usuario.HashContrasena),
            Correo = usuario.Correo, RolId = usuario.RolId, CreadoUtc = DateTime.UtcNow,
            UltimoEnvioUtc = DateTime.UtcNow, ExpiraUtc = DateTime.UtcNow.AddMinutes(5)
        };
        desafio.HashCodigo = HashCodigo(desafio.Id, codigo);
        db.DesafiosAcceso.Add(desafio);
        await EnviarCodigoAsync(desafio, codigo);
        bitacora.Registrar("Código de acceso enviado", "Seguridad", usuario.Id);
        await db.SaveChangesAsync();
        await transaccion.CommitAsync();
        var respuesta = RespuestaDesafio(desafio); respuesta.Navegador = navegador;
        return respuesta;
    }

    private async Task LimitarVerificacionAsync()
    {
        var ip = accessor.HttpContext!.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "sin-ip";
        if (await proteccion.ConsumirAsync("2fa-verificacion-ip:" + ip, 30, 900, 900) != null)
            throw new AccesoLimitadoException(900);
    }

    private async Task<(DesafioAcceso, Usuario)> ObtenerDesafioAsync(string id, string? navegador)
    {
        var candidato = await db.DesafiosAcceso.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (candidato == null || string.IsNullOrWhiteSpace(navegador)
            || candidato.HashNavegador != ServicioProteccionAcceso.Hash(navegador))
            throw new ExcepcionNegocio("El código no es válido o ha expirado. Inicie sesión nuevamente.");
        var usuario = await BloquearFilaUsuarioAsync(candidato.UsuarioId);
        var d = await db.DesafiosAcceso.SingleAsync(x => x.Id == id);
        if (d.UsadoUtc != null || d.Intentos >= 5 || d.CreadoUtc.AddMinutes(15) <= DateTime.UtcNow
            || !usuario.Activo || !usuario.Rol.Activo || usuario.BloqueadoHastaUtc > DateTime.UtcNow
            || d.Correo != usuario.Correo || d.RolId != usuario.RolId
            || d.VersionCredenciales != ServicioProteccionAcceso.Hash(usuario.HashContrasena))
            throw new ExcepcionNegocio("El código no es válido o ha expirado. Inicie sesión nuevamente.");
        return (d, usuario);
    }

    public async Task<LoginRespuesta> VerificarCodigoAsync(VerificarCodigoSolicitud solicitud, string? navegador)
    {
        await LimitarVerificacionAsync();
        await using var transaccion = await db.Database.BeginTransactionAsync();
        var (desafio, usuario) = await ObtenerDesafioAsync(solicitud.DesafioId, navegador);
        if (desafio.ExpiraUtc <= DateTime.UtcNow)
            throw new ExcepcionNegocio("El código expiró. Solicite otro código.");
        desafio.Intentos++;
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(desafio.HashCodigo),
            Convert.FromHexString(HashCodigo(desafio.Id, solicitud.Codigo))))
        {
            if (desafio.Intentos >= 5) desafio.UsadoUtc = DateTime.UtcNow;
            bitacora.Registrar("Código de acceso incorrecto", "Seguridad", usuario.Id);
            await db.SaveChangesAsync();
            await transaccion.CommitAsync();
            throw new ExcepcionNegocio(desafio.Intentos >= 5 ? "Se agotaron los 5 intentos. Inicie sesión nuevamente." : "Código incorrecto.");
        }
        desafio.UsadoUtc = DateTime.UtcNow;
        var respuesta = await CrearSesionAsync(usuario);
        await transaccion.CommitAsync();
        return respuesta;
    }

    public async Task<DesafioLoginRespuesta> ReenviarCodigoAsync(string id, string? navegador)
    {
        await LimitarVerificacionAsync();
        // Obtener el usuario sin revelar si existe el identificador.
        var previo = await db.DesafiosAcceso.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (previo == null || string.IsNullOrWhiteSpace(navegador) || previo.HashNavegador != ServicioProteccionAcceso.Hash(navegador))
            throw new ExcepcionNegocio("Desafío inválido. Inicie sesión nuevamente.");
        if (DateTime.UtcNow < previo.UltimoEnvioUtc.AddSeconds(60))
            throw LimiteCorreo(previo.UltimoEnvioUtc.AddSeconds(60), "Ya se solicitó un código recientemente.");
        await using var transaccion = await db.Database.BeginTransactionAsync();
        var (desafio, usuario) = await ObtenerDesafioAsync(id, navegador);
        if (DateTime.UtcNow < desafio.UltimoEnvioUtc.AddSeconds(60)) throw LimiteCorreo(desafio.UltimoEnvioUtc.AddSeconds(60), "Ya se solicitó un código recientemente.");
        await LimitarEsperaCorreoAsync(previo.UsuarioId);
        await LimitarEnvioAsync(previo.UsuarioId);
        string codigo;
        do { codigo = RandomNumberGenerator.GetInt32(1000000).ToString("D6"); }
        while (HashCodigo(id, codigo) == desafio.HashCodigo);
        desafio.HashCodigo = HashCodigo(id, codigo);
        desafio.UltimoEnvioUtc = DateTime.UtcNow;
        desafio.ExpiraUtc = new[] { DateTime.UtcNow.AddMinutes(5), desafio.CreadoUtc.AddMinutes(15) }.Min();
        // No se reinician los intentos al reenviar.
        await EnviarCodigoAsync(desafio, codigo);
        bitacora.Registrar("Código de acceso reenviado", "Seguridad", usuario.Id);
        await db.SaveChangesAsync();
        await transaccion.CommitAsync();
        return RespuestaDesafio(desafio);
    }

    public async Task<DesafioLoginRespuesta> IniciarSesionAsync(LoginSolicitud solicitud)
    {
        var identidad = solicitud.NombreUsuario.Trim().ToLowerInvariant();
        var usuario = await db.Usuarios.Include(x => x.Rol)
            .FirstOrDefaultAsync(x => x.NombreUsuario == identidad || x.Correo == identidad);
        var ip = accessor.HttpContext!.Connection.RemoteIpAddress?.MapToIPv6().ToString() ?? "sin-ip";
        var bloqueo = await proteccion.ParametroAsync("Seguridad.MinutosBloqueo") * 60;
        var hastaIp = await proteccion.ConsumirAsync("login-ip:" + ip,
            await proteccion.ParametroAsync("Seguridad.LoginPorIp"), 900, bloqueo);
        var claveCuenta = "login-cuenta:" + (usuario == null ? identidad : usuario.Id.ToString());
        var hastaCuenta = await proteccion.ConsumirAsync(claveCuenta,
            await proteccion.ParametroAsync("Seguridad.IntentosLogin"), 900, bloqueo);
        // No se revocan sesiones por intentos anónimos: impediría a terceros expulsar al usuario.
        if (hastaIp != null || hastaCuenta != null || usuario?.BloqueadoHastaUtc > DateTime.UtcNow)
            throw new AccesoLimitadoException(bloqueo);

        var resultado = hasher.VerifyHashedPassword(usuario ?? UsuarioFicticio,
            usuario?.HashContrasena ?? HashFicticio, solicitud.Contrasena);
        if (usuario == null || !usuario.Activo || resultado == PasswordVerificationResult.Failed)
        {
            bitacora.Registrar("Intento de acceso fallido", "Seguridad");
            await db.SaveChangesAsync();
            throw new ExcepcionNegocio("Usuario o contraseña incorrectos.");
        }
        await proteccion.LimpiarAsync(claveCuenta);
        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
            usuario.HashContrasena = hasher.HashPassword(usuario, solicitud.Contrasena);
        await db.SaveChangesAsync();
        return await CrearDesafioAsync(usuario);
    }

    private async Task<LoginRespuesta> CrearSesionAsync(Usuario usuario)
    {
        await db.Usuarios.Where(x => x.Id == usuario.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.UltimoAcceso, DateTime.Now));
        var duracion = Math.Clamp((double)await parametros.ObtenerDecimalAsync("Sesion.MinutosExpiracion", 120), 5, 480);
        var expira = DateTime.UtcNow.AddMinutes(Math.Min(duracion, await proteccion.ParametroAsync("Seguridad.MinutosSesion")));
        var sesion = new SesionAcceso {
            Id = Guid.NewGuid().ToString("N"), UsuarioId = usuario.Id, RolId = usuario.RolId,
            VersionCredenciales = ServicioProteccionAcceso.Hash(usuario.HashContrasena),
            ExpiraUtc = expira, UltimaActividadUtc = DateTime.UtcNow
        };
        db.SesionesAcceso.Add(sesion);
        bitacora.Registrar("Inicio de sesión", "Seguridad", usuario.Id);
        await db.SaveChangesAsync();
        var opciones = configuracion.GetSection("Jwt").Get<OpcionesJwt>()!;
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.NombreUsuario),
            new Claim(ClaimTypes.Role, usuario.Rol.Nombre),
            new Claim(JwtRegisteredClaimNames.Jti, sesion.Id)
        };
        var token = new JwtSecurityToken(opciones.Issuer, opciones.Audience, claims,
            DateTime.UtcNow, expira, new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opciones.Key)), SecurityAlgorithms.HmacSha256));
        return new LoginRespuesta { Token = new JwtSecurityTokenHandler().WriteToken(token), Expira = expira, Usuario = Mapear(usuario) };
    }

    public async Task<bool> ValidarSesionAsync(ClaimsPrincipal principal)
    {
        var sid = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (!int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id) || sid == null) return false;
        var sesion = await db.SesionesAcceso.AsNoTracking().Include(x => x.Usuario).ThenInclude(x => x.Rol)
            .FirstOrDefaultAsync(x => x.Id == sid && x.UsuarioId == id);
        var ahora = DateTime.UtcNow;
        if (sesion == null || sesion.RevocadaUtc != null || sesion.ExpiraUtc <= ahora) return false;
        var usuario = sesion.Usuario;
        var inactividad = await proteccion.ParametroAsync("Seguridad.MinutosInactividad");
        if (!usuario.Activo || !usuario.Rol.Activo || usuario.BloqueadoHastaUtc > ahora || usuario.RolId != sesion.RolId
            || principal.FindFirstValue(ClaimTypes.Role) != usuario.Rol.Nombre
            || ServicioProteccionAcceso.Hash(usuario.HashContrasena) != sesion.VersionCredenciales
            || sesion.UltimaActividadUtc.AddMinutes(inactividad) <= ahora)
        {
            await db.SesionesAcceso.Where(x => x.Id == sid).ExecuteUpdateAsync(s => s.SetProperty(x => x.RevocadaUtc, ahora));
            return false;
        }
        // Actualización condicional: una solicitud antigua no puede retroceder el reloj de actividad.
        await db.SesionesAcceso.Where(x => x.Id == sid && x.RevocadaUtc == null && x.UltimaActividadUtc < ahora)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.UltimaActividadUtc, ahora));
        return true;
    }

    public async Task CerrarSesionAsync(ClaimsPrincipal principal)
    {
        var sid = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);
        await db.SesionesAcceso.Where(x => x.Id == sid && x.RevocadaUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevocadaUtc, DateTime.UtcNow));
        bitacora.Registrar("Cierre de sesión", "Seguridad");
        await db.SaveChangesAsync();
    }

    public async Task<UsuarioSesionDto> ObtenerSesionAsync(int id)
    {
        var usuario = await db.Usuarios.AsNoTracking().Include(x => x.Rol).SingleAsync(x => x.Id == id && x.Activo);
        return Mapear(usuario);
    }

    public async Task CambiarContrasenaAsync(int id, CambiarContrasenaSolicitud solicitud)
    {
        var usuario = await db.Usuarios.SingleAsync(x => x.Id == id);
        if (hasher.VerifyHashedPassword(usuario, usuario.HashContrasena, solicitud.ContrasenaActual) == PasswordVerificationResult.Failed)
            throw new ExcepcionNegocio("La contraseña actual no es correcta.");
        usuario.HashContrasena = hasher.HashPassword(usuario, solicitud.ContrasenaNueva);
        bitacora.Registrar("Cambio de contraseña", "Seguridad", id);
        await db.SaveChangesAsync();
        await proteccion.RevocarAsync(id);
    }

    private static UsuarioSesionDto Mapear(Usuario u) => new() {
        Id = u.Id, NombreCompleto = u.NombreCompleto, NombreUsuario = u.NombreUsuario,
        Correo = u.Correo, RolId = u.RolId, Rol = u.Rol.Nombre
    };
}

public class AccesoLimitadoException(int segundos, string mensaje = "Demasiados intentos. Intente nuevamente más tarde.") : Exception(mensaje)
{
    public int Segundos { get; } = segundos;
}

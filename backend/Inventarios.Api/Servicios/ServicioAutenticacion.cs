using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Inventarios.Api.Servicios;

public class ServicioAutenticacion
{
    private readonly ContextoInventarios _contexto;
    private readonly IConfiguration _configuracion;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly ServicioBitacora _bitacora;
    private readonly ServicioParametros _parametros;

    public ServicioAutenticacion(
        ContextoInventarios contexto,
        IConfiguration configuracion,
        IPasswordHasher<Usuario> hasher,
        ServicioBitacora bitacora,
        ServicioParametros parametros)
    {
        _contexto = contexto;
        _configuracion = configuracion;
        _hasher = hasher;
        _bitacora = bitacora;
        _parametros = parametros;
    }

    public async Task<LoginRespuesta> IniciarSesionAsync(LoginSolicitud solicitud)
    {
        var usuario = await _contexto.Usuarios
            .Include(usuario => usuario.Rol)
            .FirstOrDefaultAsync(usuario => usuario.NombreUsuario == solicitud.NombreUsuario.Trim());

        if (usuario is null || !usuario.Activo)
        {
            throw new ExcepcionNegocio("Usuario o contraseña incorrectos.");
        }

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.HashContrasena, solicitud.Contrasena);

        if (resultado == PasswordVerificationResult.Failed)
        {
            throw new ExcepcionNegocio("Usuario o contraseña incorrectos.");
        }

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.Contrasena);
        }

        usuario.UltimoAcceso = DateTime.Now;
        _bitacora.Registrar("Inicio de sesión", "Seguridad", usuario.Id, $"Usuario {usuario.NombreUsuario}");
        await _contexto.SaveChangesAsync();

        var (token, expira) = await GenerarTokenAsync(usuario);

        return new LoginRespuesta
        {
            Token = token,
            Expira = expira,
            Usuario = MapearSesion(usuario)
        };
    }

    public async Task<UsuarioSesionDto> ObtenerSesionAsync(int usuarioId)
    {
        var usuario = await _contexto.Usuarios
            .AsNoTracking()
            .Include(usuario => usuario.Rol)
            .FirstOrDefaultAsync(usuario => usuario.Id == usuarioId);

        if (usuario is null || !usuario.Activo)
        {
            throw new ExcepcionNegocio("La sesión ya no es válida.");
        }

        return MapearSesion(usuario);
    }

    public async Task CambiarContrasenaAsync(int usuarioId, CambiarContrasenaSolicitud solicitud)
    {
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(usuario => usuario.Id == usuarioId)
            ?? throw new ExcepcionNegocio("Usuario no encontrado.");

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.HashContrasena, solicitud.ContrasenaActual);

        if (resultado == PasswordVerificationResult.Failed)
        {
            throw new ExcepcionNegocio("La contraseña actual no es correcta.");
        }

        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.ContrasenaNueva);
        _bitacora.Registrar("Cambio de contraseña", "Seguridad", usuario.Id);
        await _contexto.SaveChangesAsync();
    }

    private async Task<(string Token, DateTime Expira)> GenerarTokenAsync(Usuario usuario)
    {
        var opciones = _configuracion.GetSection("Jwt").Get<OpcionesJwt>()
            ?? throw new InvalidOperationException("La configuración JWT no está definida.");

        var minutos = await _parametros.ObtenerDecimalAsync(
            "Sesion.MinutosExpiracion",
            opciones.MinutosExpiracion);

        if (minutos is < 5 or > 43200)
        {
            minutos = opciones.MinutosExpiracion;
        }

        var expira = DateTime.Now.AddMinutes((double)minutos);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.NombreUsuario),
            new(ClaimTypes.Email, usuario.Correo),
            new(ClaimTypes.Role, usuario.Rol.Nombre),
            new("nombreCompleto", usuario.NombreCompleto),
            new("rol", usuario.Rol.Nombre),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opciones.Key));
        var credenciales = new SigningCredentials(clave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: opciones.Issuer,
            audience: opciones.Audience,
            claims: claims,
            notBefore: DateTime.Now,
            expires: expira,
            signingCredentials: credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }

    private static UsuarioSesionDto MapearSesion(Usuario usuario) => new()
    {
        Id = usuario.Id,
        NombreCompleto = usuario.NombreCompleto,
        NombreUsuario = usuario.NombreUsuario,
        Correo = usuario.Correo,
        RolId = usuario.RolId,
        Rol = usuario.Rol.Nombre
    };
}

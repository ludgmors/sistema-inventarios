using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioUsuarios
{
    private readonly ContextoInventarios _contexto;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly ServicioBitacora _bitacora;
    private readonly ServicioProteccionAcceso _proteccion;
    private readonly IHttpContextAccessor _http;

    public ServicioUsuarios(
        ContextoInventarios contexto,
        IPasswordHasher<Usuario> hasher,
        ServicioBitacora bitacora, ServicioProteccionAcceso proteccion, IHttpContextAccessor http)
    {
        _contexto = contexto;
        _hasher = hasher;
        _bitacora = bitacora;
        _proteccion = proteccion;
        _http = http;
    }

    public async Task<List<UsuarioDto>> ListarAsync(string? buscar)
    {
        var consulta = _contexto.Usuarios.AsNoTracking().Include(usuario => usuario.Rol).AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var termino = buscar.Trim();
            consulta = consulta.Where(usuario =>
                usuario.NombreCompleto.Contains(termino) ||
                usuario.NombreUsuario.Contains(termino) ||
                usuario.Correo.Contains(termino));
        }

        return await consulta
            .OrderBy(usuario => usuario.NombreCompleto)
            .Select(usuario => new UsuarioDto
            {
                Id = usuario.Id,
                NombreCompleto = usuario.NombreCompleto,
                NombreUsuario = usuario.NombreUsuario,
                Correo = usuario.Correo,
                RolId = usuario.RolId,
                Rol = usuario.Rol.Nombre,
                Activo = usuario.Activo,
                FechaCreacion = usuario.FechaCreacion,
                UltimoAcceso = usuario.UltimoAcceso
            })
            .ToListAsync();
    }

    public async Task<List<RolDto>> ListarRolesAsync()
    {
        return await _contexto.Roles
            .AsNoTracking()
            .Where(rol => rol.Activo)
            .Where(rol => EsSuperadmin || rol.Nombre != "Superadmin")
            .OrderBy(rol => rol.Id)
            .Select(rol => new RolDto
            {
                Id = rol.Id,
                Nombre = rol.Nombre,
                Descripcion = rol.Descripcion
            })
            .ToListAsync();
    }

    public async Task<UsuarioDto> CrearAsync(UsuarioCrearSolicitud solicitud)
    {
        var nombreUsuario = solicitud.NombreUsuario.Trim().ToLowerInvariant();
        var correo = solicitud.Correo.Trim().ToLowerInvariant();

        if (await _contexto.Usuarios.AnyAsync(usuario => usuario.NombreUsuario == nombreUsuario || usuario.Correo == nombreUsuario))
        {
            throw new ExcepcionNegocio("El nombre de usuario ya está registrado.");
        }

        if (await _contexto.Usuarios.AnyAsync(usuario => usuario.Correo == correo || usuario.NombreUsuario == correo))
        {
            throw new ExcepcionNegocio("El correo ya está registrado.");
        }

        var rol = await _contexto.Roles.FirstOrDefaultAsync(rol => rol.Id == solicitud.RolId && rol.Activo)
            ?? throw new ExcepcionNegocio("El rol seleccionado no existe o está inactivo.");
        VerificarRolPermitido(rol.Nombre);

        var usuario = new Usuario
        {
            NombreCompleto = solicitud.NombreCompleto.Trim(),
            NombreUsuario = nombreUsuario,
            Correo = correo,
            RolId = rol.Id,
            Activo = true,
            FechaCreacion = DateTime.Now
        };

        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.Contrasena);

        _contexto.Usuarios.Add(usuario);
        _bitacora.Registrar("Creación de usuario", "Seguridad", null, $"Usuario {nombreUsuario}");
        await _contexto.SaveChangesAsync();

        usuario.Rol = rol;
        return Mapear(usuario);
    }

    public async Task<UsuarioDto> ActualizarAsync(int id, UsuarioActualizarSolicitud solicitud, int usuarioActualId)
    {
        await using var transaccion = await _contexto.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var usuario = await _contexto.Usuarios.Include(usuario => usuario.Rol)
            .FirstOrDefaultAsync(usuario => usuario.Id == id)
            ?? throw new ExcepcionNegocio("Usuario no encontrado.");
        VerificarRolPermitido(usuario.Rol.Nombre);

        var correo = solicitud.Correo.Trim().ToLowerInvariant();

        if (await _contexto.Usuarios.AnyAsync(otro => otro.Id != id && (otro.Correo == correo || otro.NombreUsuario == correo)))
        {
            throw new ExcepcionNegocio("El correo ya está registrado por otro usuario.");
        }

        var rol = await _contexto.Roles.FirstOrDefaultAsync(rol => rol.Id == solicitud.RolId && rol.Activo)
            ?? throw new ExcepcionNegocio("El rol seleccionado no existe o está inactivo.");

        VerificarRolPermitido(rol.Nombre);
        if (id == usuarioActualId && (!solicitud.Activo || rol.Id != usuario.RolId))
        {
            throw new ExcepcionNegocio("No puede desactivar su propia cuenta ni cambiar su propio rol.");
        }

        if (usuario.Rol.Nombre == "Superadmin" && (!solicitud.Activo || rol.Nombre != "Superadmin"))
        {
            var otrosAdministradores = await _contexto.Usuarios.CountAsync(otro =>
                otro.Id != id && otro.Activo && otro.Rol.Nombre == "Superadmin");

            if (otrosAdministradores == 0)
            {
                throw new ExcepcionNegocio("Debe existir al menos un superadmin activo.");
            }
        }

        usuario.NombreCompleto = solicitud.NombreCompleto.Trim();
        usuario.Correo = correo;
        usuario.RolId = rol.Id;
        usuario.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de usuario", "Seguridad", usuario.Id, $"Usuario {usuario.NombreUsuario}");
        await _contexto.SaveChangesAsync();
        await _proteccion.RevocarAsync(usuario.Id);
        await transaccion.CommitAsync();

        usuario.Rol = rol;
        return Mapear(usuario);
    }

    public async Task RestablecerContrasenaAsync(int id, RestablecerContrasenaSolicitud solicitud)
    {
        await using var transaccion = await _contexto.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var usuario = await _contexto.Usuarios.Include(x => x.Rol).FirstOrDefaultAsync(usuario => usuario.Id == id)
            ?? throw new ExcepcionNegocio("Usuario no encontrado.");
        VerificarRolPermitido(usuario.Rol.Nombre);

        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.ContrasenaNueva);
        _bitacora.Registrar("Restablecimiento de contraseña", "Seguridad", usuario.Id, $"Usuario {usuario.NombreUsuario}");
        await _contexto.SaveChangesAsync();
        await _proteccion.RevocarAsync(usuario.Id);
        await transaccion.CommitAsync();
    }

    private static UsuarioDto Mapear(Usuario usuario) => new()
    {
        Id = usuario.Id,
        NombreCompleto = usuario.NombreCompleto,
        NombreUsuario = usuario.NombreUsuario,
        Correo = usuario.Correo,
        RolId = usuario.RolId,
        Rol = usuario.Rol.Nombre,
        Activo = usuario.Activo,
        FechaCreacion = usuario.FechaCreacion,
        UltimoAcceso = usuario.UltimoAcceso
    };

    private bool EsSuperadmin => _http.HttpContext?.User.IsInRole("Superadmin") == true;
    private void VerificarRolPermitido(string rol)
    {
        if (rol == "Superadmin" && !EsSuperadmin)
            throw new AccesoDenegadoException("Solo un superadmin puede asignar ese rol o modificar cuentas de superadmin.");
    }
}

public class AccesoDenegadoException(string mensaje) : Exception(mensaje);

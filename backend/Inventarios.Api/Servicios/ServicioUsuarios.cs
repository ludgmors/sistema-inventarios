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

    public ServicioUsuarios(
        ContextoInventarios contexto,
        IPasswordHasher<Usuario> hasher,
        ServicioBitacora bitacora, ServicioProteccionAcceso proteccion)
    {
        _contexto = contexto;
        _hasher = hasher;
        _bitacora = bitacora;
        _proteccion = proteccion;
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
        var usuario = await _contexto.Usuarios.Include(usuario => usuario.Rol)
            .FirstOrDefaultAsync(usuario => usuario.Id == id)
            ?? throw new ExcepcionNegocio("Usuario no encontrado.");

        var correo = solicitud.Correo.Trim().ToLowerInvariant();

        if (await _contexto.Usuarios.AnyAsync(otro => otro.Id != id && (otro.Correo == correo || otro.NombreUsuario == correo)))
        {
            throw new ExcepcionNegocio("El correo ya está registrado por otro usuario.");
        }

        var rol = await _contexto.Roles.FirstOrDefaultAsync(rol => rol.Id == solicitud.RolId && rol.Activo)
            ?? throw new ExcepcionNegocio("El rol seleccionado no existe o está inactivo.");

        if (id == usuarioActualId && !solicitud.Activo)
        {
            throw new ExcepcionNegocio("No puede desactivar su propio usuario.");
        }

        if (usuario.Rol.Nombre == "Administrador" && (!solicitud.Activo || rol.Nombre != "Administrador"))
        {
            var otrosAdministradores = await _contexto.Usuarios.CountAsync(otro =>
                otro.Id != id && otro.Activo && otro.Rol.Nombre == "Administrador");

            if (otrosAdministradores == 0)
            {
                throw new ExcepcionNegocio("Debe existir al menos un administrador activo.");
            }
        }

        usuario.NombreCompleto = solicitud.NombreCompleto.Trim();
        usuario.Correo = correo;
        usuario.RolId = rol.Id;
        usuario.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de usuario", "Seguridad", usuario.Id, $"Usuario {usuario.NombreUsuario}");
        await _contexto.SaveChangesAsync();
        await _proteccion.RevocarAsync(usuario.Id);

        usuario.Rol = rol;
        return Mapear(usuario);
    }

    public async Task RestablecerContrasenaAsync(int id, RestablecerContrasenaSolicitud solicitud)
    {
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(usuario => usuario.Id == id)
            ?? throw new ExcepcionNegocio("Usuario no encontrado.");

        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.ContrasenaNueva);
        _bitacora.Registrar("Restablecimiento de contraseña", "Seguridad", usuario.Id, $"Usuario {usuario.NombreUsuario}");
        await _contexto.SaveChangesAsync();
        await _proteccion.RevocarAsync(usuario.Id);
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
}

using System.ComponentModel.DataAnnotations;

namespace Inventarios.Api.DTOs;

public class LoginSolicitud
{
    [Required(ErrorMessage = "El usuario es obligatorio.")]
    [MaxLength(150)]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MaxLength(100)]
    public string Contrasena { get; set; } = string.Empty;
}

public class UsuarioSesionDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
}

public class LoginRespuesta
{
    [System.Text.Json.Serialization.JsonIgnore]
    public string Token { get; set; } = string.Empty;
    public DateTime Expira { get; set; }
    public UsuarioSesionDto Usuario { get; set; } = new();
}

public class CambiarContrasenaSolicitud
{
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    public string ContrasenaActual { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña nueva es obligatoria.")]
    [MinLength(12, ErrorMessage = "La contraseña debe tener al menos 12 caracteres.")]
    [MaxLength(100)]
    public string ContrasenaNueva { get; set; } = string.Empty;
}

public class UsuarioDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimoAcceso { get; set; }
}

public class UsuarioCrearSolicitud
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(150)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    [MaxLength(150)]
    [NombreUsuario]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [CorreoFormal]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(12, ErrorMessage = "La contraseña debe tener al menos 12 caracteres.")]
    [MaxLength(100)]
    public string Contrasena { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol.")]
    public int RolId { get; set; }
}

public class UsuarioActualizarSolicitud
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(150)]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [CorreoFormal]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol.")]
    public int RolId { get; set; }

    public bool Activo { get; set; } = true;
}

public class RestablecerContrasenaSolicitud
{
    [Required(ErrorMessage = "La contraseña nueva es obligatoria.")]
    [MinLength(12, ErrorMessage = "La contraseña debe tener al menos 12 caracteres.")]
    [MaxLength(100)]
    public string ContrasenaNueva { get; set; } = string.Empty;
}

public class RolDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

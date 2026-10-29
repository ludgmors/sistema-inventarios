using System.ComponentModel.DataAnnotations;

namespace Inventarios.Api.DTOs;

public class RecuperarSolicitud
{
    [Required, CorreoFormal]
    public string Correo { get; set; } = string.Empty;
}

public class RestablecerSolicitud
{
    [Required, StringLength(64, MinimumLength = 64)]
    public string Token { get; set; } = string.Empty;
    [Required, MinLength(12), MaxLength(100)]
    public string ContrasenaNueva { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace Inventarios.Api.DTOs;

public class ParametroDto
{
    public int Id { get; set; }
    public string Clave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Grupo { get; set; } = string.Empty;
}

public class ParametroGuardarSolicitud
{
    [Required(ErrorMessage = "El valor es obligatorio.")]
    [MaxLength(500)]
    public string Valor { get; set; } = string.Empty;
}

public class ParametrosActualizarSolicitud
{
    [Required]
    public List<ParametroValorSolicitud> Parametros { get; set; } = new();
}

public class ParametroValorSolicitud
{
    [Required]
    [MaxLength(100)]
    public string Clave { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Valor { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Inventarios.Api.DTOs;

public class DesafioLoginRespuesta
{
    public bool RequiereCodigo => true;
    public string DesafioId { get; set; } = string.Empty;
    public string CorreoOculto { get; set; } = string.Empty;
    public DateTime ExpiraUtc { get; set; }
    public int ReenviarEnSegundos { get; set; } = 60;
    [JsonIgnore] public string Navegador { get; set; } = string.Empty;
}
public class VerificarCodigoSolicitud
{
    [Required, RegularExpression("^[a-f0-9]{32}$")]
    public string DesafioId { get; set; } = string.Empty;
    [Required, RegularExpression("^[0-9]{6}$")]
    public string Codigo { get; set; } = string.Empty;
}
public class ReenviarCodigoSolicitud
{
    [Required, RegularExpression("^[a-f0-9]{32}$")]
    public string DesafioId { get; set; } = string.Empty;
}

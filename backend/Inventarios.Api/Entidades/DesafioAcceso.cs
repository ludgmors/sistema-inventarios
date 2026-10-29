namespace Inventarios.Api.Entidades;

public class DesafioAcceso
{
    public string Id { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string HashCodigo { get; set; } = string.Empty;
    public string HashNavegador { get; set; } = string.Empty;
    public string VersionCredenciales { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public int RolId { get; set; }
    public DateTime CreadoUtc { get; set; }
    public DateTime ExpiraUtc { get; set; }
    public DateTime UltimoEnvioUtc { get; set; }
    public int Intentos { get; set; }
    public DateTime? UsadoUtc { get; set; }
}

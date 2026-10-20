namespace Inventarios.Api.Entidades;

public class Bitacora
{
    public long Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string? Detalle { get; set; }
    public string? DireccionIp { get; set; }
}

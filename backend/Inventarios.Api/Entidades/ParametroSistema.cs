namespace Inventarios.Api.Entidades;

public class ParametroSistema
{
    public int Id { get; set; }
    public string Clave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Grupo { get; set; } = "General";
}

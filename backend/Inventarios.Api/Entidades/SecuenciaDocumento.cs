namespace Inventarios.Api.Entidades;

public class SecuenciaDocumento
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Prefijo { get; set; } = string.Empty;
    public int UltimoNumero { get; set; }
    public byte[]? RowVersion { get; set; }
}

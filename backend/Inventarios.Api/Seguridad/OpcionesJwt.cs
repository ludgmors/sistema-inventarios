namespace Inventarios.Api.Seguridad;

public class OpcionesJwt
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int MinutosExpiracion { get; set; } = 480;
}

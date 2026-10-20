namespace Inventarios.Api.DTOs;

public class AjusteRespuestaDto
{
    public string Numero { get; set; } = string.Empty;
    public int ProductoId { get; set; }
    public string Producto { get; set; } = string.Empty;
    public decimal ExistenciaNueva { get; set; }
}

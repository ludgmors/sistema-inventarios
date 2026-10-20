namespace Inventarios.Api.Entidades;

public class MovimientoInventario
{
    public long Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
    public TipoMovimiento Tipo { get; set; }
    public OrigenMovimiento Origen { get; set; }
    public int? DocumentoId { get; set; }
    public string? DocumentoNumero { get; set; }
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal SaldoAnterior { get; set; }
    public decimal SaldoNuevo { get; set; }
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string? Observacion { get; set; }
}

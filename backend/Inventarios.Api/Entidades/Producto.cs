namespace Inventarios.Api.Entidades;

public class Producto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int CategoriaId { get; set; }
    public Categoria Categoria { get; set; } = null!;
    public string UnidadMedida { get; set; } = "Unidad";
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public byte[]? RowVersion { get; set; }
    public ICollection<CompraDetalle> ComprasDetalle { get; set; } = new List<CompraDetalle>();
    public ICollection<VentaDetalle> VentasDetalle { get; set; } = new List<VentaDetalle>();
    public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
}

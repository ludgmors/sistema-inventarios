namespace Inventarios.Api.Entidades;

public class Compra
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
    public int ProveedorId { get; set; }
    public Proveedor Proveedor { get; set; } = null!;
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Registrada;
    public string? Observaciones { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public int? UsuarioAnulacionId { get; set; }
    public Usuario? UsuarioAnulacion { get; set; }
    public ICollection<CompraDetalle> Detalles { get; set; } = new List<CompraDetalle>();
}

public class CompraDetalle
{
    public int Id { get; set; }
    public int CompraId { get; set; }
    public Compra Compra { get; set; } = null!;
    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

namespace Inventarios.Api.Entidades;

public class Venta
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.Now;
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string FormaPago { get; set; } = "Efectivo";
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Registrada;
    public string? Observaciones { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public int? UsuarioAnulacionId { get; set; }
    public Usuario? UsuarioAnulacion { get; set; }
    public ICollection<VentaDetalle> Detalles { get; set; } = new List<VentaDetalle>();
    public ICollection<NotaAjuste> Notas { get; set; } = new List<NotaAjuste>();
}

public class VentaDetalle
{
    public int Id { get; set; }
    public int VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Descuento { get; set; }
    public decimal Subtotal { get; set; }
}

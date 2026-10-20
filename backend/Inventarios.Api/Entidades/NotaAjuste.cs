namespace Inventarios.Api.Entidades;

public class NotaAjuste
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public TipoNota Tipo { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    public int VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public string Motivo { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Registrada;
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public DateTime? FechaAnulacion { get; set; }
    public ICollection<NotaAjusteDetalle> Detalles { get; set; } = new List<NotaAjusteDetalle>();
}

public class NotaAjusteDetalle
{
    public int Id { get; set; }
    public int NotaAjusteId { get; set; }
    public NotaAjuste NotaAjuste { get; set; } = null!;
    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

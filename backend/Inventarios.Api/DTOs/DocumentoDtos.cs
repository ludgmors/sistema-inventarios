using System.ComponentModel.DataAnnotations;

namespace Inventarios.Api.DTOs;

public class CompraLineaSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un producto.")]
    public int ProductoId { get; set; }

    [Range(0.0001, 999999999, ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public decimal Cantidad { get; set; }

    [Range(0, 999999999, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioUnitario { get; set; }
}

public class CompraCrearSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un proveedor.")]
    public int ProveedorId { get; set; }

    public DateTime? Fecha { get; set; }

    [Range(0, 100, ErrorMessage = "El impuesto debe estar entre 0 y 100.")]
    public decimal? ImpuestoPorcentaje { get; set; }

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    [MinLength(1, ErrorMessage = "La compra debe tener al menos un producto.")]
    public List<CompraLineaSolicitud> Detalles { get; set; } = new();
}

public class CompraDetalleDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class CompraDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int ProveedorId { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public List<CompraDetalleDto> Detalles { get; set; } = new();
}

public class CompraResumenDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int CantidadProductos { get; set; }
}

public class VentaLineaSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un producto.")]
    public int ProductoId { get; set; }

    [Range(0.0001, 999999999, ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public decimal Cantidad { get; set; }

    [Range(0, 999999999, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioUnitario { get; set; }

    [Range(0, 999999999, ErrorMessage = "El descuento no puede ser negativo.")]
    public decimal Descuento { get; set; }
}

public class VentaCrearSolicitud
{
    public int? ClienteId { get; set; }

    public DateTime? Fecha { get; set; }

    [Required(ErrorMessage = "La forma de pago es obligatoria.")]
    [MaxLength(50)]
    public string FormaPago { get; set; } = "Efectivo";

    [Range(0, 999999999, ErrorMessage = "El descuento no puede ser negativo.")]
    public decimal Descuento { get; set; }

    [Range(0, 100, ErrorMessage = "El impuesto debe estar entre 0 y 100.")]
    public decimal? ImpuestoPorcentaje { get; set; }

    [MaxLength(500)]
    public string? Observaciones { get; set; }

    [MinLength(1, ErrorMessage = "La venta debe tener al menos un producto.")]
    public List<VentaLineaSolicitud> Detalles { get; set; } = new();
}

public class VentaDetalleDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Descuento { get; set; }
    public decimal Subtotal { get; set; }
}

public class VentaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int? ClienteId { get; set; }
    public string Cliente { get; set; } = "Consumidor final";
    public string Usuario { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Descuento { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string FormaPago { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public List<VentaDetalleDto> Detalles { get; set; } = new();
    public List<NotaResumenDto> Notas { get; set; } = new();
}

public class VentaResumenDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Cliente { get; set; } = "Consumidor final";
    public string Usuario { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string FormaPago { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public int CantidadProductos { get; set; }
}

public class NotaLineaSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un producto.")]
    public int ProductoId { get; set; }

    [Range(0.0001, 999999999, ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public decimal Cantidad { get; set; }

    [Range(0, 999999999, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioUnitario { get; set; }
}

public class NotaCrearSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar una venta.")]
    public int VentaId { get; set; }

    [Required(ErrorMessage = "El tipo de nota es obligatorio.")]
    public string Tipo { get; set; } = "Credito";

    [Required(ErrorMessage = "El motivo es obligatorio.")]
    [MaxLength(300)]
    public string Motivo { get; set; } = string.Empty;

    public DateTime? Fecha { get; set; }

    [Range(0, 100, ErrorMessage = "El impuesto debe estar entre 0 y 100.")]
    public decimal? ImpuestoPorcentaje { get; set; }

    [MinLength(1, ErrorMessage = "La nota debe tener al menos un producto.")]
    public List<NotaLineaSolicitud> Detalles { get; set; } = new();
}

public class NotaDetalleDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class NotaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int VentaId { get; set; }
    public string VentaNumero { get; set; } = string.Empty;
    public string Cliente { get; set; } = "Consumidor final";
    public string Motivo { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ImpuestoPorcentaje { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public DateTime? FechaAnulacion { get; set; }
    public List<NotaDetalleDto> Detalles { get; set; } = new();
}

public class NotaResumenDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public int VentaId { get; set; }
    public string VentaNumero { get; set; } = string.Empty;
    public string Cliente { get; set; } = "Consumidor final";
    public string Motivo { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
}

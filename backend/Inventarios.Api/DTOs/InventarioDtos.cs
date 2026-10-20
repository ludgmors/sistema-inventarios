using System.ComponentModel.DataAnnotations;
using Inventarios.Api.Entidades;

namespace Inventarios.Api.DTOs;

public class MovimientoDto
{
    public long Id { get; set; }
    public DateTime Fecha { get; set; }
    public int ProductoId { get; set; }
    public string CodigoProducto { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string? DocumentoNumero { get; set; }
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal SaldoAnterior { get; set; }
    public decimal SaldoNuevo { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string? Observacion { get; set; }
}

public class AjusteInventarioSolicitud
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un producto.")]
    public int ProductoId { get; set; }

    [Required(ErrorMessage = "El tipo de movimiento es obligatorio.")]
    public TipoMovimiento Tipo { get; set; }

    [Range(0.0001, 999999999, ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public decimal Cantidad { get; set; }

    [Range(0, 999999999, ErrorMessage = "El costo no puede ser negativo.")]
    public decimal? CostoUnitario { get; set; }

    [MaxLength(500)]
    public string? Observacion { get; set; }
}

public class ExistenciaDto
{
    public int ProductoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal ValorCosto { get; set; }
    public decimal ValorVenta { get; set; }
    public bool BajoMinimo { get; set; }
    public bool Activo { get; set; }
}

public class ResumenExistenciasDto
{
    public int TotalProductos { get; set; }
    public int ProductosBajoMinimo { get; set; }
    public decimal UnidadesEnStock { get; set; }
    public decimal ValorCosto { get; set; }
    public decimal ValorVenta { get; set; }
}

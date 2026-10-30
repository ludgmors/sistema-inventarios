namespace Inventarios.Api.DTOs;

public class KardexFilaDto
{
    public long Id { get; set; }
    public DateTime Fecha { get; set; }
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

public class ReporteVentaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string FormaPago { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class ReporteCompraDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class ReporteNotaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string VentaNumero { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class TopProductoDto
{
    public int ProductoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal CantidadVendida { get; set; }
    public decimal TotalVendido { get; set; }
}

public class VentaPorDiaDto
{
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public int Cantidad { get; set; }
}

public class BajoMinimoDto
{
    public int ProductoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public decimal Faltante { get; set; }
}

public class DashboardDto
{
    public decimal VentasHoy { get; set; }
    public decimal VentasMes { get; set; }
    public decimal ComprasHoy { get; set; }
    public decimal ComprasMes { get; set; }
    public int ProductosActivos { get; set; }
    public int ProductosBajoMinimo { get; set; }
    public int ClientesActivos { get; set; }
    public int ProveedoresActivos { get; set; }
    public int MovimientosHoy { get; set; }
    public List<VentaPorDiaDto> VentasUltimosDias { get; set; } = new();
    public List<TopProductoDto> TopProductos { get; set; } = new();
    public List<BajoMinimoDto> ProductosBajoMinimoLista { get; set; } = new();
    public List<ReporteVentaDto> UltimasVentas { get; set; } = new();

    // Indicadores gerenciales del mes y comparativos.
    public decimal VentasMesAnterior { get; set; }
    public decimal ComprasMesAnterior { get; set; }
    public int CantidadVentasMes { get; set; }
    public int CantidadComprasMes { get; set; }
    public int CantidadVentasMesAnterior { get; set; }
    public decimal TicketPromedioMes { get; set; }
    public decimal CostoVentasMes { get; set; }
    public decimal MargenBrutoMes { get; set; }
    public decimal PorcentajeMargenMes { get; set; }
    public decimal ValorInventarioCosto { get; set; }
    public decimal ValorInventarioVenta { get; set; }
    public decimal MargenPotencialInventario { get; set; }
    public int ProductosSinExistencia { get; set; }
    public List<VentaFormaPagoDto> VentasPorFormaPago { get; set; } = new();
    public List<TopClienteDto> TopClientes { get; set; } = new();
    public List<MesResumenDto> VentasPorMes { get; set; } = new();
    public DateTime ActualizadoUtc { get; set; }
}

public class VentaFormaPagoDto
{
    public string FormaPago { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int Cantidad { get; set; }
}

public class TopClienteDto
{
    public int? ClienteId { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int Cantidad { get; set; }
}

public class MesResumenDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public string Etiqueta { get; set; } = string.Empty;
    public decimal Ventas { get; set; }
    public decimal Compras { get; set; }
}

public class ResumenPeriodoDto
{
    public decimal TotalVentas { get; set; }
    public int CantidadVentas { get; set; }
    public decimal TotalCompras { get; set; }
    public int CantidadCompras { get; set; }
    public decimal TotalNotasCredito { get; set; }
    public decimal TotalNotasDebito { get; set; }
}

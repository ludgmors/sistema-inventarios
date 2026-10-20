using Inventarios.Api.Datos;
using Inventarios.Api.Entidades;

namespace Inventarios.Api.Servicios;

public class ServicioInventario
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioParametros _parametros;

    public ServicioInventario(ContextoInventarios contexto, ServicioParametros parametros)
    {
        _contexto = contexto;
        _parametros = parametros;
    }

    public Task RegistrarEntradaAsync(
        Producto producto,
        decimal cantidad,
        decimal costoUnitario,
        OrigenMovimiento origen,
        int? documentoId,
        string? documentoNumero,
        int usuarioId,
        string? observacion,
        DateTime? fecha = null,
        bool actualizarCostoPromedio = false)
    {
        if (cantidad <= 0)
        {
            throw new ExcepcionNegocio("La cantidad del movimiento debe ser mayor que cero.");
        }

        var saldoAnterior = producto.ExistenciaActual;

        if (actualizarCostoPromedio)
        {
            var valorAnterior = saldoAnterior > 0 ? saldoAnterior * producto.PrecioCosto : 0m;
            var valorNuevo = cantidad * costoUnitario;
            producto.PrecioCosto = Math.Round(
                (valorAnterior + valorNuevo) / (saldoAnterior + cantidad),
                2,
                MidpointRounding.AwayFromZero);
        }

        producto.ExistenciaActual += cantidad;

        _contexto.MovimientosInventario.Add(new MovimientoInventario
        {
            Fecha = fecha ?? DateTime.Now,
            ProductoId = producto.Id,
            Tipo = TipoMovimiento.Entrada,
            Origen = origen,
            DocumentoId = documentoId,
            DocumentoNumero = documentoNumero,
            Cantidad = cantidad,
            CostoUnitario = costoUnitario,
            SaldoAnterior = saldoAnterior,
            SaldoNuevo = producto.ExistenciaActual,
            UsuarioId = usuarioId,
            Observacion = observacion
        });

        return Task.CompletedTask;
    }

    public async Task RegistrarSalidaAsync(
        Producto producto,
        decimal cantidad,
        decimal costoUnitario,
        OrigenMovimiento origen,
        int? documentoId,
        string? documentoNumero,
        int usuarioId,
        string? observacion,
        DateTime? fecha = null)
    {
        if (cantidad <= 0)
        {
            throw new ExcepcionNegocio("La cantidad del movimiento debe ser mayor que cero.");
        }

        var permiteNegativo = await _parametros.PermiteStockNegativoAsync();

        if (!permiteNegativo && producto.ExistenciaActual < cantidad)
        {
            throw new ExcepcionNegocio(
                $"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.ExistenciaActual:0.####}, solicitado: {cantidad:0.####}.");
        }

        var saldoAnterior = producto.ExistenciaActual;
        producto.ExistenciaActual -= cantidad;

        _contexto.MovimientosInventario.Add(new MovimientoInventario
        {
            Fecha = fecha ?? DateTime.Now,
            ProductoId = producto.Id,
            Tipo = TipoMovimiento.Salida,
            Origen = origen,
            DocumentoId = documentoId,
            DocumentoNumero = documentoNumero,
            Cantidad = cantidad,
            CostoUnitario = costoUnitario,
            SaldoAnterior = saldoAnterior,
            SaldoNuevo = producto.ExistenciaActual,
            UsuarioId = usuarioId,
            Observacion = observacion
        });
    }
}

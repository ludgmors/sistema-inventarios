namespace Inventarios.Api.Entidades;

public enum EstadoDocumento
{
    Registrada = 1,
    Anulada = 2
}

public enum TipoMovimiento
{
    Entrada = 1,
    Salida = 2
}

public enum OrigenMovimiento
{
    Compra = 1,
    Venta = 2,
    NotaCredito = 3,
    NotaDebito = 4,
    Ajuste = 5,
    Anulacion = 6
}

public enum TipoNota
{
    Credito = 1,
    Debito = 2
}

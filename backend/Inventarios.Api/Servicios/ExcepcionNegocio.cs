namespace Inventarios.Api.Servicios;

public class ExcepcionNegocio : Exception
{
    public ExcepcionNegocio(string mensaje)
        : base(mensaje)
    {
    }
}

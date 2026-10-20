namespace Inventarios.Api.DTOs;

public class ConsultaPaginada
{
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 20;
    public string? Buscar { get; set; }

    public int PaginaNormalizada => Pagina < 1 ? 1 : Pagina;
    public int TamanoNormalizado => TamanoPagina is < 1 or > 200 ? 20 : TamanoPagina;
}

public class ResultadoPaginado<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Pagina { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalPaginas => TamanoPagina == 0 ? 0 : (int)Math.Ceiling((double)Total / TamanoPagina);
}

public class MensajeRespuesta
{
    public string Mensaje { get; set; } = string.Empty;

    public MensajeRespuesta()
    {
    }

    public MensajeRespuesta(string mensaje)
    {
        Mensaje = mensaje;
    }
}

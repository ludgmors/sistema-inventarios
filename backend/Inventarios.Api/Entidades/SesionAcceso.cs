namespace Inventarios.Api.Entidades;

public class SesionAcceso
{
    public string Id { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public string VersionCredenciales { get; set; } = string.Empty;
    public int RolId { get; set; }
    public DateTime ExpiraUtc { get; set; }
    public DateTime UltimaActividadUtc { get; set; }
    public DateTime? RevocadaUtc { get; set; }
}

public class RecuperacionAcceso
{
    public string Hash { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public DateTime ExpiraUtc { get; set; }
    public DateTime? UsadoUtc { get; set; }
}

public class LimiteAcceso
{
    public string Clave { get; set; } = string.Empty;
    public DateTime InicioUtc { get; set; }
    public int Cantidad { get; set; }
    public DateTime? BloqueadoHastaUtc { get; set; }
}

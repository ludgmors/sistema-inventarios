using System.Security.Claims;
using Inventarios.Api.Datos;
using Inventarios.Api.Entidades;

namespace Inventarios.Api.Servicios;

public class ServicioBitacora
{
    private readonly ContextoInventarios _contexto;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ServicioBitacora(ContextoInventarios contexto, IHttpContextAccessor httpContextAccessor)
    {
        _contexto = contexto;
        _httpContextAccessor = httpContextAccessor;
    }

    public void Registrar(string accion, string modulo, int? entidadId = null, string? detalle = null)
    {
        var http = _httpContextAccessor.HttpContext;
        var usuario = http?.User;

        int? usuarioId = int.TryParse(
            usuario?.FindFirstValue(ClaimTypes.NameIdentifier),
            out var id)
            ? id
            : null;

        _contexto.Bitacoras.Add(new Bitacora
        {
            Fecha = DateTime.Now,
            UsuarioId = usuarioId,
            UsuarioNombre = usuario?.FindFirstValue(ClaimTypes.Name) ?? "Sistema",
            Accion = accion,
            Modulo = modulo,
            EntidadId = entidadId,
            Detalle = detalle,
            DireccionIp = http?.Connection.RemoteIpAddress?.ToString()
        });
    }
}

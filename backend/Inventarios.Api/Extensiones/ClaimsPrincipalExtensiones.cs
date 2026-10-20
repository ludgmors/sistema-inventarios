using System.Security.Claims;

namespace Inventarios.Api.Extensiones;

public static class ClaimsPrincipalExtensiones
{
    public static int ObtenerUsuarioId(this ClaimsPrincipal usuario)
    {
        return int.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    }

    public static string ObtenerNombreUsuario(this ClaimsPrincipal usuario)
    {
        return usuario.FindFirstValue(ClaimTypes.Name) ?? "Sistema";
    }

    public static string ObtenerRol(this ClaimsPrincipal usuario)
    {
        return usuario.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}

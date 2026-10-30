using Inventarios.Api.Datos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/administracion")]
[Authorize(Roles = "Superadmin,Administrador")]
public class AdministracionController(ContextoInventarios db) : ControllerBase
{
    [HttpGet("resumen")]
    public async Task<IActionResult> Resumen()
    {
        var ahora = DateTime.UtcNow;
        var total = await db.Usuarios.CountAsync();
        var activos = await db.Usuarios.CountAsync(x => x.Activo);
        var administradores = await db.Usuarios.CountAsync(x => x.Activo && (x.Rol.Nombre == "Administrador" || x.Rol.Nombre == "Superadmin"));
        var bloqueados = await db.Usuarios.CountAsync(x => x.Activo && x.BloqueadoHastaUtc > ahora);
        var actividad = await db.Bitacoras.AsNoTracking().Where(x => x.Modulo == "Seguridad")
            .OrderByDescending(x => x.Id).Take(12)
            .Select(x => new { x.Id, x.Fecha, x.UsuarioNombre, x.Accion }).ToListAsync();
        return Ok(new { total, activos, inactivos = total - activos, administradores, bloqueados, actividad });
    }
}

using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/proveedores")]
[Authorize]
public class ProveedoresController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioBitacora _bitacora;

    public ProveedoresController(ContextoInventarios contexto, ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _bitacora = bitacora;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<ProveedorDto>>> Listar([FromQuery] ConsultaPaginada consulta)
    {
        var query = _contexto.Proveedores.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(proveedor =>
                proveedor.Codigo.Contains(termino) ||
                proveedor.RazonSocial.Contains(termino) ||
                (proveedor.Documento != null && proveedor.Documento.Contains(termino)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(proveedor => proveedor.RazonSocial)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(proveedor => new ProveedorDto
            {
                Id = proveedor.Id,
                Codigo = proveedor.Codigo,
                RazonSocial = proveedor.RazonSocial,
                Documento = proveedor.Documento,
                Contacto = proveedor.Contacto,
                Telefono = proveedor.Telefono,
                Correo = proveedor.Correo,
                Direccion = proveedor.Direccion,
                Activo = proveedor.Activo,
                FechaCreacion = proveedor.FechaCreacion
            })
            .ToListAsync();

        return Ok(new ResultadoPaginado<ProveedorDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProveedorDto>> Obtener(int id)
    {
        var proveedor = await _contexto.Proveedores.AsNoTracking()
            .Where(proveedor => proveedor.Id == id)
            .Select(proveedor => new ProveedorDto
            {
                Id = proveedor.Id,
                Codigo = proveedor.Codigo,
                RazonSocial = proveedor.RazonSocial,
                Documento = proveedor.Documento,
                Contacto = proveedor.Contacto,
                Telefono = proveedor.Telefono,
                Correo = proveedor.Correo,
                Direccion = proveedor.Direccion,
                Activo = proveedor.Activo,
                FechaCreacion = proveedor.FechaCreacion
            })
            .FirstOrDefaultAsync();

        return proveedor is null ? NotFound() : Ok(proveedor);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<ProveedorDto>> Crear(ProveedorGuardarSolicitud solicitud)
    {
        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Proveedores.AnyAsync(proveedor => proveedor.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un proveedor con ese código.");
        }

        var proveedor = new Proveedor
        {
            Codigo = codigo,
            RazonSocial = solicitud.RazonSocial.Trim(),
            Documento = solicitud.Documento?.Trim(),
            Contacto = solicitud.Contacto?.Trim(),
            Telefono = solicitud.Telefono?.Trim(),
            Correo = solicitud.Correo?.Trim().ToLowerInvariant(),
            Direccion = solicitud.Direccion?.Trim(),
            Activo = solicitud.Activo,
            FechaCreacion = DateTime.Now
        };

        _contexto.Proveedores.Add(proveedor);
        _bitacora.Registrar("Creación de proveedor", "Proveedores", null, proveedor.RazonSocial);
        await _contexto.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, Mapear(proveedor));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<ProveedorDto>> Actualizar(int id, ProveedorGuardarSolicitud solicitud)
    {
        var proveedor = await _contexto.Proveedores.FirstOrDefaultAsync(proveedor => proveedor.Id == id)
            ?? throw new ExcepcionNegocio("Proveedor no encontrado.");

        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Proveedores.AnyAsync(otro => otro.Id != id && otro.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un proveedor con ese código.");
        }

        proveedor.Codigo = codigo;
        proveedor.RazonSocial = solicitud.RazonSocial.Trim();
        proveedor.Documento = solicitud.Documento?.Trim();
        proveedor.Contacto = solicitud.Contacto?.Trim();
        proveedor.Telefono = solicitud.Telefono?.Trim();
        proveedor.Correo = solicitud.Correo?.Trim().ToLowerInvariant();
        proveedor.Direccion = solicitud.Direccion?.Trim();
        proveedor.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de proveedor", "Proveedores", proveedor.Id, proveedor.RazonSocial);
        await _contexto.SaveChangesAsync();

        return Ok(Mapear(proveedor));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var proveedor = await _contexto.Proveedores.FirstOrDefaultAsync(proveedor => proveedor.Id == id)
            ?? throw new ExcepcionNegocio("Proveedor no encontrado.");

        if (await _contexto.Compras.AnyAsync(compra => compra.ProveedorId == id))
        {
            throw new ExcepcionNegocio("No se puede eliminar el proveedor porque tiene compras registradas.");
        }

        _contexto.Proveedores.Remove(proveedor);
        _bitacora.Registrar("Eliminación de proveedor", "Proveedores", id, proveedor.RazonSocial);
        await _contexto.SaveChangesAsync();

        return NoContent();
    }

    private static ProveedorDto Mapear(Proveedor proveedor) => new()
    {
        Id = proveedor.Id,
        Codigo = proveedor.Codigo,
        RazonSocial = proveedor.RazonSocial,
        Documento = proveedor.Documento,
        Contacto = proveedor.Contacto,
        Telefono = proveedor.Telefono,
        Correo = proveedor.Correo,
        Direccion = proveedor.Direccion,
        Activo = proveedor.Activo,
        FechaCreacion = proveedor.FechaCreacion
    };
}

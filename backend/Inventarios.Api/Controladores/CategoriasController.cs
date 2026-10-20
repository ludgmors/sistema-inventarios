using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioBitacora _bitacora;

    public CategoriasController(ContextoInventarios contexto, ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _bitacora = bitacora;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoriaDto>>> Listar([FromQuery] string? buscar)
    {
        var query = _contexto.Categorias.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var termino = buscar.Trim();
            query = query.Where(categoria => categoria.Nombre.Contains(termino));
        }

        return Ok(await query
            .OrderBy(categoria => categoria.Nombre)
            .Select(categoria => new CategoriaDto
            {
                Id = categoria.Id,
                Nombre = categoria.Nombre,
                Descripcion = categoria.Descripcion,
                Activo = categoria.Activo,
                CantidadProductos = categoria.Productos.Count
            })
            .ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoriaDto>> Obtener(int id)
    {
        var categoria = await _contexto.Categorias.AsNoTracking()
            .Where(categoria => categoria.Id == id)
            .Select(categoria => new CategoriaDto
            {
                Id = categoria.Id,
                Nombre = categoria.Nombre,
                Descripcion = categoria.Descripcion,
                Activo = categoria.Activo,
                CantidadProductos = categoria.Productos.Count
            })
            .FirstOrDefaultAsync();

        return categoria is null ? NotFound() : Ok(categoria);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<CategoriaDto>> Crear(CategoriaGuardarSolicitud solicitud)
    {
        var nombre = solicitud.Nombre.Trim();

        if (await _contexto.Categorias.AnyAsync(categoria => categoria.Nombre == nombre))
        {
            throw new ExcepcionNegocio("Ya existe una categoría con ese nombre.");
        }

        var categoria = new Categoria
        {
            Nombre = nombre,
            Descripcion = solicitud.Descripcion?.Trim(),
            Activo = solicitud.Activo
        };

        _contexto.Categorias.Add(categoria);
        _bitacora.Registrar("Creación de categoría", "Categorías", null, nombre);
        await _contexto.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new CategoriaDto
        {
            Id = categoria.Id,
            Nombre = categoria.Nombre,
            Descripcion = categoria.Descripcion,
            Activo = categoria.Activo
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Inventario")]
    public async Task<ActionResult<CategoriaDto>> Actualizar(int id, CategoriaGuardarSolicitud solicitud)
    {
        var categoria = await _contexto.Categorias.FirstOrDefaultAsync(categoria => categoria.Id == id)
            ?? throw new ExcepcionNegocio("Categoría no encontrada.");

        var nombre = solicitud.Nombre.Trim();

        if (await _contexto.Categorias.AnyAsync(otra => otra.Id != id && otra.Nombre == nombre))
        {
            throw new ExcepcionNegocio("Ya existe una categoría con ese nombre.");
        }

        categoria.Nombre = nombre;
        categoria.Descripcion = solicitud.Descripcion?.Trim();
        categoria.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de categoría", "Categorías", categoria.Id, categoria.Nombre);
        await _contexto.SaveChangesAsync();

        return Ok(new CategoriaDto
        {
            Id = categoria.Id,
            Nombre = categoria.Nombre,
            Descripcion = categoria.Descripcion,
            Activo = categoria.Activo
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var categoria = await _contexto.Categorias.FirstOrDefaultAsync(categoria => categoria.Id == id)
            ?? throw new ExcepcionNegocio("Categoría no encontrada.");

        if (await _contexto.Productos.AnyAsync(producto => producto.CategoriaId == id))
        {
            throw new ExcepcionNegocio("No se puede eliminar la categoría porque tiene productos asociados.");
        }

        _contexto.Categorias.Remove(categoria);
        _bitacora.Registrar("Eliminación de categoría", "Categorías", id, categoria.Nombre);
        await _contexto.SaveChangesAsync();

        return NoContent();
    }
}

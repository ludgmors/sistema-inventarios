using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/productos")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioBitacora _bitacora;

    public ProductosController(ContextoInventarios contexto, ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _bitacora = bitacora;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<ProductoDto>>> Listar(
        [FromQuery] ConsultaPaginada consulta,
        [FromQuery] int? categoriaId,
        [FromQuery] bool? soloActivos,
        [FromQuery] bool? soloBajoMinimo)
    {
        var query = _contexto.Productos.AsNoTracking().AsQueryable();

        if (categoriaId.HasValue)
        {
            query = query.Where(producto => producto.CategoriaId == categoriaId.Value);
        }

        if (soloActivos == true)
        {
            query = query.Where(producto => producto.Activo);
        }

        if (soloBajoMinimo == true)
        {
            query = query.Where(producto => producto.ExistenciaActual <= producto.ExistenciaMinima);
        }

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(producto =>
                producto.Codigo.Contains(termino) ||
                producto.Nombre.Contains(termino));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(producto => producto.Nombre)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(producto => new ProductoDto
            {
                Id = producto.Id,
                Codigo = producto.Codigo,
                Nombre = producto.Nombre,
                Descripcion = producto.Descripcion,
                CategoriaId = producto.CategoriaId,
                Categoria = producto.Categoria.Nombre,
                UnidadMedida = producto.UnidadMedida,
                PrecioCosto = producto.PrecioCosto,
                PrecioVenta = producto.PrecioVenta,
                ExistenciaActual = producto.ExistenciaActual,
                ExistenciaMinima = producto.ExistenciaMinima,
                Activo = producto.Activo,
                FechaCreacion = producto.FechaCreacion
            })
            .ToListAsync();

        return Ok(new ResultadoPaginado<ProductoDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductoDto>> Obtener(int id)
    {
        var producto = await _contexto.Productos.AsNoTracking()
            .Where(producto => producto.Id == id)
            .Select(producto => new ProductoDto
            {
                Id = producto.Id,
                Codigo = producto.Codigo,
                Nombre = producto.Nombre,
                Descripcion = producto.Descripcion,
                CategoriaId = producto.CategoriaId,
                Categoria = producto.Categoria.Nombre,
                UnidadMedida = producto.UnidadMedida,
                PrecioCosto = producto.PrecioCosto,
                PrecioVenta = producto.PrecioVenta,
                ExistenciaActual = producto.ExistenciaActual,
                ExistenciaMinima = producto.ExistenciaMinima,
                Activo = producto.Activo,
                FechaCreacion = producto.FechaCreacion
            })
            .FirstOrDefaultAsync();

        return producto is null ? NotFound() : Ok(producto);
    }

    [HttpPost]
    [Authorize(Roles = "Superadmin,Administrador,Inventario")]
    public async Task<ActionResult<ProductoDto>> Crear(ProductoGuardarSolicitud solicitud)
    {
        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Productos.AnyAsync(producto => producto.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un producto con ese código.");
        }

        var categoria = await _contexto.Categorias
            .FirstOrDefaultAsync(categoria => categoria.Id == solicitud.CategoriaId && categoria.Activo)
            ?? throw new ExcepcionNegocio("La categoría no existe o está inactiva.");

        var producto = new Producto
        {
            Codigo = codigo,
            Nombre = solicitud.Nombre.Trim(),
            Descripcion = solicitud.Descripcion?.Trim(),
            CategoriaId = categoria.Id,
            UnidadMedida = solicitud.UnidadMedida.Trim(),
            PrecioCosto = solicitud.PrecioCosto,
            PrecioVenta = solicitud.PrecioVenta,
            ExistenciaActual = 0,
            ExistenciaMinima = solicitud.ExistenciaMinima,
            Activo = solicitud.Activo,
            FechaCreacion = DateTime.Now
        };

        _contexto.Productos.Add(producto);
        _bitacora.Registrar("Creación de producto", "Productos", null, producto.Nombre);
        await _contexto.SaveChangesAsync();

        producto.Categoria = categoria;
        return StatusCode(StatusCodes.Status201Created, Mapear(producto));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Superadmin,Administrador,Inventario")]
    public async Task<ActionResult<ProductoDto>> Actualizar(int id, ProductoGuardarSolicitud solicitud)
    {
        var producto = await _contexto.Productos.Include(producto => producto.Categoria)
            .FirstOrDefaultAsync(producto => producto.Id == id)
            ?? throw new ExcepcionNegocio("Producto no encontrado.");

        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Productos.AnyAsync(otro => otro.Id != id && otro.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un producto con ese código.");
        }

        var categoria = await _contexto.Categorias
            .FirstOrDefaultAsync(categoria => categoria.Id == solicitud.CategoriaId && categoria.Activo)
            ?? throw new ExcepcionNegocio("La categoría no existe o está inactiva.");

        producto.Codigo = codigo;
        producto.Nombre = solicitud.Nombre.Trim();
        producto.Descripcion = solicitud.Descripcion?.Trim();
        producto.CategoriaId = categoria.Id;
        producto.UnidadMedida = solicitud.UnidadMedida.Trim();
        producto.PrecioCosto = solicitud.PrecioCosto;
        producto.PrecioVenta = solicitud.PrecioVenta;
        producto.ExistenciaMinima = solicitud.ExistenciaMinima;
        producto.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de producto", "Productos", producto.Id, producto.Nombre);
        await _contexto.SaveChangesAsync();

        producto.Categoria = categoria;
        return Ok(Mapear(producto));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Superadmin,Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var producto = await _contexto.Productos.FirstOrDefaultAsync(producto => producto.Id == id)
            ?? throw new ExcepcionNegocio("Producto no encontrado.");

        var tieneMovimientos =
            await _contexto.CompraDetalles.AnyAsync(detalle => detalle.ProductoId == id) ||
            await _contexto.VentaDetalles.AnyAsync(detalle => detalle.ProductoId == id) ||
            await _contexto.NotaAjusteDetalles.AnyAsync(detalle => detalle.ProductoId == id) ||
            await _contexto.MovimientosInventario.AnyAsync(movimiento => movimiento.ProductoId == id);

        if (tieneMovimientos)
        {
            throw new ExcepcionNegocio("El producto tiene movimientos o documentos asociados. Desactívelo en lugar de eliminarlo.");
        }

        _contexto.Productos.Remove(producto);
        _bitacora.Registrar("Eliminación de producto", "Productos", id, producto.Nombre);
        await _contexto.SaveChangesAsync();

        return NoContent();
    }

    private static ProductoDto Mapear(Producto producto) => new()
    {
        Id = producto.Id,
        Codigo = producto.Codigo,
        Nombre = producto.Nombre,
        Descripcion = producto.Descripcion,
        CategoriaId = producto.CategoriaId,
        Categoria = producto.Categoria.Nombre,
        UnidadMedida = producto.UnidadMedida,
        PrecioCosto = producto.PrecioCosto,
        PrecioVenta = producto.PrecioVenta,
        ExistenciaActual = producto.ExistenciaActual,
        ExistenciaMinima = producto.ExistenciaMinima,
        Activo = producto.Activo,
        FechaCreacion = producto.FechaCreacion
    };
}

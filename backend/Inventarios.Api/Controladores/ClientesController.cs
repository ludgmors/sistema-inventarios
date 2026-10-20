using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioBitacora _bitacora;

    public ClientesController(ContextoInventarios contexto, ServicioBitacora bitacora)
    {
        _contexto = contexto;
        _bitacora = bitacora;
    }

    [HttpGet]
    public async Task<ActionResult<ResultadoPaginado<ClienteDto>>> Listar([FromQuery] ConsultaPaginada consulta)
    {
        var query = _contexto.Clientes.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(consulta.Buscar))
        {
            var termino = consulta.Buscar.Trim();
            query = query.Where(cliente =>
                cliente.Codigo.Contains(termino) ||
                cliente.Nombre.Contains(termino) ||
                (cliente.Documento != null && cliente.Documento.Contains(termino)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(cliente => cliente.Nombre)
            .Skip((consulta.PaginaNormalizada - 1) * consulta.TamanoNormalizado)
            .Take(consulta.TamanoNormalizado)
            .Select(cliente => new ClienteDto
            {
                Id = cliente.Id,
                Codigo = cliente.Codigo,
                Nombre = cliente.Nombre,
                Documento = cliente.Documento,
                Telefono = cliente.Telefono,
                Correo = cliente.Correo,
                Direccion = cliente.Direccion,
                Activo = cliente.Activo,
                FechaCreacion = cliente.FechaCreacion
            })
            .ToListAsync();

        return Ok(new ResultadoPaginado<ClienteDto>
        {
            Items = items,
            Total = total,
            Pagina = consulta.PaginaNormalizada,
            TamanoPagina = consulta.TamanoNormalizado
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> Obtener(int id)
    {
        var cliente = await _contexto.Clientes.AsNoTracking()
            .Where(cliente => cliente.Id == id)
            .Select(cliente => new ClienteDto
            {
                Id = cliente.Id,
                Codigo = cliente.Codigo,
                Nombre = cliente.Nombre,
                Documento = cliente.Documento,
                Telefono = cliente.Telefono,
                Correo = cliente.Correo,
                Direccion = cliente.Direccion,
                Activo = cliente.Activo,
                FechaCreacion = cliente.FechaCreacion
            })
            .FirstOrDefaultAsync();

        return cliente is null ? NotFound() : Ok(cliente);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Ventas")]
    public async Task<ActionResult<ClienteDto>> Crear(ClienteGuardarSolicitud solicitud)
    {
        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Clientes.AnyAsync(cliente => cliente.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un cliente con ese código.");
        }

        var cliente = new Cliente
        {
            Codigo = codigo,
            Nombre = solicitud.Nombre.Trim(),
            Documento = solicitud.Documento?.Trim(),
            Telefono = solicitud.Telefono?.Trim(),
            Correo = solicitud.Correo?.Trim().ToLowerInvariant(),
            Direccion = solicitud.Direccion?.Trim(),
            Activo = solicitud.Activo,
            FechaCreacion = DateTime.Now
        };

        _contexto.Clientes.Add(cliente);
        _bitacora.Registrar("Creación de cliente", "Clientes", null, cliente.Nombre);
        await _contexto.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, Mapear(cliente));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Ventas")]
    public async Task<ActionResult<ClienteDto>> Actualizar(int id, ClienteGuardarSolicitud solicitud)
    {
        var cliente = await _contexto.Clientes.FirstOrDefaultAsync(cliente => cliente.Id == id)
            ?? throw new ExcepcionNegocio("Cliente no encontrado.");

        var codigo = solicitud.Codigo.Trim();

        if (await _contexto.Clientes.AnyAsync(otro => otro.Id != id && otro.Codigo == codigo))
        {
            throw new ExcepcionNegocio("Ya existe un cliente con ese código.");
        }

        cliente.Codigo = codigo;
        cliente.Nombre = solicitud.Nombre.Trim();
        cliente.Documento = solicitud.Documento?.Trim();
        cliente.Telefono = solicitud.Telefono?.Trim();
        cliente.Correo = solicitud.Correo?.Trim().ToLowerInvariant();
        cliente.Direccion = solicitud.Direccion?.Trim();
        cliente.Activo = solicitud.Activo;

        _bitacora.Registrar("Actualización de cliente", "Clientes", cliente.Id, cliente.Nombre);
        await _contexto.SaveChangesAsync();

        return Ok(Mapear(cliente));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var cliente = await _contexto.Clientes.FirstOrDefaultAsync(cliente => cliente.Id == id)
            ?? throw new ExcepcionNegocio("Cliente no encontrado.");

        if (await _contexto.Ventas.AnyAsync(venta => venta.ClienteId == id))
        {
            throw new ExcepcionNegocio("No se puede eliminar el cliente porque tiene ventas registradas.");
        }

        _contexto.Clientes.Remove(cliente);
        _bitacora.Registrar("Eliminación de cliente", "Clientes", id, cliente.Nombre);
        await _contexto.SaveChangesAsync();

        return NoContent();
    }

    private static ClienteDto Mapear(Cliente cliente) => new()
    {
        Id = cliente.Id,
        Codigo = cliente.Codigo,
        Nombre = cliente.Nombre,
        Documento = cliente.Documento,
        Telefono = cliente.Telefono,
        Correo = cliente.Correo,
        Direccion = cliente.Direccion,
        Activo = cliente.Activo,
        FechaCreacion = cliente.FechaCreacion
    };
}

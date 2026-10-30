using System.Globalization;
using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/parametros")]
[Authorize]
public class ParametrosController : ControllerBase
{
    private readonly ContextoInventarios _contexto;
    private readonly ServicioBitacora _bitacora;
    private readonly IMemoryCache _cache;

    public ParametrosController(ContextoInventarios contexto, ServicioBitacora bitacora, IMemoryCache cache)
    {
        _contexto = contexto;
        _bitacora = bitacora;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<List<ParametroDto>>> Listar()
    {
        return Ok(await _contexto.ParametrosSistema
            .AsNoTracking()
            .OrderBy(parametro => parametro.Grupo)
            .ThenBy(parametro => parametro.Clave)
            .Select(parametro => new ParametroDto
            {
                Id = parametro.Id,
                Clave = parametro.Clave,
                Valor = parametro.Valor,
                Descripcion = parametro.Descripcion,
                Grupo = parametro.Grupo
            })
            .ToListAsync());
    }

    [HttpPut]
    [Authorize(Roles = "Superadmin,Administrador")]
    public async Task<ActionResult<List<ParametroDto>>> Actualizar(ParametrosActualizarSolicitud solicitud)
    {
        foreach (var item in solicitud.Parametros)
        {
            var parametro = await _contexto.ParametrosSistema
                .FirstOrDefaultAsync(parametro => parametro.Clave == item.Clave)
                ?? throw new ExcepcionNegocio($"El parámetro '{item.Clave}' no existe.");

            var valor = item.Valor.Trim();

            if (ServicioProteccionAcceso.Parametros.TryGetValue(parametro.Clave, out var regla) &&
                (!int.TryParse(valor, out var umbral) || umbral < regla.Minimo || umbral > regla.Maximo))
                throw new ExcepcionNegocio($"{parametro.Clave} debe estar entre {regla.Minimo} y {regla.Maximo}.");

            if (parametro.Clave == "Impuesto.Porcentaje")
            {
                if (!decimal.TryParse(valor, NumberStyles.Number, CultureInfo.InvariantCulture, out var porcentaje) ||
                    porcentaje is < 0 or > 100)
                {
                    throw new ExcepcionNegocio("El porcentaje de impuesto debe ser un número entre 0 y 100.");
                }
            }

            if (parametro.Clave == "Inventario.PermitirStockNegativo" && !bool.TryParse(valor, out _))
            {
                throw new ExcepcionNegocio("El parámetro de stock negativo debe ser true o false.");
            }

            if (parametro.Clave == "Sesion.MinutosExpiracion")
            {
                if (!int.TryParse(valor, out var minutos) || minutos is < 5 or > 480)
                {
                    throw new ExcepcionNegocio("La duración de la sesión debe estar entre 5 y 480 minutos.");
                }
            }

            if (parametro.Clave == "Inventario.ExistenciaMinimaDefecto")
            {
                if (!decimal.TryParse(valor, NumberStyles.Number, CultureInfo.InvariantCulture, out var minima) ||
                    minima < 0)
                {
                    throw new ExcepcionNegocio("La existencia mínima por defecto no puede ser negativa.");
                }
            }

            if (parametro.Clave.StartsWith("Documento.Prefijo", StringComparison.Ordinal) &&
                string.IsNullOrWhiteSpace(valor))
            {
                throw new ExcepcionNegocio("Los prefijos de documentos no pueden estar vacíos.");
            }

            parametro.Valor = valor;
        }

        _bitacora.Registrar("Actualización de parámetros", "Parámetros", null, "Configuración general");
        await _contexto.SaveChangesAsync();
        _cache.Remove("proteccion-parametros");

        return await Listar();
    }
}

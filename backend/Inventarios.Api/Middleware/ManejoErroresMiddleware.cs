using System.Text.Json;
using Inventarios.Api.Servicios;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Middleware;

public class ManejoErroresMiddleware
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ManejoErroresMiddleware> _logger;

    public ManejoErroresMiddleware(RequestDelegate siguiente, ILogger<ManejoErroresMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (AccesoLimitadoException excepcion)
        {
            await EscribirRespuestaAsync(contexto, 429, "Acceso temporalmente limitado", excepcion.Message, excepcion.Segundos);
        }
        catch (AccesoDenegadoException excepcion)
        {
            await EscribirRespuestaAsync(contexto, 403, "Acceso denegado", excepcion.Message);
        }
        catch (ExcepcionNegocio excepcion)
        {
            await EscribirRespuestaAsync(contexto, StatusCodes.Status400BadRequest, "Regla de negocio", excepcion.Message);
        }
        catch (DbUpdateConcurrencyException excepcion)
        {
            _logger.LogWarning(excepcion, "Conflicto de concurrencia al guardar datos.");
            await EscribirRespuestaAsync(
                contexto,
                StatusCodes.Status409Conflict,
                "Conflicto",
                "Otro usuario modificó la información al mismo tiempo. Recargue la pantalla e intente de nuevo.");
        }
        catch (DbUpdateException excepcion)
        {
            _logger.LogWarning(excepcion, "Error al guardar en la base de datos.");
            await EscribirRespuestaAsync(
                contexto,
                StatusCodes.Status409Conflict,
                "No se pudo guardar",
                "No se pudo guardar la información. Verifique que los datos no estén duplicados o relacionados.");
        }
        catch (Exception excepcion)
        {
            _logger.LogError(excepcion, "Error no controlado en la API.");
            await EscribirRespuestaAsync(
                contexto,
                StatusCodes.Status500InternalServerError,
                "Error interno",
                "Ocurrió un error inesperado. Intente nuevamente o contacte al administrador.");
        }
    }

    private static async Task EscribirRespuestaAsync(
        HttpContext contexto,
        int estado,
        string titulo,
        string detalle, int? reintentoSegundos = null)
    {
        if (contexto.Response.HasStarted)
        {
            return;
        }

        contexto.Response.Clear();
        contexto.Response.StatusCode = estado;
        contexto.Response.ContentType = "application/problem+json";
        if (reintentoSegundos.HasValue) contexto.Response.Headers.RetryAfter = reintentoSegundos.Value.ToString();

        var problema = new
        {
            type = $"https://httpstatuses.com/{estado}",
            title = titulo,
            status = estado,
            detail = detalle
        };

        await contexto.Response.WriteAsync(JsonSerializer.Serialize(problema));
    }
}

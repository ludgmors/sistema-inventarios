using Inventarios.Api.DTOs;
using Inventarios.Api.Extensiones;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/importacion")]
[Authorize]
public class ImportacionController : ControllerBase
{
    private readonly ServicioImportacion _importacion;

    public ImportacionController(ServicioImportacion importacion)
    {
        _importacion = importacion;
    }

    [HttpGet("plantilla/{tipo}")]
    public IActionResult Plantilla(string tipo)
    {
        var normalizado = NormalizarTipo(tipo);
        if (normalizado is null) return BadRequest(new { detail = "El tipo de importación no es válido." });
        if (!PuedeImportar(normalizado)) return Forbid();

        var archivo = _importacion.Plantilla(normalizado);
        return File(
            archivo,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"plantilla-{normalizado}.xlsx");
    }

    [HttpPost("previsualizar/{tipo}")]
    [RequestSizeLimit(ServicioImportacion.MaximoBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ServicioImportacion.MaximoBytes)]
    public async Task<ActionResult<ImportacionPrevisualizacionDto>> Previsualizar(
        string tipo,
        IFormFile archivo,
        [FromQuery] bool actualizarExistentes = false)
    {
        var normalizado = NormalizarTipo(tipo);
        if (normalizado is null) return BadRequest(new { detail = "El tipo de importación no es válido." });
        if (!PuedeImportar(normalizado)) return Forbid();

        ValidarArchivo(archivo);
        await using var contenido = archivo.OpenReadStream();
        return Ok(await _importacion.PrevisualizarAsync(
            normalizado, contenido, archivo.FileName, actualizarExistentes));
    }

    [HttpPost("confirmar/{tipo}")]
    [RequestSizeLimit(ServicioImportacion.MaximoBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ServicioImportacion.MaximoBytes)]
    public async Task<ActionResult<ImportacionResultadoDto>> Confirmar(
        string tipo,
        IFormFile archivo,
        [FromQuery] bool actualizarExistentes = false)
    {
        var normalizado = NormalizarTipo(tipo);
        if (normalizado is null) return BadRequest(new { detail = "El tipo de importación no es válido." });
        if (!PuedeImportar(normalizado)) return Forbid();

        ValidarArchivo(archivo);
        await using var contenido = archivo.OpenReadStream();
        return Ok(await _importacion.ConfirmarAsync(
            normalizado, contenido, archivo.FileName, actualizarExistentes, User.ObtenerUsuarioId()));
    }

    private static string? NormalizarTipo(string tipo)
    {
        try
        {
            return TiposImportacion.Normalizar(tipo);
        }
        catch (ExcepcionNegocio)
        {
            return null;
        }
    }

    private bool PuedeImportar(string tipo) => tipo switch
    {
        TiposImportacion.Productos or TiposImportacion.Proveedores =>
            User.IsInRole("Administrador") || User.IsInRole("Inventario"),
        TiposImportacion.Clientes =>
            User.IsInRole("Administrador") || User.IsInRole("Ventas"),
        _ => false
    };

    private static void ValidarArchivo(IFormFile? archivo)
    {
        if (archivo is null || archivo.Length == 0)
        {
            throw new ExcepcionNegocio("Seleccione un archivo de Excel o CSV.");
        }

        if (archivo.Length > ServicioImportacion.MaximoBytes)
        {
            throw new ExcepcionNegocio("El archivo supera el máximo de 5 MB.");
        }

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (extension is not (".xlsx" or ".xlsm" or ".csv"))
        {
            throw new ExcepcionNegocio("El archivo debe ser .xlsx o .csv.");
        }
    }
}

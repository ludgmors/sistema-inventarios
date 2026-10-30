namespace Inventarios.Api.DTOs;

using Inventarios.Api.Servicios;

public static class TiposImportacion
{
    public const string Productos = "productos";
    public const string Clientes = "clientes";
    public const string Proveedores = "proveedores";

    public static string Normalizar(string? tipo) => (tipo ?? "").Trim().ToLowerInvariant() switch
    {
        Productos => Productos,
        Clientes => Clientes,
        Proveedores => Proveedores,
        _ => throw new ExcepcionNegocio("El tipo de importación no es válido.")
    };
}

public class ImportacionFilaDto
{
    public int Fila { get; set; }
    public string Estado { get; set; } = "valida";
    public List<string> Mensajes { get; set; } = new();
    public Dictionary<string, string> Datos { get; set; } = new();
}

public class ImportacionPrevisualizacionDto
{
    public string Tipo { get; set; } = string.Empty;
    public int TotalFilas { get; set; }
    public int Validas { get; set; }
    public int Advertencias { get; set; }
    public int Omitidas { get; set; }
    public int Errores { get; set; }
    public List<string> Columnas { get; set; } = new();
    public List<ImportacionFilaDto> Filas { get; set; } = new();
}

public class ImportacionResultadoDto
{
    public string Tipo { get; set; } = string.Empty;
    public int Creados { get; set; }
    public int Actualizados { get; set; }
    public int Omitidos { get; set; }
    public int Errores { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

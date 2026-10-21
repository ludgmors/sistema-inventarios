using System.Globalization;
using Inventarios.Api.Datos;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioParametros
{
    private readonly ContextoInventarios _contexto;

    public ServicioParametros(ContextoInventarios contexto)
    {
        _contexto = contexto;
    }

    public async Task<string?> ObtenerAsync(string clave)
    {
        return await _contexto.ParametrosSistema
            .AsNoTracking()
            .Where(parametro => parametro.Clave == clave)
            .Select(parametro => parametro.Valor)
            .FirstOrDefaultAsync();
    }

    public async Task<string> ObtenerTextoAsync(string clave, string defecto)
    {
        var valor = await ObtenerAsync(clave);
        return string.IsNullOrWhiteSpace(valor) ? defecto : valor;
    }

    public async Task<decimal> ObtenerDecimalAsync(string clave, decimal defecto)
    {
        var valor = await ObtenerAsync(clave);
        return decimal.TryParse(valor, NumberStyles.Number, CultureInfo.InvariantCulture, out var resultado)
            ? resultado
            : defecto;
    }

    public async Task<bool> ObtenerBooleanoAsync(string clave, bool defecto)
    {
        var valor = await ObtenerAsync(clave);
        return bool.TryParse(valor, out var resultado) ? resultado : defecto;
    }

    public Task<decimal> ImpuestoPorcentajeAsync()
        => ObtenerDecimalAsync("Impuesto.Porcentaje", 12m);

    public Task<bool> PermiteStockNegativoAsync()
        => ObtenerBooleanoAsync("Inventario.PermitirStockNegativo", false);

    public Task<decimal> ExistenciaMinimaDefectoAsync()
        => ObtenerDecimalAsync("Inventario.ExistenciaMinimaDefecto", 5m);

    public async Task<string> ObtenerPrefijoAsync(string clave, string defecto)
        => await ObtenerTextoAsync(clave, defecto);
}

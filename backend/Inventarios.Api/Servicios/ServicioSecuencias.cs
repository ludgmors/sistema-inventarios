using Inventarios.Api.Datos;
using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Servicios;

public class ServicioSecuencias
{
    private readonly ContextoInventarios _contexto;

    public ServicioSecuencias(ContextoInventarios contexto)
    {
        _contexto = contexto;
    }

    /// <summary>
    /// Genera el siguiente número correlativo dentro de la transacción actual.
    /// Usa un bloqueo de actualización para evitar duplicados por concurrencia.
    /// </summary>
    public async Task<string> GenerarNumeroAsync(string tipo, string prefijo)
    {
        var secuencia = await _contexto.SecuenciasDocumento
            .FromSqlRaw(
                "SELECT * FROM SecuenciasDocumento WITH (UPDLOCK, ROWLOCK) WHERE Tipo = {0}",
                tipo)
            .FirstOrDefaultAsync();

        if (secuencia is null)
        {
            secuencia = new SecuenciaDocumento
            {
                Tipo = tipo,
                Prefijo = prefijo,
                UltimoNumero = 0
            };
            _contexto.SecuenciasDocumento.Add(secuencia);
        }

        secuencia.Prefijo = prefijo;
        secuencia.UltimoNumero++;

        return $"{prefijo}-{secuencia.UltimoNumero:D6}";
    }
}

using System.Data;
using System.Security.Cryptography;
using System.Text;
using Inventarios.Api.Datos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Caching.Memory;

namespace Inventarios.Api.Servicios;

public class ServicioProteccionAcceso(ContextoInventarios db, IMemoryCache cache)
{
    public static readonly Dictionary<string, (int Defecto, int Minimo, int Maximo, string Descripcion)> Parametros = new()
    {
        ["Seguridad.IntentosLogin"] = (6, 3, 20, "Intentos por cuenta en 15 minutos antes del bloqueo"),
        ["Seguridad.LoginPorIp"] = (30, 10, 100, "Intentos de acceso por IP en 15 minutos"),
        ["Seguridad.MinutosBloqueo"] = (15, 1, 60, "Minutos de bloqueo por actividad excesiva"),
        ["Seguridad.SolicitudesPorMinuto"] = (300, 60, 1000, "Solicitudes API por IP y minuto"),
        ["Seguridad.OperacionesPorMinuto"] = (30, 5, 120, "Operaciones de escritura por usuario y minuto"),
        ["Seguridad.CreacionUsuarios"] = (5, 2, 20, "Solicitudes de creación de usuarios en 10 minutos"),
        ["Seguridad.RecuperacionesPorHora"] = (3, 1, 10, "Solicitudes de recuperación por correo y hora"),
        ["Seguridad.MinutosInactividad"] = (30, 5, 120, "Cierre de sesión tras inactividad"),
        ["Seguridad.MinutosSesion"] = (120, 15, 480, "Duración máxima de las sesiones nuevas")
    };

    public async Task<int> ParametroAsync(string clave)
    {
        var valores = await cache.GetOrCreateAsync("proteccion-parametros", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(10);
            return await db.ParametrosSistema.AsNoTracking().Where(x => x.Grupo == "Seguridad")
                .ToDictionaryAsync(x => x.Clave, x => x.Valor);
        });
        var regla = Parametros[clave];
        return valores!.TryGetValue(clave, out var texto) && int.TryParse(texto, out var valor)
            ? Math.Clamp(valor, regla.Minimo, regla.Maximo) : regla.Defecto;
    }

    public static string Hash(string texto) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(texto)));

    // Un único MERGE serializa cada contador en SQL Server, incluso entre procesos.
    public async Task<DateTime?> ConsumirAsync(string identidad, int limite, int ventanaSegundos, int bloqueoSegundos, bool hastaFinVentana = false)
    {
        var conexion = db.Database.GetDbConnection();
        var abrir = conexion.State != ConnectionState.Open;
        if (abrir) await conexion.OpenAsync();
        try
        {
            using var comando = conexion.CreateCommand();
            comando.Transaction = db.Database.CurrentTransaction?.GetDbTransaction();
            comando.CommandText = """
                MERGE LimitesAcceso WITH (HOLDLOCK) AS t
                USING (SELECT @clave AS Clave) AS s ON t.Clave = s.Clave
                WHEN MATCHED THEN UPDATE SET
                    Cantidad = CASE WHEN t.BloqueadoHastaUtc > @ahora THEN t.Cantidad
                        WHEN DATEADD(second,@ventana,t.InicioUtc) <= @ahora OR t.BloqueadoHastaUtc IS NOT NULL THEN 1
                        ELSE t.Cantidad + 1 END,
                    InicioUtc = CASE WHEN t.BloqueadoHastaUtc > @ahora THEN t.InicioUtc
                        WHEN DATEADD(second,@ventana,t.InicioUtc) <= @ahora OR t.BloqueadoHastaUtc IS NOT NULL THEN @ahora
                        ELSE t.InicioUtc END,
                    BloqueadoHastaUtc = CASE WHEN t.BloqueadoHastaUtc > @ahora THEN t.BloqueadoHastaUtc
                        WHEN DATEADD(second,@ventana,t.InicioUtc) <= @ahora OR t.BloqueadoHastaUtc IS NOT NULL THEN NULL
                        WHEN t.Cantidad + 1 > @limite THEN CASE WHEN @finVentana=1 THEN DATEADD(second,@ventana,t.InicioUtc)
                            ELSE DATEADD(second,@bloqueo,@ahora) END ELSE NULL END
                WHEN NOT MATCHED THEN INSERT (Clave,InicioUtc,Cantidad,BloqueadoHastaUtc) VALUES (@clave,@ahora,1,NULL)
                OUTPUT inserted.BloqueadoHastaUtc;
                """;
            foreach (var (nombre, valor) in new (string, object)[] {
                ("@clave", Hash(identidad)), ("@ahora", DateTime.UtcNow),
                ("@ventana", ventanaSegundos), ("@limite", limite), ("@bloqueo", bloqueoSegundos), ("@finVentana", hastaFinVentana ? 1 : 0) })
            {
                var p = comando.CreateParameter(); p.ParameterName = nombre; p.Value = valor;
                comando.Parameters.Add(p);
            }
            var resultado = await comando.ExecuteScalarAsync();
            return resultado is DateTime fecha ? DateTime.SpecifyKind(fecha, DateTimeKind.Utc) : null;
        }
        finally { if (abrir) await conexion.CloseAsync(); }
    }

    public Task LimpiarAsync(string identidad) => db.LimitesAcceso
        .Where(x => x.Clave == Hash(identidad)).ExecuteDeleteAsync();

    public async Task BloquearUsuarioAsync(int usuarioId, DateTime hasta)
    {
        await db.Usuarios.Where(x => x.Id == usuarioId &&
            (x.BloqueadoHastaUtc == null || x.BloqueadoHastaUtc < hasta))
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.BloqueadoHastaUtc, hasta));
        await RevocarAsync(usuarioId);
    }

    public Task RevocarAsync(int usuarioId) => db.SesionesAcceso
        .Where(x => x.UsuarioId == usuarioId && x.RevocadaUtc == null)
        .ExecuteUpdateAsync(s => s.SetProperty(x => x.RevocadaUtc, DateTime.UtcNow));
}

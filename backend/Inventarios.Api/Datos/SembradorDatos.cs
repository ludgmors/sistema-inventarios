using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Datos;

public class SembradorDatos
{
    private const decimal TasaCambioUsdAQuetzales = 7.80m;

    private readonly ContextoInventarios _contexto;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly Servicios.ServicioCompras _compras;
    private readonly Servicios.ServicioVentas _ventas;
    private readonly ILogger<SembradorDatos> _logger;
    private readonly IWebHostEnvironment _entorno;
    private readonly IConfiguration _configuracion;

    public SembradorDatos(
        ContextoInventarios contexto,
        IPasswordHasher<Usuario> hasher,
        Servicios.ServicioCompras compras,
        Servicios.ServicioVentas ventas,
        ILogger<SembradorDatos> logger, IWebHostEnvironment entorno, IConfiguration configuracion)
    {
        _contexto = contexto;
        _hasher = hasher;
        _compras = compras;
        _ventas = ventas;
        _logger = logger;
        _entorno = entorno;
        _configuracion = configuracion;
    }

    public async Task InicializarAsync()
    {
        await _contexto.Database.MigrateAsync();

        await SembrarSeguridadAsync();
        await SembrarParametrosAsync();
        await SembrarParametrosSeguridadAsync();
        await ConvertirMonedaAQuetzalesAsync();
        await SembrarSecuenciasAsync();
        if (_entorno.IsDevelopment())
        {
            await SembrarCatalogosAsync();
            await SembrarOperacionesDemoAsync();
        }

        _logger.LogInformation("Base de datos verificada y datos iniciales listos.");
    }

    private async Task SembrarSeguridadAsync()
    {
        var rolesIniciales = new[]
        {
                new Rol { Nombre = "Superadmin", Descripcion = "Acceso completo y control de cuentas superadmin" },
                new Rol { Nombre = "Administrador", Descripcion = "Acceso completo al sistema" },
                new Rol { Nombre = "Inventario", Descripcion = "Productos, compras, proveedores y ajustes" },
                new Rol { Nombre = "Ventas", Descripcion = "Ventas, clientes y notas" },
                new Rol { Nombre = "Consulta", Descripcion = "Solo consulta de información" }
        };
        foreach (var rolInicial in rolesIniciales)
            if (!await _contexto.Roles.AnyAsync(x => x.Nombre == rolInicial.Nombre))
                _contexto.Roles.Add(rolInicial);
        await _contexto.SaveChangesAsync();

        if (await _contexto.Usuarios.AnyAsync())
        {
            return;
        }

        var roles = await _contexto.Roles.ToDictionaryAsync(rol => rol.Nombre);

        if (!_entorno.IsDevelopment())
        {
            var correo = _configuracion["Bootstrap:Correo"] ?? "";
            var clave = _configuracion["Bootstrap:Contrasena"] ?? "";
            if (!new DTOs.CorreoFormalAttribute().IsValid(correo) || clave.Length is < 12 or > 100)
                throw new InvalidOperationException("Configure Bootstrap:Correo y Bootstrap:Contrasena (12-100 caracteres) para crear el primer administrador. No se crean cuentas demo en producción.");
            _contexto.Usuarios.Add(CrearUsuario("Superadministrador", "admin", correo.Trim().ToLowerInvariant(), clave, roles["Superadmin"].Id));
            await _contexto.SaveChangesAsync();
            return;
        }

        var usuarios = new List<Usuario>
        {
            CrearUsuario("Administrador del Sistema", "admin", "admin@inventarios.gt", "Admin123!", roles["Administrador"].Id),
            CrearUsuario("María González", "vendedor", "vendedor@inventarios.gt", "Ventas123!", roles["Ventas"].Id),
            CrearUsuario("Carlos Rodríguez", "bodega", "bodega@inventarios.gt", "Inventario123!", roles["Inventario"].Id),
            CrearUsuario("Ana Martínez", "consulta", "consulta@inventarios.gt", "Consulta123!", roles["Consulta"].Id)
        };

        _contexto.Usuarios.AddRange(usuarios);
        await _contexto.SaveChangesAsync();
    }

    private async Task SembrarParametrosSeguridadAsync()
    {
        foreach (var (clave, regla) in Servicios.ServicioProteccionAcceso.Parametros)
        {
            if (!await _contexto.ParametrosSistema.AnyAsync(x => x.Clave == clave))
                _contexto.ParametrosSistema.Add(new ParametroSistema {
                    Clave = clave, Valor = regla.Defecto.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    Grupo = "Seguridad", Descripcion = regla.Descripcion
                });
        }
        await _contexto.SaveChangesAsync();
        // Limpiar solamente historial de seguridad vencido, sin tocar operaciones de inventario.
        var limite = DateTime.UtcNow.AddDays(-7);
        await _contexto.LimitesAcceso.Where(x => x.InicioUtc < limite && (x.BloqueadoHastaUtc == null || x.BloqueadoHastaUtc < limite)).ExecuteDeleteAsync();
        await _contexto.SesionesAcceso.Where(x => x.ExpiraUtc < limite).ExecuteDeleteAsync();
        await _contexto.RecuperacionesAcceso.Where(x => x.ExpiraUtc < limite).ExecuteDeleteAsync();
        await _contexto.DesafiosAcceso.Where(x => x.ExpiraUtc < limite).ExecuteDeleteAsync();
    }

    private Usuario CrearUsuario(string nombreCompleto, string nombreUsuario, string correo, string contrasena, int rolId)
    {
        var usuario = new Usuario
        {
            NombreCompleto = nombreCompleto,
            NombreUsuario = nombreUsuario,
            Correo = correo,
            RolId = rolId,
            Activo = true,
            FechaCreacion = DateTime.Now
        };

        usuario.HashContrasena = _hasher.HashPassword(usuario, contrasena);
        return usuario;
    }

    private async Task SembrarParametrosAsync()
    {
        var parametros = new List<ParametroSistema>
        {
            new() { Clave = "Empresa.Nombre", Valor = "Distribuidora El Buen Precio", Descripcion = "Nombre comercial de la empresa", Grupo = "Empresa" },
            new() { Clave = "Empresa.Documento", Valor = "8765432-1", Descripcion = "NIT o documento fiscal", Grupo = "Empresa" },
            new() { Clave = "Empresa.Direccion", Valor = "Zona 1, Ciudad de Guatemala, Guatemala", Descripcion = "Dirección principal", Grupo = "Empresa" },
            new() { Clave = "Empresa.Telefono", Valor = "+502 6000-0000", Descripcion = "Teléfono de contacto", Grupo = "Empresa" },
            new() { Clave = "Empresa.Correo", Valor = "info@buenprecio.com", Descripcion = "Correo de contacto", Grupo = "Empresa" },
            new() { Clave = "Impuesto.Porcentaje", Valor = "12", Descripcion = "Porcentaje de impuesto aplicado a las transacciones", Grupo = "Impuestos" },
            new() { Clave = "Moneda.Simbolo", Valor = "Q", Descripcion = "Símbolo de la moneda", Grupo = "Moneda" },
            new() { Clave = "Moneda.Codigo", Valor = "GTQ", Descripcion = "Código ISO de la moneda", Grupo = "Moneda" },
            new() { Clave = "Inventario.PermitirStockNegativo", Valor = "false", Descripcion = "Permite vender sin existencia disponible", Grupo = "Inventario" },
            new() { Clave = "Inventario.ExistenciaMinimaDefecto", Valor = "5", Descripcion = "Existencia mínima sugerida por producto", Grupo = "Inventario" },
            new() { Clave = "Documento.PrefijoCompra", Valor = "COMP", Descripcion = "Prefijo de compras", Grupo = "Documentos" },
            new() { Clave = "Documento.PrefijoVenta", Valor = "VENT", Descripcion = "Prefijo de ventas", Grupo = "Documentos" },
            new() { Clave = "Documento.PrefijoNotaCredito", Valor = "NC", Descripcion = "Prefijo de notas de crédito", Grupo = "Documentos" },
            new() { Clave = "Documento.PrefijoNotaDebito", Valor = "ND", Descripcion = "Prefijo de notas de débito", Grupo = "Documentos" },
            new() { Clave = "Documento.PrefijoAjuste", Valor = "AJU", Descripcion = "Prefijo de ajustes de inventario", Grupo = "Documentos" },
            new() { Clave = "Sesion.MinutosExpiracion", Valor = "480", Descripcion = "Duración de la sesión en minutos", Grupo = "Seguridad" }
        };

        var existentes = await _contexto.ParametrosSistema.Select(parametro => parametro.Clave).ToListAsync();

        foreach (var parametro in parametros.Where(parametro => !existentes.Contains(parametro.Clave)))
        {
            _contexto.ParametrosSistema.Add(parametro);
        }

        await _contexto.SaveChangesAsync();
    }

    private async Task ConvertirMonedaAQuetzalesAsync()
    {
        var parametros = await _contexto.ParametrosSistema.ToDictionaryAsync(parametro => parametro.Clave);

        if (!parametros.TryGetValue("Moneda.Codigo", out var codigo) ||
            !string.Equals(codigo.Valor, "USD", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await using var transaccion = await _contexto.Database.BeginTransactionAsync();

        foreach (var producto in await _contexto.Productos.ToListAsync())
        {
            producto.PrecioCosto = ConvertirImporte(producto.PrecioCosto);
            producto.PrecioVenta = ConvertirImporte(producto.PrecioVenta);
        }

        foreach (var movimiento in await _contexto.MovimientosInventario.ToListAsync())
        {
            movimiento.CostoUnitario = ConvertirImporte(movimiento.CostoUnitario);
        }

        foreach (var compra in await _contexto.Compras.Include(compra => compra.Detalles).ToListAsync())
        {
            foreach (var detalle in compra.Detalles)
            {
                detalle.PrecioUnitario = ConvertirImporte(detalle.PrecioUnitario);
                detalle.Subtotal = Math.Round(
                    detalle.Cantidad * detalle.PrecioUnitario, 2, MidpointRounding.AwayFromZero);
            }

            compra.Subtotal = compra.Detalles.Sum(detalle => detalle.Subtotal);
            compra.ImpuestoPorcentaje = 12m;
            compra.Impuesto = Math.Round(
                compra.Subtotal * compra.ImpuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);
            compra.Total = compra.Subtotal + compra.Impuesto;
        }

        foreach (var venta in await _contexto.Ventas.Include(venta => venta.Detalles).ToListAsync())
        {
            foreach (var detalle in venta.Detalles)
            {
                detalle.PrecioUnitario = ConvertirImporte(detalle.PrecioUnitario);
                detalle.Descuento = ConvertirImporte(detalle.Descuento);
                detalle.Subtotal = Math.Round(
                    Math.Round(detalle.Cantidad * detalle.PrecioUnitario, 2, MidpointRounding.AwayFromZero) - detalle.Descuento,
                    2,
                    MidpointRounding.AwayFromZero);
            }

            venta.Subtotal = venta.Detalles.Sum(detalle => detalle.Subtotal);
            venta.Descuento = ConvertirImporte(venta.Descuento);
            venta.ImpuestoPorcentaje = 12m;

            var baseImponible = venta.Subtotal - venta.Descuento;
            venta.Impuesto = Math.Round(
                baseImponible * venta.ImpuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);
            venta.Total = baseImponible + venta.Impuesto;
        }

        foreach (var nota in await _contexto.NotasAjuste.Include(nota => nota.Detalles).ToListAsync())
        {
            foreach (var detalle in nota.Detalles)
            {
                detalle.PrecioUnitario = ConvertirImporte(detalle.PrecioUnitario);
                detalle.Subtotal = Math.Round(
                    detalle.Cantidad * detalle.PrecioUnitario, 2, MidpointRounding.AwayFromZero);
            }

            nota.Subtotal = nota.Detalles.Sum(detalle => detalle.Subtotal);
            nota.ImpuestoPorcentaje = 12m;
            nota.Impuesto = Math.Round(
                nota.Subtotal * nota.ImpuestoPorcentaje / 100m, 2, MidpointRounding.AwayFromZero);
            nota.Total = nota.Subtotal + nota.Impuesto;
        }

        ActualizarParametro(parametros, "Moneda.Simbolo", "Q");
        ActualizarParametro(parametros, "Moneda.Codigo", "GTQ");
        ActualizarParametro(parametros, "Impuesto.Porcentaje", "12");
        ActualizarParametroSiCoincide(parametros, "Empresa.Documento", "8-888-8888", "8765432-1");
        ActualizarParametroSiCoincide(parametros, "Empresa.Direccion", "Ciudad de Panamá, Panamá", "Zona 1, Ciudad de Guatemala, Guatemala");
        ActualizarParametroSiCoincide(parametros, "Empresa.Telefono", "+507 6000-0000", "+502 6000-0000");

        await ActualizarDatosDemoGuatemalaAsync();

        await _contexto.SaveChangesAsync();
        await transaccion.CommitAsync();

        _logger.LogInformation(
            "Datos convertidos de USD a GTQ con tipo de cambio {Tasa}.", TasaCambioUsdAQuetzales);
    }

    private async Task ActualizarDatosDemoGuatemalaAsync()
    {
        foreach (var proveedor in await _contexto.Proveedores.ToListAsync())
        {
            switch (proveedor.Codigo)
            {
                case "PRV-001":
                    proveedor.Documento = ActualizarSiCoincide(proveedor.Documento, "8-123-4567", "1234567-8");
                    proveedor.Telefono = ActualizarSiCoincide(proveedor.Telefono, "+507 6111-1111", "+502 6111-1111");
                    proveedor.Direccion = ActualizarSiCoincide(proveedor.Direccion, "Vía España, Ciudad de Panamá", "Zona 4, Ciudad de Guatemala");
                    break;
                case "PRV-002":
                    proveedor.Documento = ActualizarSiCoincide(proveedor.Documento, "8-234-5678", "2345678-9");
                    proveedor.Telefono = ActualizarSiCoincide(proveedor.Telefono, "+507 6222-2222", "+502 6222-2222");
                    proveedor.Direccion = ActualizarSiCoincide(proveedor.Direccion, "Zona Industrial, Panamá", "Zona 12, Ciudad de Guatemala");
                    break;
                case "PRV-003":
                    proveedor.Documento = ActualizarSiCoincide(proveedor.Documento, "8-345-6789", "3456789-0");
                    proveedor.Telefono = ActualizarSiCoincide(proveedor.Telefono, "+507 6333-3333", "+502 6333-3333");
                    proveedor.Direccion = ActualizarSiCoincide(proveedor.Direccion, "Avenida Balboa, Panamá", "Mixco, Guatemala");
                    break;
            }
        }

        foreach (var cliente in await _contexto.Clientes.ToListAsync())
        {
            switch (cliente.Codigo)
            {
                case "CLI-001":
                    cliente.Telefono = ActualizarSiCoincide(cliente.Telefono, "+507 6000-0000", "+502 6000-0000");
                    break;
                case "CLI-002":
                    cliente.Documento = ActualizarSiCoincide(cliente.Documento, "8-456-7890", "4567890-1");
                    cliente.Telefono = ActualizarSiCoincide(cliente.Telefono, "+507 6444-4444", "+502 6444-4444");
                    break;
                case "CLI-003":
                    cliente.Documento = ActualizarSiCoincide(cliente.Documento, "8-567-8901", "5678901-2");
                    cliente.Telefono = ActualizarSiCoincide(cliente.Telefono, "+507 6555-5555", "+502 6555-5555");
                    break;
                case "CLI-004":
                    cliente.Documento = ActualizarSiCoincide(cliente.Documento, "8-678-9012", "6789012-3");
                    cliente.Telefono = ActualizarSiCoincide(cliente.Telefono, "+507 6666-6666", "+502 6666-6666");
                    break;
            }
        }
    }

    private static void ActualizarParametro(
        IDictionary<string, ParametroSistema> parametros,
        string clave,
        string valor)
    {
        if (parametros.TryGetValue(clave, out var parametro))
        {
            parametro.Valor = valor;
        }
    }

    private static void ActualizarParametroSiCoincide(
        IDictionary<string, ParametroSistema> parametros,
        string clave,
        string valorAnterior,
        string valorNuevo)
    {
        if (parametros.TryGetValue(clave, out var parametro) &&
            string.Equals(parametro.Valor, valorAnterior, StringComparison.Ordinal))
        {
            parametro.Valor = valorNuevo;
        }
    }

    private static string? ActualizarSiCoincide(string? valorActual, string valorAnterior, string valorNuevo) =>
        string.Equals(valorActual, valorAnterior, StringComparison.Ordinal) ? valorNuevo : valorActual;

    private static decimal ConvertirImporte(decimal importe) =>
        Math.Round(importe * TasaCambioUsdAQuetzales, 2, MidpointRounding.AwayFromZero);

    private async Task SembrarSecuenciasAsync()
    {
        var tipos = new[]
        {
            (Tipo: "Compra", Prefijo: "COMP"),
            (Tipo: "Venta", Prefijo: "VENT"),
            (Tipo: "NotaCredito", Prefijo: "NC"),
            (Tipo: "NotaDebito", Prefijo: "ND"),
            (Tipo: "Ajuste", Prefijo: "AJU")
        };

        var existentes = await _contexto.SecuenciasDocumento.Select(secuencia => secuencia.Tipo).ToListAsync();

        foreach (var tipo in tipos.Where(tipo => !existentes.Contains(tipo.Tipo)))
        {
            _contexto.SecuenciasDocumento.Add(new SecuenciaDocumento
            {
                Tipo = tipo.Tipo,
                Prefijo = tipo.Prefijo,
                UltimoNumero = 0
            });
        }

        await _contexto.SaveChangesAsync();
    }

    private async Task SembrarCatalogosAsync()
    {
        if (!await _contexto.Categorias.AnyAsync())
        {
            _contexto.Categorias.AddRange(
                new Categoria { Nombre = "Bebidas", Descripcion = "Bebidas y jugos" },
                new Categoria { Nombre = "Alimentos", Descripcion = "Productos de consumo básico" },
                new Categoria { Nombre = "Limpieza", Descripcion = "Artículos de limpieza" },
                new Categoria { Nombre = "Papelería", Descripcion = "Útiles de oficina y escuela" });

            await _contexto.SaveChangesAsync();
        }

        if (!await _contexto.Proveedores.AnyAsync())
        {
            _contexto.Proveedores.AddRange(
                new Proveedor { Codigo = "PRV-001", RazonSocial = "Distribuidora La Central", Documento = "1234567-8", Contacto = "Luis Pérez", Telefono = "+502 6111-1111", Correo = "ventas@lacentral.com", Direccion = "Zona 4, Ciudad de Guatemala" },
                new Proveedor { Codigo = "PRV-002", RazonSocial = "Alimentos del Istmo", Documento = "2345678-9", Contacto = "Marta Ruiz", Telefono = "+502 6222-2222", Correo = "pedidos@istmo.com", Direccion = "Zona 12, Ciudad de Guatemala" },
                new Proveedor { Codigo = "PRV-003", RazonSocial = "Suministros del Pacífico", Documento = "3456789-0", Contacto = "Jorge Díaz", Telefono = "+502 6333-3333", Correo = "compras@pacifico.com", Direccion = "Mixco, Guatemala" });

            await _contexto.SaveChangesAsync();
        }

        if (!await _contexto.Clientes.AnyAsync())
        {
            _contexto.Clientes.AddRange(
                new Cliente { Codigo = "CLI-001", Nombre = "Cliente General", Documento = "CF", Telefono = "+502 6000-0000" },
                new Cliente { Codigo = "CLI-002", Nombre = "Supermercado El Ahorro", Documento = "4567890-1", Telefono = "+502 6444-4444", Correo = "compras@elahorro.com" },
                new Cliente { Codigo = "CLI-003", Nombre = "Farmacia San José", Documento = "5678901-2", Telefono = "+502 6555-5555", Correo = "admin@farmaciasanjose.com" },
                new Cliente { Codigo = "CLI-004", Nombre = "Restaurante La Esquina", Documento = "6789012-3", Telefono = "+502 6666-6666", Correo = "gerencia@laesquina.com" });

            await _contexto.SaveChangesAsync();
        }

        if (!await _contexto.Productos.AnyAsync())
        {
            var categorias = await _contexto.Categorias.ToDictionaryAsync(categoria => categoria.Nombre);

            _contexto.Productos.AddRange(
                new Producto { Codigo = "BEB-001", Nombre = "Agua Mineral 600 ml", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 2.73m, PrecioVenta = 5.85m, ExistenciaMinima = 24 },
                new Producto { Codigo = "BEB-002", Nombre = "Refresco de Cola 2 L", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 9.36m, PrecioVenta = 17.55m, ExistenciaMinima = 12 },
                new Producto { Codigo = "BEB-003", Nombre = "Jugo de Naranja 1 L", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 8.58m, PrecioVenta = 15.60m, ExistenciaMinima = 10 },
                new Producto { Codigo = "ALI-001", Nombre = "Arroz Blanco 5 lb", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 21.84m, PrecioVenta = 35.10m, ExistenciaMinima = 15 },
                new Producto { Codigo = "ALI-002", Nombre = "Frijol Rojo 1 lb", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 7.41m, PrecioVenta = 13.65m, ExistenciaMinima = 20 },
                new Producto { Codigo = "ALI-003", Nombre = "Aceite Vegetal 1 L", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 14.04m, PrecioVenta = 25.35m, ExistenciaMinima = 12 },
                new Producto { Codigo = "ALI-004", Nombre = "Café Molido 500 g", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 32.76m, PrecioVenta = 54.21m, ExistenciaMinima = 8 },
                new Producto { Codigo = "LIM-001", Nombre = "Detergente en Polvo 1 kg", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 16.38m, PrecioVenta = 29.25m, ExistenciaMinima = 8 },
                new Producto { Codigo = "LIM-002", Nombre = "Jabón de Baño", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 4.29m, PrecioVenta = 9.75m, ExistenciaMinima = 25 },
                new Producto { Codigo = "LIM-003", Nombre = "Cloro 1 L", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 7.80m, PrecioVenta = 15.21m, ExistenciaMinima = 10 },
                new Producto { Codigo = "PAP-001", Nombre = "Cuaderno 100 hojas", CategoriaId = categorias["Papelería"].Id, PrecioCosto = 6.24m, PrecioVenta = 12.48m, ExistenciaMinima = 30 },
                new Producto { Codigo = "PAP-002", Nombre = "Bolígrafo Azul", CategoriaId = categorias["Papelería"].Id, PrecioCosto = 1.95m, PrecioVenta = 5.85m, ExistenciaMinima = 50 });

            await _contexto.SaveChangesAsync();

            await SembrarExistenciasInicialesAsync();
        }
    }

    private async Task SembrarExistenciasInicialesAsync()
    {
        if (await _contexto.MovimientosInventario.AnyAsync())
        {
            return;
        }

        var admin = await _contexto.Usuarios.FirstAsync(usuario => usuario.NombreUsuario == "admin");
        var productos = await _contexto.Productos.OrderBy(producto => producto.Id).ToListAsync();
        var existencias = new[] { 120m, 80m, 60m, 90m, 100m, 70m, 50m, 45m, 150m, 55m, 200m, 300m };
        var fecha = DateTime.Today.AddDays(-15).AddHours(8);

        for (var i = 0; i < productos.Count; i++)
        {
            var producto = productos[i];
            var cantidad = existencias[i % existencias.Length];

            producto.ExistenciaActual = cantidad;

            _contexto.MovimientosInventario.Add(new MovimientoInventario
            {
                Fecha = fecha,
                ProductoId = producto.Id,
                Tipo = TipoMovimiento.Entrada,
                Origen = OrigenMovimiento.Ajuste,
                DocumentoNumero = "AJU-INICIAL",
                Cantidad = cantidad,
                CostoUnitario = producto.PrecioCosto,
                SaldoAnterior = 0,
                SaldoNuevo = cantidad,
                UsuarioId = admin.Id,
                Observacion = "Carga inicial de existencias"
            });
        }

        await _contexto.SaveChangesAsync();
    }

    private async Task SembrarOperacionesDemoAsync()
    {
        if (await _contexto.Compras.AnyAsync() || await _contexto.Ventas.AnyAsync())
        {
            return;
        }

        var admin = await _contexto.Usuarios.FirstAsync(usuario => usuario.NombreUsuario == "admin");
        var productos = await _contexto.Productos.ToDictionaryAsync(producto => producto.Codigo);
        var proveedores = await _contexto.Proveedores.OrderBy(proveedor => proveedor.Id).ToListAsync();
        var clientes = await _contexto.Clientes.OrderBy(cliente => cliente.Id).ToListAsync();

        if (productos.Count == 0 || proveedores.Count == 0 || clientes.Count == 0)
        {
            return;
        }

        await _compras.CrearAsync(new CompraCrearSolicitud
        {
            ProveedorId = proveedores[0].Id,
            Fecha = DateTime.Today.AddDays(-12).AddHours(9),
            ImpuestoPorcentaje = 12,
            Observaciones = "Compra de reposición semanal",
            Detalles = new List<CompraLineaSolicitud>
            {
                new() { ProductoId = productos["BEB-001"].Id, Cantidad = 48, PrecioUnitario = 2.73m },
                new() { ProductoId = productos["ALI-001"].Id, Cantidad = 24, PrecioUnitario = 21.84m },
                new() { ProductoId = productos["ALI-004"].Id, Cantidad = 18, PrecioUnitario = 32.76m }
            }
        }, admin.Id);

        await _compras.CrearAsync(new CompraCrearSolicitud
        {
            ProveedorId = proveedores[Math.Min(2, proveedores.Count - 1)].Id,
            Fecha = DateTime.Today.AddDays(-9).AddHours(11),
            ImpuestoPorcentaje = 12,
            Observaciones = "Compra de artículos de limpieza",
            Detalles = new List<CompraLineaSolicitud>
            {
                new() { ProductoId = productos["LIM-001"].Id, Cantidad = 20, PrecioUnitario = 16.38m },
                new() { ProductoId = productos["LIM-002"].Id, Cantidad = 60, PrecioUnitario = 4.29m },
                new() { ProductoId = productos["LIM-003"].Id, Cantidad = 30, PrecioUnitario = 7.80m }
            }
        }, admin.Id);

        var ventasDemo = new List<(int DiasAtras, int Cliente, string FormaPago, (string Codigo, decimal Cantidad)[] Lineas)>
        {
            (6, 1, "Efectivo", new[] { ("BEB-001", 6m), ("ALI-001", 2m), ("LIM-002", 3m) }),
            (5, 2, "Transferencia", new[] { ("BEB-003", 4m), ("ALI-004", 2m) }),
            (4, 0, "Efectivo", new[] { ("BEB-001", 10m), ("ALI-002", 4m), ("ALI-003", 3m) }),
            (3, 3, "Tarjeta", new[] { ("LIM-001", 4m), ("LIM-002", 8m) }),
            (2, 2, "Transferencia", new[] { ("PAP-001", 10m), ("PAP-002", 20m) }),
            (1, 4, "Efectivo", new[] { ("ALI-004", 3m), ("ALI-001", 2m), ("BEB-003", 2m) }),
            (0, 0, "Efectivo", new[] { ("BEB-001", 8m), ("BEB-002", 3m), ("ALI-003", 2m) }),
            (0, 1, "Tarjeta", new[] { ("LIM-002", 10m), ("LIM-003", 2m) })
        };

        foreach (var venta in ventasDemo)
        {
            await _ventas.CrearAsync(new VentaCrearSolicitud
            {
                ClienteId = venta.Cliente == 0 ? null : clientes[Math.Min(venta.Cliente, clientes.Count - 1)].Id,
                Fecha = DateTime.Today.AddDays(-venta.DiasAtras).AddHours(10 + venta.DiasAtras % 6),
                FormaPago = venta.FormaPago,
                Descuento = 0,
                ImpuestoPorcentaje = 12,
                Detalles = venta.Lineas.Select(linea => new VentaLineaSolicitud
                {
                    ProductoId = productos[linea.Codigo].Id,
                    Cantidad = linea.Cantidad,
                    PrecioUnitario = productos[linea.Codigo].PrecioVenta,
                    Descuento = 0
                }).ToList()
            }, admin.Id);
        }
    }
}

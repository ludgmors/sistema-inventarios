using Inventarios.Api.Datos;
using Inventarios.Api.DTOs;
using Inventarios.Api.Entidades;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Datos;

public class SembradorDatos
{
    private readonly ContextoInventarios _contexto;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly Servicios.ServicioCompras _compras;
    private readonly Servicios.ServicioVentas _ventas;
    private readonly ILogger<SembradorDatos> _logger;

    public SembradorDatos(
        ContextoInventarios contexto,
        IPasswordHasher<Usuario> hasher,
        Servicios.ServicioCompras compras,
        Servicios.ServicioVentas ventas,
        ILogger<SembradorDatos> logger)
    {
        _contexto = contexto;
        _hasher = hasher;
        _compras = compras;
        _ventas = ventas;
        _logger = logger;
    }

    public async Task InicializarAsync()
    {
        await _contexto.Database.MigrateAsync();

        await SembrarSeguridadAsync();
        await SembrarParametrosAsync();
        await SembrarSecuenciasAsync();
        await SembrarCatalogosAsync();
        await SembrarOperacionesDemoAsync();

        _logger.LogInformation("Base de datos verificada y datos iniciales listos.");
    }

    private async Task SembrarSeguridadAsync()
    {
        if (!await _contexto.Roles.AnyAsync())
        {
            _contexto.Roles.AddRange(
                new Rol { Nombre = "Administrador", Descripcion = "Acceso completo al sistema" },
                new Rol { Nombre = "Inventario", Descripcion = "Productos, compras, proveedores y ajustes" },
                new Rol { Nombre = "Ventas", Descripcion = "Ventas, clientes y notas" },
                new Rol { Nombre = "Consulta", Descripcion = "Solo consulta de información" });

            await _contexto.SaveChangesAsync();
        }

        if (await _contexto.Usuarios.AnyAsync())
        {
            return;
        }

        var roles = await _contexto.Roles.ToDictionaryAsync(rol => rol.Nombre);

        var usuarios = new List<Usuario>
        {
            CrearUsuario("Administrador del Sistema", "admin", "admin@inventarios.local", "Admin123!", roles["Administrador"].Id),
            CrearUsuario("María González", "vendedor", "vendedor@inventarios.local", "Ventas123!", roles["Ventas"].Id),
            CrearUsuario("Carlos Rodríguez", "bodega", "bodega@inventarios.local", "Inventario123!", roles["Inventario"].Id),
            CrearUsuario("Ana Martínez", "consulta", "consulta@inventarios.local", "Consulta123!", roles["Consulta"].Id)
        };

        _contexto.Usuarios.AddRange(usuarios);
        await _contexto.SaveChangesAsync();
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
            new() { Clave = "Empresa.Documento", Valor = "8-888-8888", Descripcion = "RUC o documento fiscal", Grupo = "Empresa" },
            new() { Clave = "Empresa.Direccion", Valor = "Ciudad de Panamá, Panamá", Descripcion = "Dirección principal", Grupo = "Empresa" },
            new() { Clave = "Empresa.Telefono", Valor = "+507 6000-0000", Descripcion = "Teléfono de contacto", Grupo = "Empresa" },
            new() { Clave = "Empresa.Correo", Valor = "info@buenprecio.com", Descripcion = "Correo de contacto", Grupo = "Empresa" },
            new() { Clave = "Impuesto.Porcentaje", Valor = "7", Descripcion = "Porcentaje de impuesto aplicado a las transacciones", Grupo = "Impuestos" },
            new() { Clave = "Moneda.Simbolo", Valor = "$", Descripcion = "Símbolo de la moneda", Grupo = "Moneda" },
            new() { Clave = "Moneda.Codigo", Valor = "USD", Descripcion = "Código ISO de la moneda", Grupo = "Moneda" },
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
                new Proveedor { Codigo = "PRV-001", RazonSocial = "Distribuidora La Central", Documento = "8-123-4567", Contacto = "Luis Pérez", Telefono = "+507 6111-1111", Correo = "ventas@lacentral.com", Direccion = "Vía España, Ciudad de Panamá" },
                new Proveedor { Codigo = "PRV-002", RazonSocial = "Alimentos del Istmo", Documento = "8-234-5678", Contacto = "Marta Ruiz", Telefono = "+507 6222-2222", Correo = "pedidos@istmo.com", Direccion = "Zona Industrial, Panamá" },
                new Proveedor { Codigo = "PRV-003", RazonSocial = "Suministros del Pacífico", Documento = "8-345-6789", Contacto = "Jorge Díaz", Telefono = "+507 6333-3333", Correo = "compras@pacifico.com", Direccion = "Avenida Balboa, Panamá" });

            await _contexto.SaveChangesAsync();
        }

        if (!await _contexto.Clientes.AnyAsync())
        {
            _contexto.Clientes.AddRange(
                new Cliente { Codigo = "CLI-001", Nombre = "Cliente General", Documento = "CF", Telefono = "+507 6000-0000" },
                new Cliente { Codigo = "CLI-002", Nombre = "Supermercado El Ahorro", Documento = "8-456-7890", Telefono = "+507 6444-4444", Correo = "compras@elahorro.com" },
                new Cliente { Codigo = "CLI-003", Nombre = "Farmacia San José", Documento = "8-567-8901", Telefono = "+507 6555-5555", Correo = "admin@farmaciasanjose.com" },
                new Cliente { Codigo = "CLI-004", Nombre = "Restaurante La Esquina", Documento = "8-678-9012", Telefono = "+507 6666-6666", Correo = "gerencia@laesquina.com" });

            await _contexto.SaveChangesAsync();
        }

        if (!await _contexto.Productos.AnyAsync())
        {
            var categorias = await _contexto.Categorias.ToDictionaryAsync(categoria => categoria.Nombre);

            _contexto.Productos.AddRange(
                new Producto { Codigo = "BEB-001", Nombre = "Agua Mineral 600 ml", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 0.35m, PrecioVenta = 0.75m, ExistenciaMinima = 24 },
                new Producto { Codigo = "BEB-002", Nombre = "Refresco de Cola 2 L", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 1.20m, PrecioVenta = 2.25m, ExistenciaMinima = 12 },
                new Producto { Codigo = "BEB-003", Nombre = "Jugo de Naranja 1 L", CategoriaId = categorias["Bebidas"].Id, PrecioCosto = 1.10m, PrecioVenta = 2.00m, ExistenciaMinima = 10 },
                new Producto { Codigo = "ALI-001", Nombre = "Arroz Blanco 5 lb", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 2.80m, PrecioVenta = 4.50m, ExistenciaMinima = 15 },
                new Producto { Codigo = "ALI-002", Nombre = "Frijol Rojo 1 lb", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 0.95m, PrecioVenta = 1.75m, ExistenciaMinima = 20 },
                new Producto { Codigo = "ALI-003", Nombre = "Aceite Vegetal 1 L", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 1.80m, PrecioVenta = 3.25m, ExistenciaMinima = 12 },
                new Producto { Codigo = "ALI-004", Nombre = "Café Molido 500 g", CategoriaId = categorias["Alimentos"].Id, PrecioCosto = 4.20m, PrecioVenta = 6.95m, ExistenciaMinima = 8 },
                new Producto { Codigo = "LIM-001", Nombre = "Detergente en Polvo 1 kg", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 2.10m, PrecioVenta = 3.75m, ExistenciaMinima = 8 },
                new Producto { Codigo = "LIM-002", Nombre = "Jabón de Baño", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 0.55m, PrecioVenta = 1.25m, ExistenciaMinima = 25 },
                new Producto { Codigo = "LIM-003", Nombre = "Cloro 1 L", CategoriaId = categorias["Limpieza"].Id, PrecioCosto = 1.00m, PrecioVenta = 1.95m, ExistenciaMinima = 10 },
                new Producto { Codigo = "PAP-001", Nombre = "Cuaderno 100 hojas", CategoriaId = categorias["Papelería"].Id, PrecioCosto = 0.80m, PrecioVenta = 1.60m, ExistenciaMinima = 30 },
                new Producto { Codigo = "PAP-002", Nombre = "Bolígrafo Azul", CategoriaId = categorias["Papelería"].Id, PrecioCosto = 0.25m, PrecioVenta = 0.75m, ExistenciaMinima = 50 });

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
            ImpuestoPorcentaje = 7,
            Observaciones = "Compra de reposición semanal",
            Detalles = new List<CompraLineaSolicitud>
            {
                new() { ProductoId = productos["BEB-001"].Id, Cantidad = 48, PrecioUnitario = 0.35m },
                new() { ProductoId = productos["ALI-001"].Id, Cantidad = 24, PrecioUnitario = 2.80m },
                new() { ProductoId = productos["ALI-004"].Id, Cantidad = 18, PrecioUnitario = 4.20m }
            }
        }, admin.Id);

        await _compras.CrearAsync(new CompraCrearSolicitud
        {
            ProveedorId = proveedores[Math.Min(2, proveedores.Count - 1)].Id,
            Fecha = DateTime.Today.AddDays(-9).AddHours(11),
            ImpuestoPorcentaje = 7,
            Observaciones = "Compra de artículos de limpieza",
            Detalles = new List<CompraLineaSolicitud>
            {
                new() { ProductoId = productos["LIM-001"].Id, Cantidad = 20, PrecioUnitario = 2.10m },
                new() { ProductoId = productos["LIM-002"].Id, Cantidad = 60, PrecioUnitario = 0.55m },
                new() { ProductoId = productos["LIM-003"].Id, Cantidad = 30, PrecioUnitario = 1.00m }
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
                ImpuestoPorcentaje = 7,
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

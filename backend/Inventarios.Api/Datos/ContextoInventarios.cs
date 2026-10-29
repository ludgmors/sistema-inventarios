using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;

namespace Inventarios.Api.Datos;

public class ContextoInventarios : DbContext
{
    public ContextoInventarios(DbContextOptions<ContextoInventarios> opciones)
        : base(opciones)
    {
    }

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<DesafioAcceso> DesafiosAcceso => Set<DesafioAcceso>();
    public DbSet<SesionAcceso> SesionesAcceso => Set<SesionAcceso>();
    public DbSet<RecuperacionAcceso> RecuperacionesAcceso => Set<RecuperacionAcceso>();
    public DbSet<LimiteAcceso> LimitesAcceso => Set<LimiteAcceso>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Bitacora> Bitacoras => Set<Bitacora>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ParametroSistema> ParametrosSistema => Set<ParametroSistema>();
    public DbSet<SecuenciaDocumento> SecuenciasDocumento => Set<SecuenciaDocumento>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<CompraDetalle> CompraDetalles => Set<CompraDetalle>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<VentaDetalle> VentaDetalles => Set<VentaDetalle>();
    public DbSet<NotaAjuste> NotasAjuste => Set<NotaAjuste>();
    public DbSet<NotaAjusteDetalle> NotaAjusteDetalles => Set<NotaAjusteDetalle>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ContextoInventarios).Assembly);
    }
}

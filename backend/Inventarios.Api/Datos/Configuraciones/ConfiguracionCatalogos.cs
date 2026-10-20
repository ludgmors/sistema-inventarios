using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventarios.Api.Datos.Configuraciones;

public class ConfiguracionCategoria : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.ToTable("Categorias");
        builder.HasKey(categoria => categoria.Id);
        builder.Property(categoria => categoria.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(categoria => categoria.Descripcion).HasMaxLength(300);
        builder.HasIndex(categoria => categoria.Nombre).IsUnique();
    }
}

public class ConfiguracionProveedor : IEntityTypeConfiguration<Proveedor>
{
    public void Configure(EntityTypeBuilder<Proveedor> builder)
    {
        builder.ToTable("Proveedores");
        builder.HasKey(proveedor => proveedor.Id);
        builder.Property(proveedor => proveedor.Codigo).IsRequired().HasMaxLength(30);
        builder.Property(proveedor => proveedor.RazonSocial).IsRequired().HasMaxLength(200);
        builder.Property(proveedor => proveedor.Documento).HasMaxLength(50);
        builder.Property(proveedor => proveedor.Contacto).HasMaxLength(150);
        builder.Property(proveedor => proveedor.Telefono).HasMaxLength(30);
        builder.Property(proveedor => proveedor.Correo).HasMaxLength(150);
        builder.Property(proveedor => proveedor.Direccion).HasMaxLength(300);
        builder.HasIndex(proveedor => proveedor.Codigo).IsUnique();
    }
}

public class ConfiguracionCliente : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(cliente => cliente.Id);
        builder.Property(cliente => cliente.Codigo).IsRequired().HasMaxLength(30);
        builder.Property(cliente => cliente.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(cliente => cliente.Documento).HasMaxLength(50);
        builder.Property(cliente => cliente.Telefono).HasMaxLength(30);
        builder.Property(cliente => cliente.Correo).HasMaxLength(150);
        builder.Property(cliente => cliente.Direccion).HasMaxLength(300);
        builder.HasIndex(cliente => cliente.Codigo).IsUnique();
    }
}

public class ConfiguracionProducto : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.ToTable("Productos", tabla =>
        {
            tabla.HasCheckConstraint("CK_Productos_PrecioVenta", "[PrecioVenta] >= 0");
            tabla.HasCheckConstraint("CK_Productos_PrecioCosto", "[PrecioCosto] >= 0");
            tabla.HasCheckConstraint("CK_Productos_ExistenciaMinima", "[ExistenciaMinima] >= 0");
        });

        builder.HasKey(producto => producto.Id);

        builder.Property(producto => producto.Codigo).IsRequired().HasMaxLength(50);
        builder.HasIndex(producto => producto.Codigo).IsUnique();

        builder.Property(producto => producto.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(producto => producto.Descripcion).HasMaxLength(500);
        builder.Property(producto => producto.UnidadMedida).IsRequired().HasMaxLength(30);

        builder.Property(producto => producto.PrecioCosto).IsRequired().HasPrecision(18, 2);
        builder.Property(producto => producto.PrecioVenta).IsRequired().HasPrecision(18, 2);
        builder.Property(producto => producto.ExistenciaActual).IsRequired().HasPrecision(18, 4);
        builder.Property(producto => producto.ExistenciaMinima).IsRequired().HasPrecision(18, 4);

        builder.Property(producto => producto.RowVersion).IsRowVersion();

        builder.HasOne(producto => producto.Categoria)
            .WithMany(categoria => categoria.Productos)
            .HasForeignKey(producto => producto.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionParametroSistema : IEntityTypeConfiguration<ParametroSistema>
{
    public void Configure(EntityTypeBuilder<ParametroSistema> builder)
    {
        builder.ToTable("ParametrosSistema");
        builder.HasKey(parametro => parametro.Id);
        builder.Property(parametro => parametro.Clave).IsRequired().HasMaxLength(100);
        builder.Property(parametro => parametro.Valor).IsRequired().HasMaxLength(500);
        builder.Property(parametro => parametro.Descripcion).HasMaxLength(300);
        builder.Property(parametro => parametro.Grupo).IsRequired().HasMaxLength(50);
        builder.HasIndex(parametro => parametro.Clave).IsUnique();
    }
}

using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventarios.Api.Datos.Configuraciones;

public class ConfiguracionCompra : IEntityTypeConfiguration<Compra>
{
    public void Configure(EntityTypeBuilder<Compra> builder)
    {
        builder.ToTable("Compras");
        builder.HasKey(compra => compra.Id);
        builder.Property(compra => compra.Numero).IsRequired().HasMaxLength(30);
        builder.HasIndex(compra => compra.Numero).IsUnique();
        builder.Property(compra => compra.Subtotal).HasPrecision(18, 2);
        builder.Property(compra => compra.ImpuestoPorcentaje).HasPrecision(5, 2);
        builder.Property(compra => compra.Impuesto).HasPrecision(18, 2);
        builder.Property(compra => compra.Total).HasPrecision(18, 2);
        builder.Property(compra => compra.Observaciones).HasMaxLength(500);
        builder.Property(compra => compra.Estado).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(compra => compra.Fecha);

        builder.HasOne(compra => compra.Proveedor)
            .WithMany(proveedor => proveedor.Compras)
            .HasForeignKey(compra => compra.ProveedorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(compra => compra.Usuario)
            .WithMany()
            .HasForeignKey(compra => compra.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(compra => compra.UsuarioAnulacion)
            .WithMany()
            .HasForeignKey(compra => compra.UsuarioAnulacionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionCompraDetalle : IEntityTypeConfiguration<CompraDetalle>
{
    public void Configure(EntityTypeBuilder<CompraDetalle> builder)
    {
        builder.ToTable("CompraDetalles");
        builder.HasKey(detalle => detalle.Id);
        builder.Property(detalle => detalle.Cantidad).HasPrecision(18, 4);
        builder.Property(detalle => detalle.PrecioUnitario).HasPrecision(18, 2);
        builder.Property(detalle => detalle.Subtotal).HasPrecision(18, 2);

        builder.HasOne(detalle => detalle.Compra)
            .WithMany(compra => compra.Detalles)
            .HasForeignKey(detalle => detalle.CompraId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(detalle => detalle.Producto)
            .WithMany(producto => producto.ComprasDetalle)
            .HasForeignKey(detalle => detalle.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionVenta : IEntityTypeConfiguration<Venta>
{
    public void Configure(EntityTypeBuilder<Venta> builder)
    {
        builder.ToTable("Ventas");
        builder.HasKey(venta => venta.Id);
        builder.Property(venta => venta.Numero).IsRequired().HasMaxLength(30);
        builder.HasIndex(venta => venta.Numero).IsUnique();
        builder.Property(venta => venta.Subtotal).HasPrecision(18, 2);
        builder.Property(venta => venta.Descuento).HasPrecision(18, 2);
        builder.Property(venta => venta.ImpuestoPorcentaje).HasPrecision(5, 2);
        builder.Property(venta => venta.Impuesto).HasPrecision(18, 2);
        builder.Property(venta => venta.Total).HasPrecision(18, 2);
        builder.Property(venta => venta.FormaPago).IsRequired().HasMaxLength(50);
        builder.Property(venta => venta.Observaciones).HasMaxLength(500);
        builder.Property(venta => venta.Estado).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(venta => venta.Fecha);

        builder.HasOne(venta => venta.Cliente)
            .WithMany(cliente => cliente.Ventas)
            .HasForeignKey(venta => venta.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(venta => venta.Usuario)
            .WithMany()
            .HasForeignKey(venta => venta.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(venta => venta.UsuarioAnulacion)
            .WithMany()
            .HasForeignKey(venta => venta.UsuarioAnulacionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionVentaDetalle : IEntityTypeConfiguration<VentaDetalle>
{
    public void Configure(EntityTypeBuilder<VentaDetalle> builder)
    {
        builder.ToTable("VentaDetalles");
        builder.HasKey(detalle => detalle.Id);
        builder.Property(detalle => detalle.Cantidad).HasPrecision(18, 4);
        builder.Property(detalle => detalle.PrecioUnitario).HasPrecision(18, 2);
        builder.Property(detalle => detalle.Descuento).HasPrecision(18, 2);
        builder.Property(detalle => detalle.Subtotal).HasPrecision(18, 2);

        builder.HasOne(detalle => detalle.Venta)
            .WithMany(venta => venta.Detalles)
            .HasForeignKey(detalle => detalle.VentaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(detalle => detalle.Producto)
            .WithMany(producto => producto.VentasDetalle)
            .HasForeignKey(detalle => detalle.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionNotaAjuste : IEntityTypeConfiguration<NotaAjuste>
{
    public void Configure(EntityTypeBuilder<NotaAjuste> builder)
    {
        builder.ToTable("NotasAjuste");
        builder.HasKey(nota => nota.Id);
        builder.Property(nota => nota.Numero).IsRequired().HasMaxLength(30);
        builder.HasIndex(nota => nota.Numero).IsUnique();
        builder.Property(nota => nota.Tipo).HasConversion<string>().HasMaxLength(20);
        builder.Property(nota => nota.Motivo).IsRequired().HasMaxLength(300);
        builder.Property(nota => nota.Subtotal).HasPrecision(18, 2);
        builder.Property(nota => nota.ImpuestoPorcentaje).HasPrecision(5, 2);
        builder.Property(nota => nota.Impuesto).HasPrecision(18, 2);
        builder.Property(nota => nota.Total).HasPrecision(18, 2);
        builder.Property(nota => nota.Estado).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(nota => nota.Fecha);

        builder.HasOne(nota => nota.Venta)
            .WithMany(venta => venta.Notas)
            .HasForeignKey(nota => nota.VentaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(nota => nota.Usuario)
            .WithMany()
            .HasForeignKey(nota => nota.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionNotaAjusteDetalle : IEntityTypeConfiguration<NotaAjusteDetalle>
{
    public void Configure(EntityTypeBuilder<NotaAjusteDetalle> builder)
    {
        builder.ToTable("NotaAjusteDetalles");
        builder.HasKey(detalle => detalle.Id);
        builder.Property(detalle => detalle.Cantidad).HasPrecision(18, 4);
        builder.Property(detalle => detalle.PrecioUnitario).HasPrecision(18, 2);
        builder.Property(detalle => detalle.Subtotal).HasPrecision(18, 2);

        builder.HasOne(detalle => detalle.NotaAjuste)
            .WithMany(nota => nota.Detalles)
            .HasForeignKey(detalle => detalle.NotaAjusteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(detalle => detalle.Producto)
            .WithMany()
            .HasForeignKey(detalle => detalle.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionSecuenciaDocumento : IEntityTypeConfiguration<SecuenciaDocumento>
{
    public void Configure(EntityTypeBuilder<SecuenciaDocumento> builder)
    {
        builder.ToTable("SecuenciasDocumento");
        builder.HasKey(secuencia => secuencia.Id);
        builder.Property(secuencia => secuencia.Tipo).IsRequired().HasMaxLength(30);
        builder.Property(secuencia => secuencia.Prefijo).IsRequired().HasMaxLength(10);
        builder.HasIndex(secuencia => secuencia.Tipo).IsUnique();
        builder.Property(secuencia => secuencia.RowVersion).IsRowVersion();
    }
}

using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventarios.Api.Datos.Configuraciones;

public class ConfiguracionMovimientoInventario : IEntityTypeConfiguration<MovimientoInventario>
{
    public void Configure(EntityTypeBuilder<MovimientoInventario> builder)
    {
        builder.ToTable("MovimientosInventario");
        builder.HasKey(movimiento => movimiento.Id);
        builder.Property(movimiento => movimiento.Tipo).HasConversion<string>().HasMaxLength(20);
        builder.Property(movimiento => movimiento.Origen).HasConversion<string>().HasMaxLength(20);
        builder.Property(movimiento => movimiento.DocumentoNumero).HasMaxLength(30);
        builder.Property(movimiento => movimiento.Cantidad).HasPrecision(18, 4);
        builder.Property(movimiento => movimiento.CostoUnitario).HasPrecision(18, 2);
        builder.Property(movimiento => movimiento.SaldoAnterior).HasPrecision(18, 4);
        builder.Property(movimiento => movimiento.SaldoNuevo).HasPrecision(18, 4);
        builder.Property(movimiento => movimiento.Observacion).HasMaxLength(500);
        builder.HasIndex(movimiento => movimiento.Fecha);
        builder.HasIndex(movimiento => movimiento.ProductoId);

        builder.HasOne(movimiento => movimiento.Producto)
            .WithMany(producto => producto.Movimientos)
            .HasForeignKey(movimiento => movimiento.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(movimiento => movimiento.Usuario)
            .WithMany()
            .HasForeignKey(movimiento => movimiento.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

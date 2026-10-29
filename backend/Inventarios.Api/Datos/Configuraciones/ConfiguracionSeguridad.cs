using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventarios.Api.Datos.Configuraciones;

public class ConfiguracionRol : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(rol => rol.Id);
        builder.Property(rol => rol.Nombre).IsRequired().HasMaxLength(50);
        builder.Property(rol => rol.Descripcion).HasMaxLength(200);
        builder.HasIndex(rol => rol.Nombre).IsUnique();
    }
}

public class ConfiguracionUsuario : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");
        builder.HasKey(usuario => usuario.Id);
        builder.Property(usuario => usuario.NombreCompleto).IsRequired().HasMaxLength(150);
        builder.Property(usuario => usuario.NombreUsuario).IsRequired().HasMaxLength(150);
        builder.Property(usuario => usuario.Correo).IsRequired().HasMaxLength(150);
        builder.Property(usuario => usuario.HashContrasena).IsRequired().HasMaxLength(500);

        builder.HasIndex(usuario => usuario.NombreUsuario).IsUnique();
        builder.HasIndex(usuario => usuario.Correo).IsUnique();

        builder.HasOne(usuario => usuario.Rol)
            .WithMany(rol => rol.Usuarios)
            .HasForeignKey(usuario => usuario.RolId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ConfiguracionBitacora : IEntityTypeConfiguration<Bitacora>
{
    public void Configure(EntityTypeBuilder<Bitacora> builder)
    {
        builder.ToTable("Bitacoras");
        builder.HasKey(bitacora => bitacora.Id);
        builder.Property(bitacora => bitacora.UsuarioNombre).IsRequired().HasMaxLength(150);
        builder.Property(bitacora => bitacora.Accion).IsRequired().HasMaxLength(100);
        builder.Property(bitacora => bitacora.Modulo).IsRequired().HasMaxLength(80);
        builder.Property(bitacora => bitacora.Detalle).HasMaxLength(1000);
        builder.Property(bitacora => bitacora.DireccionIp).HasMaxLength(60);
        builder.HasIndex(bitacora => bitacora.Fecha);

        builder.HasOne(bitacora => bitacora.Usuario)
            .WithMany()
            .HasForeignKey(bitacora => bitacora.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

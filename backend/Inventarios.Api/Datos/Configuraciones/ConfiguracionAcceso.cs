using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Inventarios.Api.Datos.Configuraciones;

public class ConfiguracionSesionAcceso : IEntityTypeConfiguration<SesionAcceso>
{
    public void Configure(EntityTypeBuilder<SesionAcceso> b)
    {
        b.ToTable("SesionesAcceso");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(32);
        b.Property(x => x.VersionCredenciales).HasMaxLength(64);
        b.HasIndex(x => x.ExpiraUtc);
        b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ConfiguracionRecuperacionAcceso : IEntityTypeConfiguration<RecuperacionAcceso>
{
    public void Configure(EntityTypeBuilder<RecuperacionAcceso> b)
    {
        b.ToTable("RecuperacionesAcceso");
        b.HasKey(x => x.Hash);
        b.Property(x => x.Hash).HasMaxLength(64);
        b.HasIndex(x => x.ExpiraUtc);
        b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ConfiguracionLimiteAcceso : IEntityTypeConfiguration<LimiteAcceso>
{
    public void Configure(EntityTypeBuilder<LimiteAcceso> b)
    {
        b.ToTable("LimitesAcceso");
        b.HasKey(x => x.Clave);
        b.Property(x => x.Clave).HasMaxLength(64);
    }
}

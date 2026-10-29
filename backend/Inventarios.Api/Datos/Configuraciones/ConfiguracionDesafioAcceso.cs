using Inventarios.Api.Entidades;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Inventarios.Api.Datos.Configuraciones;
public class ConfiguracionDesafioAcceso : IEntityTypeConfiguration<DesafioAcceso>
{
    public void Configure(EntityTypeBuilder<DesafioAcceso> b)
    {
        b.ToTable("DesafiosAcceso"); b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(32);
        b.Property(x => x.HashCodigo).HasMaxLength(64);
        b.Property(x => x.HashNavegador).HasMaxLength(64);
        b.Property(x => x.VersionCredenciales).HasMaxLength(64);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.HasIndex(x => x.ExpiraUtc);
        b.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventarios.Api.Datos.Migraciones
{
    /// <inheritdoc />
    public partial class RolSuperadmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = N'Superadmin')
                    INSERT INTO Roles (Nombre, Descripcion, Activo)
                    VALUES (N'Superadmin', N'Acceso completo y control de cuentas superadmin', 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM Usuarios u JOIN Roles r ON r.Id=u.RolId WHERE r.Nombre=N'Superadmin')
                    THROW 50000, 'Reasigne las cuentas Superadmin antes de revertir esta migración.', 1;
                DELETE FROM Roles WHERE Nombre=N'Superadmin';
                """);
        }
    }
}

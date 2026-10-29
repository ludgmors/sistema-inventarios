using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventarios.Api.Datos.Migraciones
{
    /// <inheritdoc />
    public partial class SegundoFactorCorreo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE SesionesAcceso SET RevocadaUtc = SYSUTCDATETIME() WHERE RevocadaUtc IS NULL;");
            migrationBuilder.CreateTable(
                name: "DesafiosAcceso",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    HashCodigo = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    HashNavegador = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    VersionCredenciales = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Correo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false),
                    CreadoUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiraUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimoEnvioUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Intentos = table.Column<int>(type: "int", nullable: false),
                    UsadoUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DesafiosAcceso", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DesafiosAcceso_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DesafiosAcceso_ExpiraUtc",
                table: "DesafiosAcceso",
                column: "ExpiraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_DesafiosAcceso_UsuarioId",
                table: "DesafiosAcceso",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DesafiosAcceso");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventarios.Api.Datos.Migraciones
{
    /// <inheritdoc />
    public partial class SeguridadAcceso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BloqueadoHastaUtc",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LimitesAcceso",
                columns: table => new
                {
                    Clave = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    InicioUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    BloqueadoHastaUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LimitesAcceso", x => x.Clave);
                });

            migrationBuilder.CreateTable(
                name: "RecuperacionesAcceso",
                columns: table => new
                {
                    Hash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    ExpiraUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsadoUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecuperacionesAcceso", x => x.Hash);
                    table.ForeignKey(
                        name: "FK_RecuperacionesAcceso_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SesionesAcceso",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    VersionCredenciales = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false),
                    ExpiraUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimaActividadUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevocadaUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SesionesAcceso", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SesionesAcceso_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecuperacionesAcceso_ExpiraUtc",
                table: "RecuperacionesAcceso",
                column: "ExpiraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_RecuperacionesAcceso_UsuarioId",
                table: "RecuperacionesAcceso",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_SesionesAcceso_ExpiraUtc",
                table: "SesionesAcceso",
                column: "ExpiraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_SesionesAcceso_UsuarioId",
                table: "SesionesAcceso",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LimitesAcceso");

            migrationBuilder.DropTable(
                name: "RecuperacionesAcceso");

            migrationBuilder.DropTable(
                name: "SesionesAcceso");

            migrationBuilder.DropColumn(
                name: "BloqueadoHastaUtc",
                table: "Usuarios");
        }
    }
}

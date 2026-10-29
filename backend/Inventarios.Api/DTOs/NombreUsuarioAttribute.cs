using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Inventarios.Api.DTOs;

public sealed class NombreUsuarioAttribute : ValidationAttribute
{
    public NombreUsuarioAttribute() : base("Ingrese un alias con letras, números, puntos o guiones, o un correo válido.") { }
    public override bool IsValid(object? value) => value is string nombre && nombre.Length <= 150 &&
        (nombre.Contains('@') ? new CorreoFormalAttribute().IsValid(nombre)
            : Regex.IsMatch(nombre, @"^[a-zA-Z0-9._-]+$"));
}

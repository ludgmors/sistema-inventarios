using System.ComponentModel.DataAnnotations;
using System.Net.Mail;

namespace Inventarios.Api.DTOs;

// Valida sintaxis de una dirección, sin restringirla a proveedores comerciales.
// La existencia del buzón solo se comprueba al recibir el mensaje.
public sealed class CorreoFormalAttribute : ValidationAttribute
{
    public CorreoFormalAttribute() : base("Ingrese un correo válido, por ejemplo nombre@empresa.com.") { }
    public override bool IsValid(object? value)
    {
        if (value is not string correo || correo.Length > 150 || correo != correo.Trim()
            || !MailAddress.TryCreate(correo, out var direccion) || direccion.Address != correo) return false;
        var etiquetas = direccion.Host.Split('.');
        if (new[] { "local", "localhost", "invalid", "test", "example" }.Contains(etiquetas[^1], StringComparer.OrdinalIgnoreCase)) return false;
        return etiquetas.Length >= 2 && etiquetas.All(x => x.Length is > 0 and <= 63
            && char.IsAsciiLetterOrDigit(x[0]) && char.IsAsciiLetterOrDigit(x[^1])
            && x.All(c => char.IsAsciiLetterOrDigit(c) || c == '-'))
            && etiquetas[^1].Length >= 2 && etiquetas[^1].All(char.IsAsciiLetter);
    }
}

using System.Net;
using System.Net.Mail;
using System.Text;

namespace Inventarios.Api.Servicios;

public class ServicioCorreo(IConfiguration config, IWebHostEnvironment entorno)
{
    public async Task EnviarAsync(string destinatario, string asunto, string cuerpo)
    {
        using var cliente = new SmtpClient(config["Correo:Host"] ?? "127.0.0.1", config.GetValue("Correo:Puerto", 1025)) {
            EnableSsl = !entorno.IsDevelopment() || config.GetValue("Correo:Tls", false), Timeout = 15000
        };
        if (!string.IsNullOrWhiteSpace(config["Correo:Usuario"]))
            cliente.Credentials = new NetworkCredential(config["Correo:Usuario"], config["Correo:Clave"]);
        using var mensaje = new MailMessage(config["Correo:Remitente"] ?? "inventarios@example.com", destinatario) {
            Subject = asunto, Body = cuerpo, SubjectEncoding = Encoding.UTF8, BodyEncoding = Encoding.UTF8
        };
        await cliente.SendMailAsync(mensaje);
    }
}

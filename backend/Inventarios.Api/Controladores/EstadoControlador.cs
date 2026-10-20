using Microsoft.AspNetCore.Mvc;

namespace Inventarios.Api.Controladores;

[ApiController]
[Route("api/health")]
public class EstadoControlador : ControllerBase
{
    [HttpGet]
    public IActionResult Obtener() => Ok(new { estado = "correcto" });
}

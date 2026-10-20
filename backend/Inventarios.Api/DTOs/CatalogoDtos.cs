using System.ComponentModel.DataAnnotations;

namespace Inventarios.Api.DTOs;

public class CategoriaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public int CantidadProductos { get; set; }
}

public class CategoriaGuardarSolicitud
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Descripcion { get; set; }

    public bool Activo { get; set; } = true;
}

public class ProveedorDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Contacto { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class ProveedorGuardarSolicitud
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [MaxLength(30)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La razón social es obligatoria.")]
    [MaxLength(200)]
    public string RazonSocial { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Documento { get; set; }

    [MaxLength(150)]
    public string? Contacto { get; set; }

    [MaxLength(30)]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    [MaxLength(150)]
    public string? Correo { get; set; }

    [MaxLength(300)]
    public string? Direccion { get; set; }

    public bool Activo { get; set; } = true;
}

public class ClienteDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class ClienteGuardarSolicitud
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [MaxLength(30)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Documento { get; set; }

    [MaxLength(30)]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    [MaxLength(150)]
    public string? Correo { get; set; }

    [MaxLength(300)]
    public string? Direccion { get; set; }

    public bool Activo { get; set; } = true;
}

public class ProductoDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int CategoriaId { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string UnidadMedida { get; set; } = string.Empty;
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal ExistenciaActual { get; set; }
    public decimal ExistenciaMinima { get; set; }
    public bool Activo { get; set; }
    public bool BajoMinimo => ExistenciaActual <= ExistenciaMinima;
    public DateTime FechaCreacion { get; set; }
}

public class ProductoGuardarSolicitud
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [MaxLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar una categoría.")]
    public int CategoriaId { get; set; }

    [Required(ErrorMessage = "La unidad de medida es obligatoria.")]
    [MaxLength(30)]
    public string UnidadMedida { get; set; } = "Unidad";

    [Range(0, 999999999, ErrorMessage = "El costo no puede ser negativo.")]
    public decimal PrecioCosto { get; set; }

    [Range(0, 999999999, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioVenta { get; set; }

    [Range(0, 999999999, ErrorMessage = "La existencia mínima no puede ser negativa.")]
    public decimal ExistenciaMinima { get; set; }

    public bool Activo { get; set; } = true;
}

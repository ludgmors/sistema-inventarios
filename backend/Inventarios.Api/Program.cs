using System.Text;
using System.Text.Json.Serialization;
using Inventarios.Api.Datos;
using Inventarios.Api.Entidades;
using Inventarios.Api.Middleware;
using Inventarios.Api.Seguridad;
using Inventarios.Api.Servicios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var constructor = WebApplication.CreateBuilder(args);
constructor.WebHost.ConfigureKestrel(opciones => opciones.Limits.MaxRequestBodySize = 1024 * 1024);

// Servicios de la API.
constructor.Services.AddControllers()
    .AddJsonOptions(opciones =>
    {
        opciones.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

constructor.Services.AddDbContext<ContextoInventarios>(opciones =>
    opciones.UseSqlServer(constructor.Configuration.GetConnectionString("Inventarios")));

constructor.Services.AddHttpContextAccessor();
constructor.Services.AddMemoryCache();
constructor.Services.AddScoped<ServicioProteccionAcceso>();
constructor.Services.AddScoped<ServicioRecuperacion>();
constructor.Services.AddScoped<ServicioCorreo>();
constructor.Services.AddAntiforgery(opciones =>
{
    opciones.HeaderName = "X-CSRF-TOKEN";
    opciones.Cookie.Name = "inventarios_csrf";
    opciones.Cookie.HttpOnly = true;
    opciones.Cookie.SameSite = SameSiteMode.Strict;
    opciones.Cookie.SecurePolicy = constructor.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});
constructor.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

constructor.Services.AddScoped<ServicioParametros>();
constructor.Services.AddScoped<ServicioSecuencias>();
constructor.Services.AddScoped<ServicioBitacora>();
constructor.Services.AddScoped<ServicioInventario>();
constructor.Services.AddScoped<ServicioAutenticacion>();
constructor.Services.AddScoped<ServicioUsuarios>();
constructor.Services.AddScoped<ServicioCompras>();
constructor.Services.AddScoped<ServicioVentas>();
constructor.Services.AddScoped<ServicioNotas>();
constructor.Services.AddScoped<ServicioReportes>();
constructor.Services.AddScoped<SembradorDatos>();

// Autenticación con JWT.
var opcionesJwt = constructor.Configuration.GetSection("Jwt").Get<OpcionesJwt>()
    ?? throw new InvalidOperationException("La sección Jwt no está configurada.");

if (string.IsNullOrWhiteSpace(opcionesJwt.Key) || opcionesJwt.Key.Length < 64)
{
    throw new InvalidOperationException("Configure Jwt:Key fuera del repositorio con al menos 64 caracteres aleatorios.");
}

constructor.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = opcionesJwt.Issuer,
            ValidateAudience = true,
            ValidAudience = opcionesJwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opcionesJwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(15),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };

        opciones.Events = new JwtBearerEvents
        {
            OnTokenValidated = async contexto =>
            {
                var servicio = contexto.HttpContext.RequestServices.GetRequiredService<ServicioAutenticacion>();
                if (!await servicio.ValidarSesionAsync(contexto.Principal!))
                {
                    contexto.Fail("Sesión inválida o revocada.");
                    contexto.Response.Cookies.Delete("access_token");
                }
            },
            OnMessageReceived = contexto =>
            {
                if (string.IsNullOrEmpty(contexto.Token) &&
                    contexto.Request.Cookies.TryGetValue("access_token", out var token))
                {
                    contexto.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

constructor.Services.AddAuthorization();

// CORS para desarrollo directo contra la API.
var origenes = constructor.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? Array.Empty<string>();

constructor.Services.AddCors(opciones =>
{
    opciones.AddPolicy("Frontend", politica =>
    {
        if (origenes.Length > 0)
        {
            politica.WithOrigins(origenes);
        }

        politica.AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

// Cabeceras reenviadas cuando la API está detrás de un proxy o hosting.
constructor.Services.Configure<ForwardedHeadersOptions>(opciones =>
{
    opciones.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Mantener la confianza en loopback. Otros proxies deben configurarse explícitamente.
    foreach (var proxy in constructor.Configuration.GetSection("Seguridad:ProxiesConfiables").Get<string[]>() ?? [])
        opciones.KnownProxies.Add(System.Net.IPAddress.Parse(proxy));
});

// Documentación OpenAPI / Swagger.
constructor.Services.AddEndpointsApiExplorer();
constructor.Services.AddSwaggerGen(opciones =>
{
    opciones.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema de Inventarios API",
        Version = "v1",
        Description = "API para proveedores, productos, compras, ventas, notas, movimientos y existencias."
    });

    opciones.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "El navegador usa la cookie HttpOnly. Las escrituras requieren también cookie antiforgery y X-CSRF-TOKEN."
    });

    opciones.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var aplicacion = constructor.Build();

aplicacion.UseForwardedHeaders();
aplicacion.UseMiddleware<ManejoErroresMiddleware>();
if (!aplicacion.Environment.IsDevelopment())
{
    aplicacion.UseHsts();
    aplicacion.UseHttpsRedirection();
}

aplicacion.UseSwagger();
aplicacion.UseSwaggerUI(opciones =>
{
    opciones.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema de Inventarios API v1");
    opciones.RoutePrefix = "swagger";
    opciones.DocumentTitle = "Sistema de Inventarios";
});

aplicacion.UseCors("Frontend");
aplicacion.UseAuthentication();
aplicacion.UseMiddleware<ProteccionAccesoMiddleware>();
aplicacion.UseAuthorization();

aplicacion.MapControllers();
aplicacion.MapGet("/", () => Results.Redirect("/swagger"));

// Crear/actualizar la base de datos y cargar los datos iniciales.
using (var alcance = aplicacion.Services.CreateScope())
{
    var sembrador = alcance.ServiceProvider.GetRequiredService<SembradorDatos>();
    await sembrador.InicializarAsync();
}

aplicacion.Run();

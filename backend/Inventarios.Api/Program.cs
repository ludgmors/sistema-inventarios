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

// Servicios de la API.
constructor.Services.AddControllers()
    .AddJsonOptions(opciones =>
    {
        opciones.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

constructor.Services.AddDbContext<ContextoInventarios>(opciones =>
    opciones.UseSqlServer(constructor.Configuration.GetConnectionString("Inventarios")));

constructor.Services.AddHttpContextAccessor();
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

if (string.IsNullOrWhiteSpace(opcionesJwt.Key) || opcionesJwt.Key.Length < 32)
{
    throw new InvalidOperationException("La clave JWT debe tener al menos 32 caracteres.");
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
            ClockSkew = TimeSpan.FromMinutes(2),
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };

        opciones.Events = new JwtBearerEvents
        {
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
        else
        {
            politica.SetIsOriginAllowed(_ => true);
        }

        politica.AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

// Cabeceras reenviadas cuando la API está detrás de un proxy o hosting.
constructor.Services.Configure<ForwardedHeadersOptions>(opciones =>
{
    opciones.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opciones.KnownNetworks.Clear();
    opciones.KnownProxies.Clear();
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
        Description = "Ingrese el token JWT devuelto por /api/auth/login."
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

aplicacion.UseSwagger();
aplicacion.UseSwaggerUI(opciones =>
{
    opciones.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema de Inventarios API v1");
    opciones.RoutePrefix = "swagger";
    opciones.DocumentTitle = "Sistema de Inventarios";
});

aplicacion.UseCors("Frontend");
aplicacion.UseAuthentication();
aplicacion.UseAuthorization();

if (!aplicacion.Environment.IsDevelopment())
{
    aplicacion.UseHttpsRedirection();
}

aplicacion.MapControllers();
aplicacion.MapGet("/", () => Results.Redirect("/swagger"));

// Crear/actualizar la base de datos y cargar los datos iniciales.
using (var alcance = aplicacion.Services.CreateScope())
{
    var sembrador = alcance.ServiceProvider.GetRequiredService<SembradorDatos>();
    await sembrador.InicializarAsync();
}

aplicacion.Run();

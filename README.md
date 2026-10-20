# Sistema de Inventarios

Aplicación web para la gestión de proveedores, productos, compras, ventas, notas de crédito y débito, movimientos de inventario, existencias y reportes.

## Tecnologías

- **Frontend:** Next.js 15.5, React 19, TypeScript, Tailwind CSS 4, Recharts.
- **Backend:** ASP.NET Core 8, Entity Framework Core 8, JWT, Swagger.
- **Base de datos:** SQL Server 2022.
- **Autenticación:** JWT almacenado en cookie `httpOnly` (`access_token`).
- **Roles:** Administrador, Inventario, Ventas y Consulta.

## Estructura del repositorio

```text
sistema-inventarios/
├── backend/
│   └── Inventarios.Api/        API REST, migraciones y datos iniciales
├── frontend/                   Aplicación Next.js
├── docs/                       Informe, manual, despliegue y guion del video
├── .gitignore
└── README.md
```

## Requisitos locales

- .NET SDK 8.0
- Node.js 22 y npm
- SQL Server 2022 Developer o Express
- `dotnet-ef` 8 (solo si se regeneran migraciones)

## Puesta en marcha

### 1. Base de datos

La cadena de conexión de desarrollo está en `backend/Inventarios.Api/appsettings.json`:

```json
"Server=localhost;Database=SistemaInventarios;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;"
```

Al iniciar la API se aplican las migraciones y se cargan los datos iniciales automáticamente.

### 2. Backend

```powershell
cd backend/Inventarios.Api
dotnet restore
dotnet run --urls http://localhost:5279
```

API: `http://localhost:5279`  
Swagger: `http://localhost:5279/swagger`

### 3. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Aplicación: `http://localhost:3000`

### 4. Compilación de producción

```powershell
cd frontend
npm run build
npm run start
```

```powershell
cd backend/Inventarios.Api
dotnet publish -c Release -o publish
```

## Usuarios de demostración

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `bodega` | `Inventario123!` | Inventario |
| `vendedor` | `Ventas123!` | Ventas |
| `consulta` | `Consulta123!` | Consulta |

> Cambie estas contraseñas antes de publicar el sistema en internet.

## Documentación

- [Contexto consolidado del proyecto](CONTEXTO.md)
- [Informe del proyecto](docs/informe.md)
- [Informe en PDF](docs/informe.pdf)
- [Manual de usuario](docs/manual-usuario.md)
- [Guía de despliegue](docs/despliegue.md)
- [Guion del video](docs/guion-video.md)
- [Matriz de pruebas](docs/pruebas.md)
- [Checklist de entrega](docs/checklist-entrega.md)

## Variables de producción

En el backend:

```text
ConnectionStrings__Inventarios=...
Jwt__Key=...
Jwt__Issuer=SistemaInventarios.Api
Jwt__Audience=SistemaInventarios.Web
Jwt__MinutosExpiracion=480
Auth__CookieSegura=true
Cors__Origenes__0=https://<dominio-frontend>
ASPNETCORE_ENVIRONMENT=Production
```

En Vercel:

```text
API_URL=https://<dominio-backend>
```

## Estado del proyecto

- Backend y base de datos funcionales.
- Frontend con todos los módulos y compilación de producción correcta.
- Pruebas de integración de compras, ventas, notas y ajustes completadas.
- Pendiente: publicar el repositorio, desplegar en Vercel/MonsterASP.NET, completar nombres de integrantes y grabar el video.

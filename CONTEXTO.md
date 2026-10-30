# Contexto del proyecto — Sistema de Inventarios

> Documento de referencia para continuar el desarrollo, la documentación, el despliegue y la grabación del video.  
> Última actualización: 20 de octubre de 2026.

## 1. Resumen ejecutivo

**Sistema de Inventarios** es una aplicación web para pequeñas y medianas empresas que centraliza proveedores, productos, compras, ventas, notas de crédito y débito, movimientos de entrada/salida, existencias, reportes y parámetros del sistema.

El proyecto tiene tres partes:

1. **Backend:** API REST en ASP.NET Core 8 con Entity Framework Core y SQL Server 2022.
2. **Frontend:** aplicación Next.js 15 con React 19, TypeScript y Tailwind CSS 4.
3. **Documentación:** informe académico, manual de usuario, guía de despliegue, pruebas y checklist de entrega.

El sistema funciona localmente y está listo para publicarse. La publicación en internet, el repositorio remoto y el video quedaron pendientes de datos externos: cuentas de hosting, usuario de GitHub y nombres definitivos de los integrantes.

## 2. Objetivo y entrega académica

- **Misión:** proporcionar a las pymes una herramienta web confiable para controlar sus existencias y operaciones comerciales.
- **Objetivo general:** desarrollar e implementar un sistema que integre catálogos, compras, ventas, notas, movimientos, existencias, seguridad por roles y reportes.
- **Entrega prevista:** 31 de octubre de 2026.
- **Valor:** 15 puntos.
- **Video:** 30 minutos de contenido y hasta 5 minutos de margen, con participación de todos los integrantes.
- **Entregables:** aplicación publicada, informe PDF, video en Google Drive, frontend y backend en GitHub, y enlaces en Canvas.
- **Herramientas asignadas:** Next.js, ASP.NET Core y SQL Server.

## 3. Estado actual

### Completado

- Backend compilado con **0 errores y 0 advertencias**.
- Frontend compilado con **22 rutas** y sin errores de ESLint.
- Publicación del backend en modo Release verificada con `dotnet publish`.
- Base de datos `SistemaInventarios` creada y actualizada con la migración inicial.
- Datos demo cargados y operaciones de ejemplo disponibles.
- Login, cookie JWT, cierre de sesión y autorización por roles funcionando.
- CRUD de productos, categorías, proveedores, clientes y usuarios.
- Compras, ventas, notas de crédito/débito, movimientos y existencias.
- Anulaciones con reversión de inventario.
- Reportes, exportación CSV e impresión.
- Parámetros configurables y validación de valores críticos.
- Protección de rutas por rol en el frontend.
- Interfaz validada con Edge automatizado en las rutas principales, formularios, vistas de detalle y vista móvil.
- Documentación completa, incluyendo informe PDF de 28 páginas.
- Repositorio Git local inicializado en la rama `main`.

### Pendiente

- Crear y publicar el repositorio remoto en GitHub.
- Publicar el backend en MonsterASP.NET o en el hosting definitivo.
- Publicar el frontend en Vercel con `API_URL` apuntando al backend público.
- Completar nombres, cédulas, porcentajes, docente, asignatura y sección.
- Grabar el video y subir informe/video a Google Drive.
- Publicar los enlaces en Canvas.

## 4. Alcance funcional

### Incluido

- Seguridad: login, logout, sesión, roles y cambio de contraseña.
- Catálogos: productos, categorías, proveedores y clientes.
- Compras: registro, detalle, impresión, anulación y costo promedio.
- Ventas: registro, validación de stock, descuentos, impuesto, impresión y anulación.
- Notas de crédito: devolución de inventario y reducción del saldo de la venta.
- Notas de débito: cargo adicional y salida de inventario.
- Movimientos: entradas, salidas, ajustes, filtros, resumen y CSV.
- Existencias: valorización, bajo mínimo, kardex y CSV.
- Reportes: resumen, ventas, compras, notas, top de productos y bajo mínimo.
- Parámetros: empresa, impuesto, moneda, inventario, prefijos y sesión.
- Usuarios: creación, roles, activación/desactivación y restablecimiento de contraseña.
- Bitácora de acciones.

### No incluido

- Contabilidad general.
- Facturación electrónica fiscal.
- Múltiples almacenes o sucursales.
- Inventario por lotes o fechas de vencimiento.
- Pagos en línea.
- Nómina, activos fijos o cuentas por pagar/cobrar.

## 5. Tecnologías y versiones

| Componente | Versión / decisión |
|---|---|
| Backend | ASP.NET Core 8 (`net8.0`) |
| SDK .NET | 8.0.426 |
| Entity Framework Core | 8.0.10 |
| `dotnet-ef` | 8.0.8 |
| Base de datos | SQL Server 2022 Developer |
| Frontend | Next.js 15.5.28 |
| React | 19.1 |
| Lenguaje frontend | TypeScript |
| Estilos | Tailwind CSS 4 |
| Gráficos | Recharts |
| Autenticación | JWT en cookie `httpOnly` |
| Documentación | Markdown + Mermaid + PDF |
| Node.js | 22.14.0 |
| npm | 10.9.2 |

## 6. Arquitectura

```text
Navegador
   │ HTTPS
   ▼
Frontend Next.js (Vercel o localhost:3000)
   │ rewrite /api/*
   ▼
API ASP.NET Core 8 (MonsterASP.NET o localhost:5279)
   │ Entity Framework Core
   ▼
SQL Server 2022 (SistemaInventarios)
```

- El navegador llama a `/api/*` en el mismo origen del frontend.
- Next.js reescribe esas solicitudes al backend definido en `API_URL`.
- El backend emite el JWT en la cookie `access_token`.
- La cookie es `httpOnly` y `SameSite=Lax`; `Secure` se controla con `Auth:CookieSegura`.
- La autorización real se aplica en la API. El frontend oculta opciones y muestra una pantalla de acceso restringido si se escribe una ruta no permitida.

## 7. Estructura del repositorio

```text
sistema_inventarios/
├── backend/
│   └── Inventarios.Api/
│       ├── Controladores/
│       ├── Datos/
│       ├── DTOs/
│       ├── Entidades/
│       ├── Migraciones/
│       ├── Seguridad/
│       ├── Servicios/
│       ├── appsettings.json
│       ├── Inventarios.Api.csproj
│       └── Program.cs
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── .env.example
│   ├── next.config.ts
│   └── package.json
├── docs/
│   ├── informe.md
│   ├── informe.pdf
│   ├── manual-usuario.md
│   ├── despliegue.md
│   ├── pruebas.md
│   ├── checklist-entrega.md
│   ├── generar-informe.py
│   └── README.md
├── .gitignore
├── CONTEXTO.md
└── README.md
```

## 8. Seguridad y roles

| Rol | Permisos principales |
|---|---|
| **Administrador** | Acceso completo; anulaciones; parámetros; usuarios; todos los reportes. |
| **Inventario** | Productos, categorías, proveedores, compras, movimientos, existencias, ajustes y reportes. |
| **Ventas** | Clientes, ventas, notas, existencias y reportes. |
| **Consulta** | Solo lectura de productos, movimientos, existencias, reportes y perfil. |

- El menú lateral se filtra por rol.
- Las rutas restringidas muestran una pantalla de “Acceso restringido”.
- La API responde `403` cuando el rol no tiene permiso, aunque se llame directamente.
- La sesión se configura con el parámetro `Sesion.MinutosExpiracion` (5–43200 minutos; valor demo: 480).
- La clave JWT de producción debe ser distinta y tener al menos 64 caracteres.

### Credenciales demo

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `bodega` | `Inventario123!` | Inventario |
| `vendedor` | `Ventas123!` | Ventas |
| `consulta` | `Consulta123!` | Consulta |

> Cambiar estas contraseñas antes de publicar el sistema.

## 9. Reglas de negocio clave

- Los códigos de productos, proveedores y clientes son únicos.
- Los registros con historial se inactivan; no se eliminan.
- La existencia actual no se edita a mano: cambia por compras, ventas, notas y ajustes.
- Las compras aumentan el stock y recalculan el costo promedio.
- Las ventas descuentan el stock y respetan la existencia disponible, salvo que se permita stock negativo.
- Las notas de crédito devuelven stock y reducen el crédito disponible de la venta.
- Las notas de débito descuentan stock y aumentan el saldo de la venta.
- El crédito acumulado no puede superar el total de la venta.
- Solo el Administrador puede anular documentos.
- La anulación revierte el inventario y conserva el documento y su historial.
- La numeración usa prefijos y secuencias configurables.
- El impuesto es configurable; el 12 % de IVA es solo el valor inicial de demostración.
- Los cambios de impuesto, moneda o prefijos aplican a documentos nuevos; los históricos conservan sus valores.
- Cada movimiento guarda saldo anterior, saldo nuevo, costo, usuario, fecha, origen y documento.

## 10. Base de datos y datos demo

- Instancia local: `localhost`.
- Base de datos: `SistemaInventarios`.
- Migración inicial: `20261020054853_Inicial`.
- La API aplica migraciones y carga datos iniciales al arrancar.
- El sembrador de operaciones demo solo se ejecuta si no existen compras ni ventas.
- Si `Moneda.Codigo` es `USD`, el sembrador convierte una sola vez los importes a GTQ (tasa 7.80), actualiza los parámetros y los datos demo de Guatemala, y deja el código en `GTQ`; la operación es idempotente.

Estado actual de la base:

| Entidad | Cantidad |
|---|---:|
| Productos | 12 |
| Proveedores | 3 |
| Clientes | 4 |
| Usuarios | 4 |
| Roles | 4 |
| Ventas | 8 |
| Compras | 2 |
| Notas de ajuste | 0 |
| Movimientos de inventario | 38 |

Parámetros relevantes:

- `Sesion.MinutosExpiracion = 480`.
- `Impuesto.Porcentaje = 12` (valor inicial configurable).
- Moneda: GTQ (quetzales).
- Prefijos de documentos configurables.

## 11. Configuración local

### Backend

Archivo: `backend/Inventarios.Api/appsettings.json`.

- Cadena de desarrollo: `Server=localhost;Database=SistemaInventarios;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;`
- API: `http://localhost:5279`.
- Swagger: `http://localhost:5279/swagger`.
- Cookie segura: `false` en desarrollo.
- CORS: `http://localhost:3000` y `http://localhost:3001`.

### Frontend

Archivo: `frontend/.env.local`.

```text
API_URL=http://localhost:5279
```

Frontend local: `http://localhost:3000`.

## 12. Comandos útiles

### Backend

```powershell
cd backend/Inventarios.Api
dotnet restore
dotnet build
dotnet run --urls http://localhost:5279
```

Publicación:

```powershell
dotnet publish -c Release -o ./publish
```

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Producción:

```powershell
npm run build
npm run start
```

### Base de datos

```powershell
cd backend/Inventarios.Api
dotnet ef database update
```

### Documentación PDF

```powershell
python -m pip install markdown
python docs/generar-informe.py
```

Luego imprimir `docs/informe.html` a PDF con Edge en modo headless. El comando exacto está en `docs/README.md`.

## 13. Rutas principales del frontend

| Ruta | Módulo |
|---|---|
| `/login` | Inicio de sesión |
| `/` | Panel de control |
| `/productos` | Productos |
| `/categorias` | Categorías |
| `/proveedores` | Proveedores |
| `/clientes` | Clientes |
| `/compras` | Listado de compras |
| `/compras/nueva` | Registrar compra |
| `/compras/[id]` | Detalle de compra |
| `/ventas` | Listado de ventas |
| `/ventas/nueva` | Registrar venta |
| `/ventas/[id]` | Detalle de venta |
| `/notas` | Notas de crédito y débito |
| `/notas/nueva` | Registrar nota |
| `/notas/[id]` | Detalle de nota |
| `/movimientos` | Movimientos de inventario |
| `/existencias` | Existencias y kardex |
| `/reportes` | Reportes |
| `/parametros` | Parámetros del sistema |
| `/usuarios` | Usuarios y roles |
| `/perfil` | Perfil y cambio de contraseña |

## 14. Grupos de endpoints de la API

- `/api/health`
- `/api/auth` — login, logout, sesión actual y cambio de contraseña.
- `/api/dashboard`
- `/api/productos`
- `/api/categorias`
- `/api/proveedores`
- `/api/clientes`
- `/api/compras`
- `/api/ventas`
- `/api/notas`
- `/api/movimientos`
- `/api/existencias`
- `/api/reportes`
- `/api/parametros`
- `/api/usuarios`
- `/api/roles`

La documentación interactiva está en Swagger.

## 15. Documentación y pruebas

| Documento | Contenido |
|---|---|
| `docs/informe.md` | Informe académico completo con Mermaid. |
| `docs/informe.pdf` | Versión imprimible de 28 páginas. |
| `docs/manual-usuario.md` | Uso paso a paso de cada módulo. |
| `docs/despliegue.md` | Instalación local, GitHub, MonsterASP.NET y Vercel. |
| `docs/pruebas.md` | Matriz de pruebas técnicas, funcionales y pendientes. |
| `docs/checklist-entrega.md` | Control de requisitos y entregables. |
| `docs/generar-informe.py` | Generador del HTML imprimible del informe. |
| `COMO-EJECUTAR.md` | Guía paso a paso para arrancar, verificar y resolver problemas locales. |

Pruebas ejecutadas:

- Compilación backend y frontend.
- Publicación Release del backend.
- Migración y siembra de base de datos.
- Login, logout y sesión con los cuatro roles.
- Restricciones `403` en la API.
- Duración de sesión configurable: token de 10 minutos y restauración a 480.
- Validación de parámetros inválidos: respuesta `400`.
- Compra, venta, nota y ajuste con reversión de stock.
- Rutas principales del frontend: 9 rutas con `200` y sin errores de consola.
- Formularios de compra, venta y nota; cálculos de subtotal, impuesto y total.
- Rutas de detalle `/ventas/[id]` y `/compras/[id]`.
- Vista móvil a 390 × 844.
- Datos demo restaurados después de las pruebas.

## 16. Git y repositorio

- Repositorio local inicializado en la raíz.
- Rama actual: `main`.
- El árbol de trabajo debe quedar limpio después de cada cambio.
- No hay repositorio remoto configurado todavía.
- `.gitignore` excluye `node_modules/`, `.next/`, `bin/`, `obj/`, `publish/`, archivos `.env`, secretos de producción, logs, respaldos y `docs/informe.html`.
- `docs/informe.pdf` sí se versiona porque es un entregable.
- La CLI de GitHub (`gh`) no está instalada/autenticada en esta máquina.
- La CLI de Vercel está autenticada como `ludgmors`, en el espacio `ludwing-morales-s-projects`.

## 17. Despliegue previsto

### Backend en MonsterASP.NET

Variables de producción:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__Inventarios=Server=<servidor>;Database=<base>;User Id=<usuario>;Password=<clave>;Encrypt=True;TrustServerCertificate=False;
Jwt__Key=<clave aleatoria de al menos 64 caracteres>
Jwt__Issuer=SistemaInventarios.Api
Jwt__Audience=SistemaInventarios.Web
Jwt__MinutosExpiracion=480
Auth__CookieSegura=true
Cors__Origenes__0=https://<dominio-frontend>
```

Notas:

- En producción usar autenticación SQL, no `Trusted_Connection`.
- `dotnet publish` genera `web.config` para IIS.
- La API aplica migraciones al arrancar; si el usuario SQL no tiene permisos de `ALTER`, aplicar la migración con un usuario administrador antes de publicar.
- Verificar `https://<backend>/api/health`.

### Frontend en Vercel

- **Root Directory:** `frontend`.
- **Framework:** Next.js.
- **Build Command:** `npm run build`.
- Variable de entorno:

```text
API_URL=https://<dominio-backend>
```

- Después de cambiar `API_URL`, volver a desplegar.

## 18. Bloqueos y datos que faltan

1. Nombres completos, cédulas y porcentajes reales de participación.
2. Nombre del docente, asignatura y sección.
3. Usuario de GitHub y decisión de repositorio público o privado.
4. Cuenta/plan de MonsterASP.NET, URL pública del backend y credenciales de la base SQL.
5. Fecha de grabación del video.
6. Enlaces de Google Drive y Canvas.

## 19. Próximos pasos recomendados

1. Completar los datos de los integrantes en `docs/informe.md` y regenerar el PDF.
2. Crear el repositorio remoto, subir `main` y verificar que no se publiquen secretos.
3. Publicar el backend y probar `/api/health`, login y Swagger.
4. Configurar `API_URL` en Vercel y desplegar el frontend.
5. Probar en producción: login con los cuatro roles, compra, venta, nota, anulación, impresión y CSV.
6. Actualizar enlaces en el informe, README, checklist y Canvas.
7. Subir informe y video a Google Drive y entregar los enlaces.

## 20. Notas técnicas y problemas conocidos

- **PowerShell 5.1 y acentos:** al enviar JSON, puede corromper caracteres. Usar `curl.exe` con `--data-binary` y un archivo UTF-8 sin BOM, no `ConvertTo-Json | curl -d`.
- **Bloqueo de compilación:** si la API está ejecutándose, el `.exe` queda bloqueado. Detener el proceso antes de `dotnet build`.
- **Reinicio:** después de compilar el backend o el frontend, reiniciar el servidor para usar el binario nuevo.
- **Fechas:** el frontend usa `es-MX` para mostrar `DD/MM/AAAA`; la moneda usa `es-GT` y GTQ.
- **Mermaid en PDF:** el generador carga Mermaid desde jsDelivr. Sin conexión, usar una copia local o exportar los diagramas por separado.
- **Informe HTML:** `docs/informe.html` es un archivo generado y está ignorado por Git. El PDF sí se versiona.
- **Datos demo:** no ejecutar procesos de limpieza o reseed sin respaldar; el sembrador de operaciones solo corre si no hay compras ni ventas.
- **Autorización:** la protección de rutas del frontend es de experiencia de usuario; la seguridad real la aplica la API.
- **Cookie:** `access_token` es `httpOnly`; no intentar leerla desde JavaScript.
- **Impuesto:** no hardcodear 12 %; usar el parámetro `Impuesto.Porcentaje`.
- **Sesión:** la duración se toma de `Sesion.MinutosExpiracion`; si no existe, usa `Jwt:MinutosExpiracion` y limita el rango a 5–43200 minutos.

## 21. Criterio de finalización

El proyecto se considera listo para entregar cuando:

1. La aplicación publicada permite iniciar sesión y ejecutar compra, venta y nota.
2. El repositorio remoto contiene backend, frontend y documentación.
3. El informe PDF y el video están en Google Drive con permiso de lectura.
4. Los seis enlaces están publicados en Canvas.
5. El video dura al menos 30 minutos y participan todos los integrantes.

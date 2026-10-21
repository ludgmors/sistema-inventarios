# Cómo ejecutar el proyecto — Sistema de Inventarios

Guía paso a paso para ejecutar el sistema en Windows, verificar que funciona y resolver los problemas más comunes.

> Para publicar el sistema en internet, consultar [`docs/despliegue.md`](docs/despliegue.md).

## 1. Resumen rápido

El proyecto necesita **dos terminales abiertas**:

| Terminal | Servicio | Dirección |
|---|---|---|
| 1 | API ASP.NET Core | http://localhost:5279 |
| 2 | Frontend Next.js | http://localhost:3000 |

La base de datos se crea y actualiza automáticamente cuando arranca la API.

```powershell
# Terminal 1 — Backend
cd C:\Users\Ludwi\Downloads\sistema_inventarios\backend\Inventarios.Api
dotnet run --urls http://localhost:5279
```

```powershell
# Terminal 2 — Frontend
cd C:\Users\Ludwi\Downloads\sistema_inventarios\frontend
Copy-Item .env.example .env.local -Force
npm install
npm run dev
```

Luego abrir http://localhost:3000 e iniciar sesión con `admin` / `Admin123!`.

### 1.1. Si un compañero descarga el proyecto

El repositorio incluye el código y la documentación, pero **no incluye** la base de datos, `node_modules`, `bin`, `obj` ni `.env.local`. Cada persona debe preparar su entorno y generar su propia base local.

Requisitos: los mismos de la sección 2. En resumen: Windows 10 u 11, .NET SDK 8, Node.js 22 y SQL Server 2022 Developer o Express.

Pasos:

1. Clonar el repositorio:

   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd sistema_inventarios
   ```

   Si el repositorio es privado, primero deben agregar a los compañeros como colaboradores.

2. Iniciar SQL Server y verificar la conexión:

   ```powershell
   Get-Service MSSQLSERVER
   sqlcmd -S localhost -E -C -Q "SELECT @@VERSION"
   ```

   Si usan SQL Server Express, la instancia suele ser `localhost\SQLEXPRESS` y deben ajustar la cadena de conexión en `backend/Inventarios.Api/appsettings.json`.

3. Ejecutar el backend:

   ```powershell
   cd backend\Inventarios.Api
   dotnet restore
   dotnet run --urls http://localhost:5279
   ```

   La API crea la base `SistemaInventarios`, aplica las migraciones y carga los datos demo automáticamente. El usuario de Windows debe tener permisos para crear bases de datos en su SQL Server.

4. Ejecutar el frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm install
   npm run dev
   ```

5. Abrir `http://localhost:3000` e iniciar sesión con `admin` / `Admin123!`.

Notas:

- Cada compañero tendrá una base nueva con los datos demo en quetzales; no verá las ventas o compras que existan en el equipo de otra persona. Si necesitan exactamente los mismos datos, se puede compartir un respaldo `.bak` y restaurarlo con los pasos de la sección 11.
- En macOS o Linux se puede ejecutar .NET y Node, pero SQL Server no está disponible de forma nativa. En ese caso se necesitaría SQL Server en Docker o un servidor remoto y ajustar la cadena de conexión. Esta guía está probada en Windows.
- No subir al repositorio `.env.local`, `node_modules`, `bin`, `obj` ni respaldos `.bak`.

---

## 2. Requisitos

| Herramienta | Versión recomendada |
|---|---|
| Windows | 10 u 11 |
| .NET SDK | 8.0 |
| Node.js | 22 |
| npm | Incluido con Node.js |
| SQL Server | 2022 Developer o Express |
| Git | Opcional, para clonar y versionar |
| `dotnet-ef` | 8.0.8, solo para administrar migraciones |

Comprobar las instalaciones:

```powershell
dotnet --version
node --version
npm --version
```

Resultados esperados aproximados:

```text
8.0.426
v22.14.0
10.9.2
```

Comprobar que SQL Server está instalado:

```powershell
Get-Service *SQL*
```

La instancia predeterminada suele llamarse `MSSQLSERVER`. Si se usa SQL Server Express, puede llamarse `MSSQL$SQLEXPRESS`.

---

## 3. Estructura relevante

```text
sistema_inventarios/
├── backend/
│   └── Inventarios.Api/
│       ├── appsettings.json      Configuración local
│       ├── Program.cs            Arranque, JWT, CORS y Swagger
│       ├── Migraciones/          Estructura de la base de datos
│       └── Datos/                Datos iniciales
├── frontend/
│   ├── .env.example              Plantilla de configuración
│   ├── next.config.ts            Rewrite /api/* hacia el backend
│   └── package.json              Scripts de Next.js
├── docs/                         Informe, manual y despliegue
├── COMO-EJECUTAR.md              Esta guía
└── README.md
```

---

## 4. Preparar SQL Server

### 4.1. Iniciar el servicio

```powershell
Get-Service MSSQLSERVER
```

Si está detenido, abrir PowerShell como administrador y ejecutar:

```powershell
Start-Service MSSQLSERVER
```

Para una instancia Express:

```powershell
Start-Service 'MSSQL$SQLEXPRESS'
```

### 4.2. Verificar la conexión

```powershell
sqlcmd -S localhost -E -C -Q "SELECT @@VERSION"
```

Si `sqlcmd` no está disponible, se puede usar SQL Server Management Studio (SSMS) para conectarse a `localhost` con autenticación de Windows.

### 4.3. Cadena de conexión

La configuración local está en `backend/Inventarios.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "Inventarios": "Server=localhost;Database=SistemaInventarios;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;"
}
```

- `localhost` usa la instancia predeterminada y autenticación de Windows.
- Si la instancia es Express, cambiar por `Server=localhost\\SQLEXPRESS;...`.
- Si se usa usuario y contraseña de SQL Server, reemplazar `Trusted_Connection=True` por `User Id=...;Password=...;`.
- No es necesario crear la base `SistemaInventarios` manualmente. La API la crea al arrancar.

Al iniciar la API se ejecutan las migraciones y se cargan los datos iniciales si la base está vacía.

---

## 5. Ejecutar el backend

Abrir la primera terminal:

```powershell
cd C:\Users\Ludwi\Downloads\sistema_inventarios\backend\Inventarios.Api
dotnet restore
dotnet build
dotnet run --urls http://localhost:5279
```

Mantener la terminal abierta. La API está lista cuando aparece un mensaje similar a:

```text
Now listening on: http://localhost:5279
Application started. Press Ctrl+C to shut down.
```

### 5.1. Verificar la API

En otra terminal:

```powershell
curl.exe http://localhost:5279/api/health
```

Respuesta esperada:

```json
{"estado":"correcto"}
```

Abrir Swagger:

```text
http://localhost:5279/swagger
```

### 5.2. Si la API no arranca

- Verificar que SQL Server esté iniciado.
- Revisar que el puerto `5279` no esté ocupado.
- Leer el error de conexión que aparece en la terminal.
- Si se cambió la cadena de conexión, confirmar el nombre de la instancia y las credenciales.

---

## 6. Ejecutar el frontend

Abrir la segunda terminal:

```powershell
cd C:\Users\Ludwi\Downloads\sistema_inventarios\frontend
Copy-Item .env.example .env.local -Force
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000
```

### 6.1. Variable `API_URL`

El archivo `frontend/.env.local` debe contener:

```text
API_URL=http://localhost:5279
```

Next.js reescribe las solicitudes del navegador:

```text
Navegador → http://localhost:3000/api/... → http://localhost:5279/api/...
```

Por eso el navegador no necesita llamar directamente a la API y no hay problemas de CORS en el uso normal.

Si se cambia `API_URL`, reiniciar el frontend para que Next.js vuelva a cargar la configuración.

> `.env.local` es un archivo local y está ignorado por Git. No se debe subir al repositorio.

### 6.2. Instalación limpia

Si se clonó el proyecto y existe `package-lock.json`, se puede usar:

```powershell
npm ci
```

Si hay problemas con dependencias, eliminar `node_modules` y reinstalar:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 7. Primer inicio de sesión

Abrir http://localhost:3000/login y usar una de estas cuentas:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `bodega` | `Inventario123!` | Inventario |
| `vendedor` | `Ventas123!` | Ventas |
| `consulta` | `Consulta123!` | Consulta |

Recomendaciones:

- Usar `admin` para la primera prueba.
- Cambiar las contraseñas antes de publicar el sistema.
- No usar estas credenciales en producción.

---

## 8. Verificación mínima

Después de iniciar sesión con `admin`, comprobar:

- [ ] El panel de control muestra indicadores y gráficos.
- [ ] **Productos** lista los productos activos.
- [ ] **Existencias** muestra la existencia y el valor del inventario.
- [ ] **Compras** permite abrir el formulario de nueva compra.
- [ ] **Ventas** permite abrir el formulario de nueva venta.
- [ ] **Movimientos** muestra entradas y salidas.
- [ ] **Reportes** carga el resumen y permite cambiar fechas.
- [ ] **Parámetros** muestra la configuración del sistema.
- [ ] **Mi perfil** permite cambiar la contraseña.
- [ ] Al cerrar sesión, una ruta protegida redirige a `/login`.

### Prueba funcional recomendada

1. Anotar la existencia de un producto en **Productos**.
2. Registrar una compra de 1 unidad.
3. Verificar que la existencia aumente y aparezca una entrada en **Movimientos**.
4. Registrar una venta de 1 unidad.
5. Verificar que la existencia disminuya y aparezca una salida.
6. Crear una nota de crédito desde el detalle de la venta.
7. Verificar que el stock aumente y el crédito disponible disminuya.
8. Revisar el movimiento y el reporte correspondiente.

> Las compras, ventas y notas no se eliminan: solo se anulan. Antes de hacer pruebas de escritura, respaldar la base de datos.

La matriz completa está en [`docs/pruebas.md`](docs/pruebas.md) y los flujos de uso en [`docs/manual-usuario.md`](docs/manual-usuario.md).

---

## 9. Detener y volver a iniciar

Para detener cada servicio, presionar `Ctrl+C` en su terminal.

Para volver a iniciar:

```powershell
# Terminal 1
cd backend\Inventarios.Api
dotnet run --urls http://localhost:5279
```

```powershell
# Terminal 2
cd frontend
npm run dev
```

No es necesario reinstalar dependencias cada vez.

---

## 10. Compilación de producción

### Backend

```powershell
cd backend\Inventarios.Api
dotnet publish -c Release -o ./publish
```

El resultado queda en `backend/Inventarios.Api/publish/`. En IIS o MonsterASP.NET se publica esa carpeta y se usa `web.config`.

### Frontend

```powershell
cd frontend
npm run build
npm run start
```

La compilación de producción debe terminar sin errores. Si se cambia `API_URL`, volver a compilar antes de desplegar.

Para publicar en Vercel y MonsterASP.NET, seguir [`docs/despliegue.md`](docs/despliegue.md).

---

## 11. Copia de seguridad y restauración

### Crear un respaldo

Con la API detenida o sin operaciones en curso:

```powershell
sqlcmd -S localhost -E -C -Q "BACKUP DATABASE SistemaInventarios TO DISK='C:\Users\Ludwi\Downloads\SistemaInventarios_respaldo.bak' WITH INIT"
```

### Restaurar un respaldo

> Esto reemplaza todos los datos actuales. Detener primero la API.

```powershell
sqlcmd -S localhost -E -C -Q "ALTER DATABASE SistemaInventarios SET SINGLE_USER WITH ROLLBACK IMMEDIATE"
sqlcmd -S localhost -E -C -Q "RESTORE DATABASE SistemaInventarios FROM DISK='C:\Users\Ludwi\Downloads\SistemaInventarios_respaldo.bak' WITH REPLACE"
sqlcmd -S localhost -E -C -Q "ALTER DATABASE SistemaInventarios SET MULTI_USER"
```

### Reiniciar la base con datos demo

> Solo si se quiere borrar todo y volver a empezar. Requiere `dotnet-ef`.

```powershell
dotnet tool install --global dotnet-ef --version 8.0.8
cd backend\Inventarios.Api
dotnet ef database drop -f
dotnet run --urls http://localhost:5279
```

Al arrancar, la API vuelve a aplicar las migraciones y carga los datos iniciales.

---

## 12. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| La página abre, pero el login falla | La API no está corriendo o `API_URL` es incorrecta | Verificar `http://localhost:5279/api/health`, revisar `.env.local` y reiniciar el frontend |
| `ERR_CONNECTION_REFUSED` en `/api` | Backend detenido o puerto equivocado | Iniciar la API en `5279` o corregir `API_URL` |
| Error de conexión a SQL Server | Servicio detenido, instancia incorrecta o autenticación inválida | Iniciar `MSSQLSERVER`, revisar la cadena de conexión y probar con `sqlcmd` |
| La API no compila porque el archivo está en uso | Hay una instancia anterior ejecutándose | Detener la API con `Ctrl+C` o cerrar el proceso y volver a compilar |
| El puerto `5279` está ocupado | Otra API o proceso usa el puerto | Ver la sección de puertos ocupados |
| El puerto `3000` está ocupado | Otro servidor de desarrollo está activo | Detenerlo o ejecutar `npm run dev -- -p 3001` |
| `npm run start` falla | No existe una compilación de producción | Ejecutar `npm run build` primero |
| El login no conserva la sesión | `Auth:CookieSegura` está en `true` sobre HTTP local | En desarrollo debe ser `false`; limpiar cookies y volver a iniciar sesión |
| La sesión expira rápido | `Sesion.MinutosExpiracion` tiene un valor bajo | Revisar el parámetro en **Parámetros** o la configuración JWT |
| Swagger no abre | La API no está iniciada | Abrir `http://localhost:5279/swagger` con la API corriendo |
| El frontend muestra datos antiguos | Caché de compilación | Detener el servidor, borrar `.next` y ejecutar `npm run build` |
| Error de versión de Node | Node distinto de 22 | Instalar Node.js 22 y volver a ejecutar `npm install` |
| La consola muestra `401` | Sesión vencida o cookie ausente | Volver a iniciar sesión |
| La consola muestra `403` | El rol no tiene permiso | Probar con un usuario autorizado; es el comportamiento esperado |

### Liberar un puerto ocupado

```powershell
Get-NetTCPConnection -LocalPort 5279 -State Listen | Select-Object LocalPort, OwningProcess
Stop-Process -Id <PID> -Force
```

Para el puerto `3000`, repetir con `-LocalPort 3000`.

Si se cambia el puerto del backend, también hay que actualizar `API_URL` en `frontend/.env.local` y reiniciar el frontend.

---

## 13. Comandos útiles

### Backend

```powershell
# Restaurar paquetes
dotnet restore

# Compilar
dotnet build

# Ejecutar en desarrollo
dotnet run --urls http://localhost:5279

# Aplicar migraciones manualmente
dotnet ef database update

# Publicar
dotnet publish -c Release -o ./publish
```

### Frontend

```powershell
# Instalar dependencias
npm install

# Desarrollo con Turbopack
npm run dev

# Revisar reglas de ESLint
npm run lint

# Compilar producción
npm run build

# Ejecutar la compilación
npm run start
```

### Verificaciones rápidas

```powershell
curl.exe http://localhost:5279/api/health
curl.exe -I http://localhost:3000
```

---

## 14. Documentación relacionada

- [`README.md`](README.md) — Presentación e instalación resumida.
- [`CONTEXTO.md`](CONTEXTO.md) — Contexto consolidado, arquitectura y pendientes.
- [`docs/manual-usuario.md`](docs/manual-usuario.md) — Uso de cada módulo.
- [`docs/pruebas.md`](docs/pruebas.md) — Matriz de pruebas y resultados.
- [`docs/despliegue.md`](docs/despliegue.md) — Publicación en GitHub, MonsterASP.NET y Vercel.
- [`docs/guion-video.md`](docs/guion-video.md) — Guion para la demostración en video.

---

## 15. Lista de comprobación final

- [ ] SQL Server iniciado.
- [ ] Backend ejecutándose en `http://localhost:5279`.
- [ ] `http://localhost:5279/api/health` responde correctamente.
- [ ] `frontend/.env.local` contiene `API_URL=http://localhost:5279`.
- [ ] Frontend ejecutándose en `http://localhost:3000`.
- [ ] Login con `admin` funciona.
- [ ] Panel, productos y existencias cargan.
- [ ] Compra y venta actualizan el inventario.
- [ ] Movimientos y reportes muestran la información.
- [ ] Los roles restringen las rutas correctamente.
- [ ] La compilación de producción termina sin errores.

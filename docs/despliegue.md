# Guía de instalación y despliegue

## 1. Arquitectura de despliegue

```text
Navegador
   │ HTTPS
   ▼
Vercel (Next.js)
   │ rewrite /api/*
   ▼
MonsterASP.NET (ASP.NET Core 8)
   │ conexión SQL
   ▼
SQL Server (base SistemaInventarios)
```

El navegador accede al frontend. Las llamadas a `/api/*` se reescriben al backend configurado en `API_URL`. La cookie `access_token` se emite en el dominio del frontend, viaja al backend por el rewrite y se mantiene `httpOnly`.

---

## 2. Requisitos

### Desarrollo

- .NET SDK 8.0.
- Node.js 22 y npm 10.
- SQL Server 2022 Developer/Express.
- Git.
- `dotnet-ef` 8 si se regeneran migraciones:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.8
```

### Producción

- Repositorio en GitHub.
- Cuenta en Vercel.
- Cuenta en MonsterASP.NET con plan compatible con .NET 8.
- Base de datos SQL Server en MonsterASP.NET o en un servidor accesible.
- Dominios o subdominios HTTPS.

---

## 3. Ejecución local

### 3.1 Clonar el repositorio

```powershell
git clone https://github.com/<usuario>/sistema-inventarios.git
cd sistema-inventarios
```

### 3.2 Base de datos

La API aplica las migraciones automáticamente al iniciar. La cadena de desarrollo está en `backend/Inventarios.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "Inventarios": "Server=localhost;Database=SistemaInventarios;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;"
}
```

Si se desea aplicar la migración manualmente:

```powershell
cd backend/Inventarios.Api
dotnet ef database update
```

Si se modifica el modelo:

```powershell
dotnet ef migrations add NombreDeLaMigracion
dotnet ef database update
```

### 3.3 Backend

```powershell
cd backend/Inventarios.Api
dotnet restore
dotnet run --urls http://localhost:5279
```

Comprobar:

- `http://localhost:5279/api/health`
- `http://localhost:5279/swagger`

### 3.4 Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Contenido de `.env.local`:

```text
API_URL=http://localhost:5279
```

Abrir `http://localhost:3000`.

### 3.5 Compilación de producción

```powershell
cd backend/Inventarios.Api
dotnet publish -c Release -o ./publish

cd ../../frontend
npm run build
npm run start
```

---

## 4. Publicación del repositorio en GitHub

1. Crear un repositorio llamado `sistema-inventarios`.
2. Desde la raíz del proyecto:

```powershell
git init
git add .
git commit -m "Sistema de Inventarios: backend, frontend y documentación"
git branch -M main
git remote add origin https://github.com/<usuario>/sistema-inventarios.git
git push -u origin main
```

3. Verificar que no se publiquen:

- `node_modules/`;
- `.next/`;
- `bin/` y `obj/`;
- archivos `.env`;
- cadenas de conexión y claves reales de producción.

El archivo `.gitignore` de la raíz ya excluye estos elementos.

---

## 5. Publicación del backend en MonsterASP.NET

### 5.1 Crear el sitio

1. Crear un sitio ASP.NET Core con runtime **.NET 8**.
2. Habilitar HTTPS.
3. Crear la base de datos SQL Server desde el panel del hosting.
4. Anotar:
   - nombre del servidor;
   - nombre de la base;
   - usuario;
   - contraseña;
   - puerto si aplica.

### 5.2 Publicar

Opción A: publicación por archivo ZIP o Web Deploy desde Visual Studio.

Opción B: publicación desde consola:

```powershell
cd backend/Inventarios.Api
dotnet publish -c Release -o ./publish
```

Subir el contenido de `publish/` al directorio del sitio.

Opción C: despliegue por Git si el hosting lo permite, apuntando a la carpeta `backend/Inventarios.Api`.

### 5.3 Variables de entorno

Configurar en el panel de MonsterASP.NET:

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

- `Auth__CookieSegura=true` exige HTTPS.
- La clave JWT no debe reutilizar el valor de desarrollo.
- Si el hosting usa IIS, verificar que el sitio tenga habilitado el módulo ASP.NET Core 8.
- La API aplica migraciones al arrancar. En producción, si el usuario de base de datos no tiene permisos de `ALTER`, aplicar las migraciones con un usuario administrador antes de publicar.

### 5.4 Verificación

```text
https://<dominio-backend>/api/health
https://<dominio-backend>/swagger
```

El endpoint de salud debe responder:

```json
{ "estado": "correcto" }
```

---

## 6. Publicación del frontend en Vercel

1. Importar el repositorio de GitHub en Vercel.
2. Configurar:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
3. Agregar la variable de entorno:

```text
API_URL=https://<dominio-backend>
```

4. Desplegar.
5. Verificar que `https://<dominio-frontend>/login` cargue.
6. Probar el inicio de sesión y las llamadas a `/api/*`.

### Consideraciones sobre cookies y rewrites

- El navegador llama a `/api/*` en el dominio del frontend.
- Next.js reescribe la solicitud al backend definido en `API_URL`.
- La cookie se emite sin `Domain`, por lo que queda asociada al dominio del frontend.
- En cada solicitud posterior, el navegador envía la cookie al frontend y el rewrite la reenvía al backend.
- Si se usa un dominio personalizado, actualizar `Cors__Origenes__0` y volver a probar el login.

---

## 7. Configuración de la base de datos

### 7.1 Creación

La migración `20261020054853_Inicial` crea las tablas, índices y relaciones. Al iniciar la API se ejecuta `Database.MigrateAsync()` y luego el sembrador de datos.

### 7.2 Datos iniciales

El sembrador crea:

- cuatro roles;
- cuatro usuarios de demostración;
- parámetros del sistema;
- secuencias documentales;
- categorías, proveedores, clientes y productos;
- operaciones demo si no existen compras ni ventas.

**Importante:** en un entorno real, cambiar las contraseñas de demostración y evaluar si se desea conservar las operaciones demo.

### 7.3 Respaldos

Programar respaldos automáticos desde el panel del hosting. Antes de una actualización:

1. Generar un respaldo completo.
2. Probar la restauración en una base temporal.
3. Documentar la versión de la migración aplicada.

---

## 8. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| La API no inicia | Cadena de conexión incorrecta | Revisar `ConnectionStrings__Inventarios`. |
| Error de migración | Permisos insuficientes | Aplicar migraciones con un usuario administrador. |
| Login correcto pero las llamadas fallan | `API_URL` incorrecta o backend caído | Verificar la variable y `/api/health`. |
| Cookie no se mantiene | HTTPS o `SameSite` mal configurado | Usar HTTPS y `Auth__CookieSegura=true`. |
| CORS bloquea | Origen no registrado | Agregar el dominio exacto en `Cors__Origenes__0`. |
| El frontend muestra error 500 en `/api/*` | Backend no responde o rewrite mal configurado | Revisar logs de Vercel y del backend. |
| El sitio redirige a HTTP | Proxy sin cabeceras reenviadas | Verificar `UseForwardedHeaders` y HTTPS del hosting. |
| Los cambios de parámetros no aparecen | Caché del navegador o documento histórico | Recargar; recordar que los documentos conservan valores históricos. |

---

## 9. Checklist de publicación

- [ ] Repositorio GitHub actualizado y sin secretos.
- [ ] Base de datos creada y migrada.
- [ ] Backend publicado y `/api/health` responde.
- [ ] Swagger accesible o deshabilitado según la política del curso.
- [ ] Variables de entorno del backend configuradas.
- [ ] `Auth__CookieSegura=true` en producción.
- [ ] Frontend desplegado con `API_URL` correcta.
- [ ] Login probado con los cuatro roles.
- [ ] Compra, venta, nota y ajuste probados en producción.
- [ ] Impresión y CSV probados.
- [ ] Contraseñas demo cambiadas.
- [ ] Enlaces de GitHub, Vercel, MonsterASP y Google Drive agregados al informe y a Canvas.

---

## 10. Enlaces de entrega

| Recurso | Enlace |
|---|---|
| Repositorio GitHub | _[Pendiente]_ |
| Aplicación en Vercel | _[Pendiente]_ |
| API en MonsterASP.NET | _[Pendiente]_ |
| Informe PDF | _[Pendiente]_ |
| Video | _[Pendiente]_ |

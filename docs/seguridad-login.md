# Seguridad del acceso

Implementación del 28 de octubre de 2026. No requiere servicios de pago.

## Acceso y correo

Se puede ingresar con el nombre de usuario o el correo registrado. El nombre de usuario
admite un alias o un correo completo con `@` (hasta 150 caracteres).
No puede coincidir con el usuario o correo de otra cuenta, para evitar ambigüedad al ingresar.
Se aceptan dominios completos como
`persona@empresa.com`, sin listas de proveedores permitidos. La validación comprueba
la sintaxis, no la existencia del buzón ni la identidad de su propietario.
Las cuentas con correos `.local` o dominios reservados necesitan un correo real antes
de ingresar: no tienen una excepción para omitir el segundo paso.

Las contraseñas nuevas requieren 12–100 caracteres. Las anteriores siguen funcionando
para evitar perder el acceso. Se usa el hasher de ASP.NET Core; no se guardan contraseñas
en claro. El JWT viaja en cookie `HttpOnly`, no en la respuesta JSON ni en localStorage.
En producción la cookie es `Secure` aunque se omita `Auth:CookieSegura`.

## Sesiones

El login se completa en dos pasos para todos los usuarios:

1. `POST /api/auth/login` valida la contraseña y envía el código, sin crear sesión ni JWT.
2. `POST /api/auth/verificar-codigo` recibe `desafioId` y un código de seis dígitos.
   Solo entonces se crea la sesión y se emite la cookie `access_token`.

La respuesta inicial incluye únicamente el identificador del desafío, correo oculto,
vencimiento y espera para reenviar. Una cookie `HttpOnly`, `SameSite=Strict` y limitada
a `/api/auth` liga el desafío al navegador que inició el acceso. El código se genera
criptográficamente y se almacena como HMAC-SHA256 usando la clave privada del servidor;
no aparece en respuestas, logs ni en claro en SQL Server.

Cada código dura hasta cinco minutos, permite cinco intentos totales y es de un solo
uso. Las verificaciones se serializan por usuario en SQL Server: dos solicitudes
simultáneas no pueden crear dos sesiones con el mismo desafío. Un cambio de contraseña,
correo, rol o estado invalida el desafío pendiente.

`POST /api/auth/reenviar-codigo` admite el identificador y exige la misma cookie del
navegador. Hay 60 segundos de espera entre envíos y un máximo de tres envíos por cuenta
en 15 minutos, compartido con nuevos logins. Reenviar invalida el código anterior y no
reinicia los intentos; el desafío completo caduca tras 15 minutos. La verificación y
el reenvío comparten además un máximo de 30 solicitudes por IP cada 15 minutos.
Todos esos endpoints requieren CSRF. Si SMTP falla, el acceso falla sin sesión.

La migración `SegundoFactorCorreo` agrega `DesafiosAcceso` y revoca las sesiones
anteriores para exigir el segundo paso en el siguiente acceso. No cambia los correos
de las cuentas. El destinatario es siempre el correo del usuario; el remitente SMTP
se configura de forma independiente. SMTP confirma aceptación del mensaje, no entrega
final ni ubicación fuera de spam.

Cada JWT referencia una sesión persistida en `SesionesAcceso`. Todas las peticiones
autenticadas comprueban revocación, vencimiento, inactividad, credenciales, rol y estado
del usuario. Los JWT emitidos antes de esta migración ya no sirven.

Logout revoca esa sesión. El cambio/restablecimiento de contraseña y la edición de
usuario revocan todas sus sesiones. Los cambios de contraseña/rol/estado también se
contrastan con la base durante la validación. Los tiempos se guardan en UTC.
La duración nueva es el menor valor de `Sesion.MinutosExpiracion` y
`Seguridad.MinutosSesion`; el primer parámetro acepta 5–480 minutos.

Todas las operaciones de escritura, incluido login, requieren el encabezado
`X-CSRF-TOKEN`. Primero se obtiene desde `GET /api/auth/csrf`, conservando su cookie.
El cliente común del frontend lo hace automáticamente. Swagger y clientes externos
deben enviar también cookie y encabezado; ya no se entrega el JWT por JSON.

## Límites de actividad

Se editan en **Parámetros → Seguridad**, solo por administradores. Se validan rangos
y se actualiza la caché del proceso inmediatamente; otros procesos tardan hasta 10 s.

| Parámetro | Inicial | Rango | Ventana / significado |
|---|---:|---:|---|
| `Seguridad.IntentosLogin` | 6 | 3–20 | Intentos por cuenta en 15 minutos; éxito limpia el contador de cuenta |
| `Seguridad.LoginPorIp` | 30 | 10–100 | Todos los intentos por IP en 15 minutos |
| `Seguridad.MinutosBloqueo` | 15 | 1–60 | Bloqueos de login, IP y operaciones |
| `Seguridad.SolicitudesPorMinuto` | 300 | 60–1000 | Solicitudes API por IP, incluidas consultas CSRF |
| `Seguridad.OperacionesPorMinuto` | 30 | 5–120 | Escrituras por usuario, incluso intentos no autorizados |
| `Seguridad.CreacionUsuarios` | 5 | 2–20 | Intentos de creación por administrador en 10 minutos |
| `Seguridad.RecuperacionesPorHora` | 3 | 1–10 | Recuperaciones por correo |
| `Seguridad.MinutosInactividad` | 30 | 5–120 | Inactividad máxima de la sesión |
| `Seguridad.MinutosSesion` | 120 | 15–480 | Tope de duración de las sesiones nuevas |

El bloqueo ocurre al superar el umbral. Las solicitudes bloqueadas reciben `429` y
`Retry-After`. Un exceso autenticado de operaciones/creación bloquea temporalmente
esa cuenta y revoca todas sus sesiones; una nueva contraseña no elimina ese bloqueo.
Un exceso compartido de API por IP revoca únicamente la sesión que hizo la solicitud.
Los intentos de login anónimos limitan el acceso, pero no expulsan sesiones válidas
de terceros. Esto evita que conocer un correo permita cerrar sus sesiones.

Los contadores se actualizan atómicamente en SQL Server, se comparten entre procesos
y sobreviven a reinicios. Se registra el motivo en `Bitacoras`; el evento de bloqueo
se limita a uno por minuto para cada IP/usuario para evitar inundar el registro.
El inicio de la API limpia registros de seguridad vencidos hace más de siete días.
Las recuperaciones tienen además topes fijos de 10 solicitudes/hora por IP y
10 intentos de restablecimiento cada 15 minutos, con bloqueo de 15 minutos.

Estos controles detectan exceso de actividad, **no identifican infaliblemente bots**.
Un bot lento o distribuido puede respetar las cuotas; una red compartida puede llegar
al límite por uso legítimo. En despliegues con proxy, el gateway debe reemplazar los
encabezados reenviados del cliente. La API confía por defecto solo en loopback;
otros proxies requieren `Seguridad__ProxiesConfiables__0=<IP>`. No confiar en todos.
El cuerpo de las solicitudes está limitado a 1 MiB.

## Preparación local

Desde la raíz del repositorio:

```powershell
.\scripts\Configurar-Desarrollo.ps1
.\scripts\Iniciar-Correos.ps1
cd backend/Inventarios.Api
dotnet run --urls http://localhost:5279
```

La configuración crea una clave JWT aleatoria mediante `dotnet user-secrets`, sin
mostrarla ni modificar archivos versionados. Conserva una clave existente. El SDK
carga esos secretos en Development. Use `-Servidor localhost` (valor predeterminado)
para la instancia completa o `-Servidor '(localdb)\MSSQLLocalDB'` si trabaja con
LocalDB. La migración `SeguridadAcceso` se aplica al
iniciar; agrega tablas y un campo nullable, sin borrar datos del inventario.

Las cuentas demo se siembran con correos `@inventarios.gt`. Si una base anterior
conserva correos `@inventarios.local`, el login los rechaza hasta que se cambie el
correo del usuario a un dominio válido.

El ejecutable de Mailpit debe estar instalado aparte. En este entorno se descargó
en `../.tools/mailpit/mailpit.exe`; se puede indicar otra ruta con `-RutaMailpit`.
SMTP escucha solo en `127.0.0.1:1025`, y su bandeja solo en `127.0.0.1:8025`.
Mailpit captura los correos y permite abrir los enlaces, pero **no los entrega a
Gmail ni a otros buzones externos**. No publicar su bandeja en internet.

## Recuperación

`/login/recuperar` solicita el correo. La respuesta pública es la misma exista o no
la cuenta, incluso si el envío falla. Los fallos SMTP se registran sin contenido
del mensaje ni tokens. El enlace contiene un secreto aleatorio de 256 bits, vence
en 15 minutos y se almacena solamente como SHA-256. El fragmento del enlace se
elimina del historial al abrir la pantalla; no viaja en la URL HTTP al servidor.
El consumo del token es atómico y de un solo uso; la transacción cambia la contraseña,
revoca sesiones e invalida los otros enlaces de recuperación del usuario.

Para entrega real se puede configurar SMTP de un proveedor gratuito, sujeto a sus
límites y verificación de remitente. Variables de despliegue:

```text
Correo__Host=<servidor SMTP>
Correo__Puerto=587
Correo__Usuario=<usuario SMTP>
Correo__Clave=<secreto SMTP>
Correo__Remitente=<remitente autorizado>
Correo__UrlFrontend=https://<frontend>
Jwt__Key=<clave aleatoria de al menos 64 caracteres>
```

SMTP exige TLS en producción. La URL de recuperación se toma de configuración,
nunca del Host enviado por el solicitante. No hay integración ni cuenta externa
creada automáticamente.

En una base nueva de producción no se siembran usuarios, catálogos ni operaciones
demo. Para crear el primer superadmin se requieren `Bootstrap__Correo` y
`Bootstrap__Contrasena` (12–100 caracteres), guardados como secretos. Luego pueden
retirarse. Si se despliega una copia de una base de desarrollo, se deben desactivar
sus cuentas demo existentes y cambiar las credenciales antes de publicarla.

## Validación

```powershell
dotnet build --project backend/Inventarios.Api
cd frontend
npm run build
npm run lint
cd ..
node tests/seguridad.mjs
```

Las pruebas de integración requieren API aislada en `localhost:5280`, Mailpit y la
base exclusiva `SistemaInventarios_Pruebas2FA`. No usar la base de trabajo. Por ejemplo,
en una terminal nueva, desde `backend/Inventarios.Api`:

```powershell
$env:ConnectionStrings__Inventarios='Server=(localdb)\MSSQLLocalDB;Database=SistemaInventarios_Pruebas2FA;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;'
$env:Correo__Host='127.0.0.1'
$env:Correo__Puerto='1025'
$env:Correo__Tls='false'
$env:Correo__Usuario=' '
$env:Correo__Remitente='inventarios@example.com'
dotnet run --urls http://localhost:5280
```

En otra terminal, desde la raíz, ejecutar `node tests/segundo-factor.mjs` y después
`node tests/seguridad.mjs`. Las fixtures PowerShell actúan exclusivamente sobre la
base fija de pruebas, preparan el correo demo del administrador y ajustan relojes
para probar vencimientos/reenvíos sin esperar minutos. Nunca cambian la configuración
SMTP guardada ni los correos de la base de trabajo. La suite de regresión ajusta cuotas
2FA de sus cuentas de prueba para poder probar repetidamente las sesiones; la suite
específica comprueba los límites reales sin omitirlos.

Usan `TEST_ADMIN` y `TEST_PASSWORD` o la cuenta demo local por defecto.
Crean cuentas de prueba y las inactivan al finalizar, conservando bitácora.
Elevan temporalmente `Seguridad.LoginPorIp` a 100 y restauran su valor al finalizar.
Consumen cuotas reales: no ejecutarlas simultáneamente ni contra datos de producción.
Las cuentas de prueba quedan bloqueadas cuando corresponde; no se limpian sus bloqueos.

Cubren el segundo paso obligatorio, CSRF, unión con el navegador, códigos vencidos,
intentos concurrentes, reenvíos, un solo uso, cambios de cuenta y login por correo;
también ocultamiento del JWT, revocación de cookie copiada,
cambio de contraseña, recuperación por correo, token de un solo uso, correo inválido,
intentos por cuenta, exceso de creación, exceso de operaciones y cambio de rol.

Referencias: [antiforgery de ASP.NET Core](https://learn.microsoft.com/aspnet/core/security/anti-request-forgery),
[proxies confiables](https://learn.microsoft.com/aspnet/core/host-and-deploy/proxy-load-balancer),
[instalación de Mailpit](https://mailpit.axllent.org/docs/install/).

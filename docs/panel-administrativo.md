# Panel administrativo

El panel /administracion se abre únicamente desde el menú del nombre/avatar en la barra superior. Solo Administrador y Superadmin pueden verlo;
la API también exige esos roles en /api/administracion/resumen.

## Permisos

- Superadmin: todos los módulos y gestión de usuarios, administradores y superadmins.
- Administrador: todos los módulos y gestión de usuarios y otros administradores.
  No puede asignar el rol Superadmin, modificar esas cuentas ni restablecer sus claves.
- Inventario, Ventas y Consulta: mantienen sus permisos de trabajo. No acceden al panel.

Nadie puede desactivar su propia cuenta o cambiar su propio rol. Debe existir al menos
un Superadmin activo. Las actualizaciones y revocaciones de sesión son transaccionales.
Los permisos se verifican en el servidor, no solo mediante botones ocultos. Las solicitudes
no autorizadas contra cuentas de Superadmin reciben 403.

## Acceso de compañeros

1. Abrir Panel administrativo y entrar en Usuarios y roles.
2. Pulsar Nuevo usuario e indicar nombre, alias o correo, correo real, clave inicial
   de 12–100 caracteres y rol. Cada compañero necesita una cuenta individual.
3. Compartir las credenciales por un canal privado. Cada usuario completa el segundo
   factor desde su propio correo y puede cambiar la clave en Mi perfil.

No se envían invitaciones ni contraseñas automáticamente. Los compañeros no necesitan
cuenta de hosting ni permisos de GitHub. Se mantienen las cuotas de creación de usuarios.

## Migración y despliegue

RolSuperadmin agrega el rol sin ascender automáticamente a las cuentas existentes.
La cuenta titular local se promovió explícitamente, conservando correo y contraseña.
Los cambios de datos locales no viajan con Git: para una base nueva de producción,
Bootstrap__Correo y Bootstrap__Contrasena crean el primer Superadmin. Guardar estos
valores como secretos. El sembrador completa roles faltantes sin duplicarlos.

Los cambios de rol revocan sesiones; se necesita volver a ingresar. Para revertir la
migración hay que reasignar primero las cuentas Superadmin.

## Validación

node tests/administracion.mjs verifica la API aislada localhost:5280 con Mailpit y la
base exclusiva SistemaInventarios_Pruebas2FA. Cubre acceso al panel, escalada prohibida,
protección de superadmins, gestión entre administradores y protección del acceso propio.
Las cuentas de prueba se inactivan al terminar. La preparación del entorno está en
seguridad-login.md.

La gestión de usuarios se concentra en /administracion/usuarios, con enlace de regreso
al panel administrativo. La antigua ruta /usuarios redirige a esa sección para conservar
los enlaces previos. No hay accesos duplicados a usuarios o al panel en la barra lateral.

# Matriz de pruebas

## Sistema de Inventarios

Este documento registra las pruebas técnicas ejecutadas durante el desarrollo y las pruebas funcionales que deben repetirse antes de la entrega final.

## 1. Entorno de pruebas

| Elemento | Valor |
|---|---|
| Sistema operativo | Windows 11 |
| SDK .NET | 8.0.426 |
| EF Core | 8.0.10 |
| Node.js | 22.14.0 |
| npm | 10.9.2 |
| SQL Server | 2022 Developer, instancia `localhost` |
| Base de datos | `SistemaInventarios` |
| API | `http://localhost:5279` |
| Frontend | `http://localhost:3000` |
| Navegador previsto | Chrome / Edge actualizado |

## 2. Compilación y arranque

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| CP-01 | Compilar backend con `dotnet build` | 0 errores | 0 errores | Aprobada |
| CP-02 | Compilar frontend con `npm run build` | Compilación correcta | 22 rutas generadas | Aprobada |
| CP-03 | Aplicar migración inicial | Base actualizada | Migración aplicada | Aprobada |
| CP-04 | Arrancar la API | Escucha en el puerto 5279 | Servicio iniciado | Aprobada |
| CP-05 | Arrancar el frontend | Escucha en el puerto 3000 | Servicio iniciado | Aprobada |
| CP-06 | Consultar `/api/health` | Respuesta correcta | Correcta | Aprobada |
| CP-07 | Abrir `/swagger` | Interfaz OpenAPI | Disponible | Aprobada |
| CP-08 | Validar rutas principales con Edge automatizado | 9 rutas con 200 y sin errores de consola | Correcto | Aprobada |

## 3. Seguridad

| ID | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| CS-01 | Login válido con `admin` | 200 y cookie `access_token` | Aprobada |
| CS-02 | Login con contraseña incorrecta | 401 y mensaje genérico | Aprobada |
| CS-03 | `/api/dashboard` sin cookie | 401 | Aprobada |
| CS-04 | `/api/auth/me` con sesión | Datos del usuario y rol | Aprobada |
| CS-05 | Cerrar sesión | Cookie eliminada | Aprobada |
| CS-06 | Rol Consulta intenta crear producto | 403 | Aprobada |
| CS-07 | Rol Ventas intenta crear compra | 403 | Aprobada |
| CS-08 | Rol Inventario intenta crear venta | 403 | Aprobada |
| CS-09 | Vendedor intenta anular una venta | 403 | Aprobada |
| CS-10 | Cambio de contraseña con clave actual incorrecta | Error de negocio | Aprobada |
| CS-11 | Inspeccionar la cookie en el navegador | `HttpOnly`, `SameSite=Lax` | Configurada |
| CS-12 | Abrir `/productos` sin cookie | Redirección a `/login` | Aprobada |
| CS-13 | Escribir una ruta restringida con otro rol | Pantalla de acceso restringido, sin formularios | Aprobada |

## 4. Catálogos

| ID | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| CC-01 | Crear proveedor con código único | Proveedor guardado | Aprobada |
| CC-02 | Repetir código de proveedor | Error de validación | Aprobada |
| CC-03 | Editar proveedor | Datos actualizados | Aprobada |
| CC-04 | Inactivar proveedor | Estado inactivo e historial conservado | Aprobada |
| CC-05 | Crear categoría | Categoría guardada | Aprobada |
| CC-06 | Crear producto con categoría | Producto guardado | Aprobada |
| CC-07 | Repetir código de producto | Error de validación | Aprobada |
| CC-08 | Buscar producto por nombre | Fila filtrada | Aprobada |
| CC-09 | Crear cliente | Cliente guardado | Aprobada |
| CC-10 | Inactivar cliente | Estado inactivo | Aprobada |

## 5. Compras

Se utilizó un producto de prueba y se verificó el saldo antes y después de cada operación.

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| CMP-01 | Registrar compra de 1 unidad | Documento creado y stock +1 | Correcto | Aprobada |
| CMP-02 | Verificar costo promedio | Costo recalculado | Correcto | Aprobada |
| CMP-03 | Verificar movimiento | Entrada con origen Compra | Correcto | Aprobada |
| CMP-04 | Verificar numeración | Prefijo y secuencia correctos | Correcto | Aprobada |
| CMP-05 | Anular compra | Estado Anulada y stock −1 | Correcto | Aprobada |
| CMP-06 | Verificar reversión | Salida con origen Anulación | Correcto | Aprobada |
| CMP-07 | Anular nuevamente | Error de negocio | Correcto | Aprobada |
| CMP-08 | Imprimir compra | Vista imprimible | Correcto | Aprobada |

## 6. Ventas

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| VEN-01 | Registrar venta de 1 unidad con stock | Documento creado y stock −1 | Correcto | Aprobada |
| VEN-02 | Verificar movimiento | Salida con origen Venta | Correcto | Aprobada |
| VEN-03 | Vender más que la existencia | Rechazo por stock insuficiente | Correcto | Aprobada |
| VEN-04 | Aplicar descuento por línea | Subtotal y total correctos | Correcto | Aprobada |
| VEN-05 | Verificar impuesto configurable | Total con porcentaje aplicado | Correcto | Aprobada |
| VEN-06 | Anular venta | Estado Anulada y stock +1 | Correcto | Aprobada |
| VEN-07 | Verificar reversión | Entrada con origen Anulación | Correcto | Aprobada |
| VEN-08 | Imprimir venta | Vista imprimible | Correcto | Aprobada |
| VEN-09 | Crear nota desde venta | Formulario precargado | Correcto | Aprobada |

## 7. Notas de crédito y débito

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| NOT-01 | Crear nota de crédito de 1 unidad | Documento creado y stock +1 | Correcto | Aprobada |
| NOT-02 | Verificar crédito disponible | Total de venta reducido | Correcto | Aprobada |
| NOT-03 | Nota de crédito mayor al total | Rechazo | Correcto | Aprobada |
| NOT-04 | Crear nota de débito | Documento creado y stock −1 | Correcto | Aprobada |
| NOT-05 | Nota de débito sin stock | Rechazo | Correcto | Aprobada |
| NOT-06 | Anular nota de crédito | Stock −1 y estado Anulada | Correcto | Aprobada |
| NOT-07 | Anular nota de débito | Stock +1 y estado Anulada | Correcto | Aprobada |
| NOT-08 | Anular una nota dos veces | Error de negocio | Correcto | Aprobada |
| NOT-09 | Imprimir nota | Vista imprimible | Correcto | Aprobada |

## 8. Movimientos y existencias

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| MOV-01 | Consultar movimientos | Tabla paginada | Correcto | Aprobada |
| MOV-02 | Filtrar por producto | Solo movimientos del producto | Correcto | Aprobada |
| MOV-03 | Filtrar por tipo y origen | Resultados coherentes | Correcto | Aprobada |
| MOV-04 | Resumen del período | Entradas, salidas y total | Correcto | Aprobada |
| MOV-05 | Ajuste de entrada de 2 unidades | Stock +2 | Correcto | Aprobada |
| MOV-06 | Ajuste de salida de 2 unidades | Stock −2 | Correcto | Aprobada |
| MOV-07 | Salida mayor a la existencia | Rechazo | Correcto | Aprobada |
| MOV-08 | Exportar CSV | Archivo descargado | Correcto | Aprobada |
| EXI-01 | Listar existencias | Columnas y valorización | Correcto | Aprobada |
| EXI-02 | Filtrar bajo mínimo | Solo productos en alerta | Correcto | Aprobada |
| EXI-03 | Consultar kardex | Saldo anterior y nuevo | Correcto | Aprobada |
| EXI-04 | Exportar existencias | CSV descargado | Correcto | Aprobada |

## 9. Reportes y parámetros

| ID | Prueba | Resultado esperado | Resultado | Estado |
|---|---|---|---|---|
| REP-01 | Resumen por período | Totales de ventas, compras y notas | Correcto | Aprobada |
| REP-02 | Reporte de ventas | Documentos filtrados | Correcto | Aprobada |
| REP-03 | Reporte de compras | Documentos filtrados | Correcto | Aprobada |
| REP-04 | Reporte de notas | Crédito y débito | Correcto | Aprobada |
| REP-05 | Top productos | Orden por cantidad vendida | Correcto | Aprobada |
| REP-06 | Bajo mínimo | Productos en alerta | Correcto | Aprobada |
| REP-07 | Exportar reporte | CSV de la pestaña activa | Correcto | Aprobada |
| REP-08 | Imprimir reporte | Vista limpia | Correcto | Aprobada |
| PAR-01 | Editar nombre de empresa | Valor actualizado | Correcto | Aprobada |
| PAR-02 | Impuesto fuera de rango | Rechazo | Correcto | Aprobada |
| PAR-03 | Prefijo vacío | Rechazo | Correcto | Aprobada |
| PAR-04 | Sesión menor a 5 minutos | Rechazo | Correcto | Aprobada |
| PAR-05 | Documento nuevo usa el prefijo | Número con prefijo nuevo | Correcto | Aprobada |

## 10. Usuarios y perfil

| ID | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| USU-01 | Crear usuario | Usuario activo con rol | Aprobada |
| USU-02 | Nombre de usuario duplicado | Error de validación | Aprobada |
| USU-03 | Editar rol | Permisos actualizados al iniciar sesión | Aprobada |
| USU-04 | Desactivar usuario | No puede iniciar sesión | Aprobada |
| USU-05 | Restablecer contraseña | Nuevo acceso funciona | Aprobada |
| USU-06 | Administrador intenta desactivarse | Rechazo | Aprobada |
| PER-01 | Ver datos de perfil | Nombre, usuario y rol | Aprobada |
| PER-02 | Cambiar contraseña | Nuevo acceso funciona | Aprobada |
| PER-03 | Confirmación distinta | Rechazo | Aprobada |

## 11. Regresión y limpieza

| ID | Prueba | Resultado |
|---|---|---|
| REG-01 | Al anular operaciones el stock vuelve al valor inicial | Correcto |
| REG-02 | Los documentos anulados permanecen en la base | Correcto |
| REG-03 | Los movimientos de prueba se eliminan y las secuencias se restablecen | Correcto |
| REG-04 | El dashboard responde después de la limpieza | Correcto |
| REG-05 | La base queda con 8 ventas, 2 compras, 0 notas y 38 movimientos | Correcto |

## 12. Pruebas pendientes antes de la entrega

Estas pruebas deben ejecutarse en el navegador y en el entorno publicado:

| ID | Prueba | Responsable | Evidencia |
|---|---|---|---|
| UAT-01 | Login y navegación con los cuatro roles | _[Integrante]_ | Captura o video |
| UAT-02 | Recorrido completo de compra, venta, nota y anulación | _[Integrante]_ | Video |
| UAT-03 | Impresión de los tres tipos de documento | _[Integrante]_ | PDF de ejemplo |
| UAT-04 | Exportación CSV en los módulos | _[Integrante]_ | Archivos CSV |
| UAT-05 | Edición de parámetros y efecto en documento nuevo | _[Integrante]_ | Captura |
| UAT-06 | Creación de usuario y cambio de contraseña | _[Integrante]_ | Captura |
| UAT-07 | Prueba en Vercel/MonsterASP.NET | _[Integrante]_ | Enlaces |
| UAT-08 | Revisión responsive en móvil | _[Integrante]_ | Captura |

UAT-01 y UAT-08 se validaron en local con Edge automatizado. Deben repetirse en el entorno publicado antes de la entrega.

## 13. Criterios de aceptación

La entrega se considera funcional cuando:

1. El backend y el frontend compilan sin errores.
2. La base de datos se crea desde cero con las migraciones.
3. Los cuatro roles inician sesión y ven únicamente sus opciones.
4. Una compra aumenta el stock y una venta lo disminuye.
5. Las anulaciones revierten el stock y conservan el documento.
6. Las notas respetan el crédito disponible y el stock.
7. El kardex y los reportes reflejan las operaciones.
8. Los parámetros modifican documentos nuevos.
9. La aplicación publicada responde por HTTPS.
10. El informe, el video y los enlaces están disponibles en Canvas.

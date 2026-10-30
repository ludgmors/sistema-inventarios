# Manual de usuario

## Sistema de Inventarios

Este manual describe el uso de la aplicación web. Está dirigido a los usuarios de los roles Administrador, Inventario, Ventas y Consulta.

---

## 1. Acceso al sistema

1. Abrir la URL de la aplicación.
2. Introducir el nombre de usuario y la contraseña.
3. Presionar **Iniciar sesión**.

### Usuarios de demostración

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `bodega` | `Inventario123!` | Inventario |
| `vendedor` | `Ventas123!` | Ventas |
| `consulta` | `Consulta123!` | Consulta |

Si las credenciales son incorrectas, el sistema muestra un mensaje de error y no permite el acceso. La sesión se almacena en una cookie `httpOnly`; al cerrar sesión se elimina.

---

## 2. Menú principal

El menú lateral se adapta al rol del usuario:

| Sección | Opciones |
|---|---|
| Principal | Panel de control |
| Catálogos | Productos, Categorías, Proveedores, Clientes |
| Operaciones | Compras, Ventas, Notas de ajuste |
| Inventario | Movimientos, Existencias |
| Análisis | Reportes |
| Configuración | Parámetros, Usuarios y roles, Mi perfil |

Las opciones no permitidas para el rol no se muestran. La autorización definitiva se valida en la API.

---

## 3. Panel de control

El panel gerencial presenta:

- ventas y compras del mes con variación frente al mes anterior;
- ticket promedio y margen bruto estimado del mes;
- valor del inventario al costo y al precio de venta, con margen potencial;
- productos bajo mínimo y productos sin existencia;
- comparativo de ventas y compras de los últimos seis meses;
- ventas de los últimos treinta días;
- distribución de ventas por forma de pago;
- top de clientes y productos del mes;
- productos con existencia baja, con acceso directo a **Nueva compra**;
- últimas ventas.

El panel indica la hora de actualización y permite **Actualizar**, **Imprimir** y **Exportar Excel**. La impresión usa el mismo formato gerencial de Reportes: encabezado de empresa, período, indicadores y tablas con totales.

Desde el panel se puede ir a **Nueva venta**, **Nueva compra** o **Movimientos**, según el rol.

> El margen bruto es estimado: usa el costo registrado en los movimientos de salida de las ventas vigentes, no un método FIFO exacto.

---

## 4. Catálogos

### 4.1 Productos

Ruta: **Catálogos → Productos**

1. Presionar **Nuevo producto**.
2. Completar:
   - código;
   - nombre;
   - descripción;
   - categoría;
   - unidad de medida;
   - precio de costo;
   - precio de venta;
   - existencia mínima;
   - estado activo.
3. Guardar.

La tabla permite buscar por código o nombre, filtrar por categoría y estado, editar y activar/inactivar. El producto no se elimina si tiene historial.

La existencia actual se modifica automáticamente con compras, ventas, notas y ajustes. No se edita manualmente desde el formulario del producto.

El botón **Importar** permite cargar varios productos desde Excel; ver la sección 4.5.

### 4.2 Categorías

Ruta: **Catálogos → Categorías**

Permite crear y editar categorías, consultar su descripción, estado y cantidad de productos. Una categoría con productos no debe eliminarse; se inactiva.

### 4.3 Proveedores

Ruta: **Catálogos → Proveedores**

Campos principales: código, razón social, documento, contacto, teléfono, correo, dirección y estado. El código debe ser único.

### 4.4 Clientes

Ruta: **Catálogos → Clientes**

Campos principales: código, nombre, documento, teléfono, correo, dirección y estado. El código debe ser único.

### 4.5 Importar catálogos desde Excel

Disponible en **Productos**, **Proveedores** y **Clientes** con el botón **Importar**.

1. Descargar la plantilla `.xlsx` del módulo.
2. Completar la hoja **Datos** sin cambiar los encabezados. La fila 2 es un ejemplo y debe reemplazarse.
3. Subir el archivo y revisar la **previsualización**: filas válidas, advertencias y errores.
4. Confirmar la importación. Todo se aplica en una sola transacción.

Reglas:
- El código es la llave. Si ya existe, la fila se omite o se actualiza según la casilla **Actualizar los registros que ya existen**.
- Si hay errores, no se importa ninguna fila; se corrige el archivo y se repite.
- Las categorías que no existen se crean automáticamente.
- La **existencia inicial** solo se aplica a productos nuevos y genera un movimiento de ajuste auditado.
- Usar punto decimal (`1650.24`), sin símbolo de moneda ni separadores de miles.
- Máximo 5,000 filas y 5 MB por archivo.
- Productos y proveedores: Administrador e Inventario. Clientes: Administrador y Ventas.

---

## 5. Compras

Ruta: **Operaciones → Compras**

### 5.1 Registrar una compra

1. Presionar **Nueva compra**.
2. Seleccionar el proveedor.
3. Confirmar o cambiar la fecha.
4. Verificar el porcentaje de impuesto. El valor inicial es 12 %, pero puede modificarse.
5. Agregar una o más líneas:
   - producto;
   - cantidad;
   - precio unitario.
6. Agregar observaciones si es necesario.
7. Revisar el resumen: subtotal, impuesto y total.
8. Presionar **Registrar compra**.

Al guardar:

- se genera un número secuencial con el prefijo configurado;
- aumenta la existencia del producto;
- se actualiza el costo promedio ponderado;
- se registra un movimiento de entrada;
- se abre el detalle imprimible.

### 5.2 Consultar y anular

El listado permite filtrar por fecha, proveedor, estado y búsqueda. El detalle muestra las líneas, totales, usuario y fecha.

El botón **Anular compra** solo aparece para el rol Administrador. La anulación:

- cambia el estado a **Anulada**;
- devuelve la cantidad al inventario;
- registra el movimiento de reversión;
- conserva el documento para auditoría.

---

## 6. Ventas

Ruta: **Operaciones → Ventas**

### 6.1 Registrar una venta

1. Presionar **Nueva venta**.
2. Seleccionar el cliente o dejar **Consumidor final**.
3. Confirmar la fecha.
4. Seleccionar la forma de pago.
5. Verificar el impuesto.
6. Agregar las líneas:
   - producto;
   - cantidad;
   - precio unitario;
   - descuento por línea.
7. Revisar el resumen.
8. Presionar **Registrar venta**.

Al guardar:

- se valida la existencia;
- se genera el número de venta;
- se descuenta el inventario;
- se registra un movimiento de salida;
- se abre el comprobante.

Si la cantidad solicitada supera la existencia y el parámetro **Permitir stock negativo** está desactivado, la venta se rechaza con un mensaje.

### 6.2 Consultar y anular

El listado permite filtrar por fecha, cliente, estado y búsqueda. El detalle muestra las líneas, totales, notas asociadas y botones de impresión.

La anulación solo está disponible para el Administrador. Al anular:

- el estado cambia a **Anulada**;
- las existencias se devuelven;
- se registra el movimiento de reversión;
- el documento permanece en el historial.

### 6.3 Crear una nota desde una venta

En el detalle de una venta registrada se puede usar **Crear nota**. El formulario abre con la venta preseleccionada y sus productos cargados.

---

## 7. Notas de crédito y débito

Ruta: **Operaciones → Notas de ajuste**

### 7.1 Nota de crédito

Se utiliza para devoluciones, descuentos posteriores o correcciones a favor del cliente.

1. Presionar **Nueva nota**.
2. Seleccionar la venta registrada.
3. Elegir **Nota de crédito**.
4. Confirmar la fecha.
5. Indicar el motivo.
6. Ajustar las cantidades de los productos.
7. Verificar el crédito disponible de la venta.
8. Registrar.

Efectos:

- devuelve existencias al inventario;
- genera un movimiento de entrada;
- reduce el saldo cobrado de la venta;
- el total acumulado de notas de crédito no puede superar el total de la venta.

### 7.2 Nota de débito

Se utiliza para cargos adicionales o correcciones a favor de la empresa.

1. Repetir el procedimiento anterior.
2. Elegir **Nota de débito**.
3. Indicar el motivo y las cantidades.
4. Registrar.

Efectos:

- descuenta existencias;
- genera un movimiento de salida;
- aumenta el saldo cobrado de la venta;
- si no hay existencia suficiente, la operación se rechaza salvo que se permita stock negativo.

### 7.3 Anulación de notas

Solo el Administrador puede anular una nota registrada. La anulación revierte el movimiento de inventario y conserva el documento en estado **Anulada**.

---

## 8. Movimientos de inventario

Ruta: **Inventario → Movimientos**

La pantalla muestra un resumen de entradas, salidas y cantidad de movimientos en el período. La tabla permite filtrar por:

- producto;
- tipo (entrada o salida);
- origen (compra, venta, nota de crédito, nota de débito, ajuste, anulación);
- rango de fechas;
- búsqueda por producto, código o documento.

Cada fila muestra fecha, producto, tipo, origen, documento, cantidad con signo, saldo anterior, saldo nuevo, costo y usuario.

### 8.1 Ajuste manual

Disponible para Administrador e Inventario.

1. Presionar **Nuevo ajuste**.
2. Seleccionar el producto.
3. Elegir **Entrada** o **Salida**.
4. Indicar cantidad y costo unitario.
5. Escribir la observación o motivo.
6. Registrar.

El ajuste genera un documento con prefijo `AJU` y un movimiento de inventario. Si la salida supera la existencia y no se permite stock negativo, la operación se rechaza.

### 8.2 Exportar

El botón **Exportar CSV** descarga los movimientos visibles en la página actual.

---

## 9. Existencias

Ruta: **Inventario → Existencias**

La parte superior muestra:

- productos activos;
- productos bajo mínimo;
- unidades en stock;
- valor al costo;
- valor de venta;
- margen potencial.

La tabla permite buscar por código, producto o categoría, filtrar por categoría, bajo mínimo y estado activo. Cada fila muestra existencia, mínimo, costo, precio, valorización y estado.

### 9.1 Kardex

1. Presionar **Kardex** en la fila del producto.
2. Seleccionar el rango de fechas.
3. Consultar los movimientos con saldo anterior y saldo nuevo.
4. Exportar a CSV si es necesario.

### 9.2 Exportar existencias

El botón **Exportar CSV** descarga las existencias visibles con su valorización.

---

## 10. Reportes

Ruta: **Análisis → Reportes**

1. Seleccionar el rango de fechas.
2. Elegir una pestaña:
   - **Resumen:** ventas, compras, notas de crédito y débito, top de productos y bajo mínimo.
   - **Ventas:** documentos con filtro de estado.
   - **Compras:** documentos con filtro de estado.
   - **Notas:** notas con filtro de tipo.
3. Usar **Exportar CSV** para descargar la pestaña activa con montos numéricos, fechas ISO y fila de totales.
4. Usar **Exportar Excel** para descargar la pestaña activa en un libro con encabezado de empresa, indicadores, formato de moneda, autofiltro y totales.
5. Usar **Imprimir** para generar el informe gerencial: encabezado de empresa, período, indicadores y la pestaña activa con totales.

El resumen del período considera documentos registrados; los listados pueden incluir anulados según el filtro.

---

## 11. Parámetros del sistema

Ruta: **Configuración → Parámetros** (solo Administrador)

Grupos disponibles:

| Grupo | Ejemplos |
|---|---|
| Empresa | Nombre, documento, dirección, teléfono, correo |
| Impuestos | Porcentaje inicial (12 % por defecto) |
| Moneda | Símbolo y código ISO |
| Inventario | Permitir stock negativo, existencia mínima por defecto |
| Documentos | Prefijos de compras, ventas, notas y ajustes |
| Seguridad | Duración de la sesión en minutos |

Los cambios aplican a documentos nuevos. Los documentos históricos conservan sus valores originales. La duración de la sesión se valida entre 5 y 43 200 minutos.

---

## 12. Usuarios y roles

Ruta: **Configuración → Usuarios y roles** (solo Administrador)

### 12.1 Crear usuario

1. Presionar **Nuevo usuario**.
2. Completar nombre completo, nombre de usuario, correo y rol.
3. Definir una contraseña inicial de al menos 8 caracteres.
4. Crear.

### 12.2 Editar usuario

Permite cambiar nombre, correo, rol y estado. El nombre de usuario no se modifica. El Administrador no puede desactivar su propia cuenta desde la interfaz.

### 12.3 Restablecer contraseña

1. Presionar **Clave** en la fila del usuario.
2. Escribir la contraseña nueva y confirmarla.
3. Restablecer.

---

## 13. Mi perfil

Ruta: **Configuración → Mi perfil**

Muestra nombre, usuario, correo, rol y un resumen de permisos. El usuario puede cambiar su contraseña indicando la actual, la nueva y la confirmación.

---

## 14. Impresión de documentos

Los detalles de compras, ventas y notas incluyen el botón **Imprimir**. La versión imprimible:

- oculta el menú, la barra superior y los botones;
- muestra los datos de la empresa;
- muestra el número, fecha, cliente/proveedor, usuario y estado;
- incluye las líneas y totales;
- conserva el documento en el historial.

Se recomienda usar **Guardar como PDF** en el diálogo de impresión para archivar comprobantes.

El módulo **Reportes** usa el mismo mecanismo, pero con un formato gerencial: encabezado con los datos de la empresa, período, usuario y fecha de generación, franja de indicadores y tablas con totales. No incluye logotipo.

---

## 15. Mensajes y solución de problemas

| Situación | Posible causa | Acción |
|---|---|---|
| No permite iniciar sesión | Credenciales incorrectas o usuario inactivo | Verificar con el Administrador |
| La sesión expiró | Tokens vencidos | Iniciar sesión nuevamente |
| No aparece una opción del menú | El rol no tiene permiso | Solicitar revisión del rol |
| Venta rechazada por existencia | Stock insuficiente | Comprar, ajustar o revisar el parámetro de stock negativo |
| Nota de crédito rechazada | Supera el crédito disponible | Verificar notas previas y el total de la venta |
| No se puede anular | El usuario no es Administrador | Solicitar la anulación a un Administrador |
| Error de conexión | API o base de datos no disponible | Verificar el backend y la cadena de conexión |
| Los cambios de parámetros no se reflejan en documentos antiguos | Comportamiento esperado | Los documentos conservan sus valores históricos |

---

## 16. Buenas prácticas

1. Registrar las compras antes de vender los productos.
2. Verificar la existencia antes de confirmar una venta.
3. Usar notas de crédito o débito en lugar de modificar documentos ya registrados.
4. Escribir motivos claros en notas y ajustes.
5. Revisar el kardex cuando existan diferencias de inventario.
6. Realizar conteos físicos periódicos y ajustar con observaciones.
7. Cambiar las contraseñas de demostración antes de publicar.
8. Cerrar sesión al terminar, especialmente en equipos compartidos.

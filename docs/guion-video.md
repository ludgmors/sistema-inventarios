# Guion del video de presentación

## Sistema de Inventarios

**Duración objetivo:** 30 minutos de contenido + 5 minutos de margen o preguntas.  
**Formato:** grabación de pantalla con cámara o videollamada, audio claro y resolución mínima 1080p.  
**Participantes:** todos los integrantes del equipo deben aparecer y hablar.

> Completar los nombres antes de grabar. Si el equipo tiene tres integrantes, redistribuir las secciones manteniendo los mismos tiempos.

## 1. Reparto sugerido

| Integrante | Secciones | Tiempo aproximado |
|---|---|---:|
| _[Integrante 1]_ | Introducción, problema, objetivos y cierre | 7 min |
| _[Integrante 2]_ | Arquitectura, base de datos y seguridad | 7 min |
| _[Integrante 3]_ | Catálogos, compras y movimientos | 8 min |
| _[Integrante 4]_ | Ventas, notas, existencias, reportes y parámetros | 8 min |

## 2. Preparación previa

### 2.1 Verificaciones técnicas

- [ ] Backend iniciado en `http://localhost:5279`.
- [ ] Frontend iniciado en `http://localhost:3000`.
- [ ] Base de datos con los datos demo.
- [ ] Navegador con zoom al 100 % y barra de marcadores oculta.
- [ ] Sesión cerrada antes de comenzar.
- [ ] Notificaciones del sistema silenciadas.
- [ ] Micrófono probado y grabación de prueba de 30 segundos.
- [ ] PDF del informe abierto en otra pestaña.
- [ ] Diagramas de arquitectura y entidad-relación listos para mostrar.
- [ ] Credenciales de los cuatro usuarios a la mano.
- [ ] Producto con existencia suficiente para la venta demo.
- [ ] Pestaña de Swagger disponible para mostrar la API.

### 2.2 Orden de pestañas sugerido

1. Aplicación en `/login`.
2. Panel de control.
3. Swagger.
4. Informe o diagramas.
5. Google Drive para mostrar la organización de entregables al final.

### 2.3 Reglas de grabación

- Hablar pausado y explicar lo que se hace en pantalla.
- No leer bloques completos del informe.
- Evitar datos personales reales.
- Si ocurre un error, explicarlo y continuar; no cortar la grabación.
- No mostrar contraseñas reales de producción.
- Mantener el cursor visible y usar el zoom del navegador si hace falta.

---

## 3. Guion cronometrado

### 0:00–1:00 — Apertura

**Responsable:** Integrante 1  
**Pantalla:** Portada del informe o cámara.

**Guion:**

> Buenos días/tardes. Somos _[nombres]_, integrantes del equipo de _[asignatura]_. En este video presentamos el Sistema de Inventarios, una aplicación web desarrollada para controlar proveedores, productos, compras, ventas, notas de crédito y débito, movimientos y existencias. Durante los próximos 30 minutos explicaremos el problema, la solución, la arquitectura, las reglas de negocio y haremos una demostración completa del sistema.

**Acciones:**

- Mostrar brevemente la portada del informe.
- Presentar a cada integrante y la parte que expondrá.

### 1:00–3:00 — Problema y justificación

**Responsable:** Integrante 1  
**Pantalla:** Diapositiva o sección de introducción del informe.

**Guion:**

> En muchas pequeñas y medianas empresas el inventario se controla con hojas de cálculo o registros separados. Esto produce diferencias entre el stock físico y el registrado, ventas sin existencia, compras que no se reflejan a tiempo y poca claridad sobre quién realizó cada operación. Nuestro objetivo es centralizar esos procesos en una sola aplicación web, con reglas claras y trazabilidad.

**Acciones:**

- Mencionar tres problemas concretos.
- Explicar por qué una base de datos centralizada y los roles ayudan a resolverlos.

### 3:00–5:00 — Misión, objetivo general y alcance

**Responsable:** Integrante 1  
**Pantalla:** Sección 2 y 4 del informe.

**Guion:**

> La misión del sistema es proporcionar a las pequeñas y medianas empresas una herramienta web confiable para controlar sus existencias y operaciones comerciales. El objetivo general es desarrollar e implementar un sistema que integre proveedores, productos, compras, ventas, notas, movimientos y existencias, con acceso seguro por roles y reportes.
>
> El alcance incluye seguridad, catálogos, operaciones, inventario, reportes y parámetros. No incluye contabilidad general, facturación electrónica fiscal, múltiples almacenes, inventario por lotes ni pagos en línea. El ITBMS del 7 % se usa solo como valor inicial configurable, no como una regla fija.

**Acciones:**

- Mostrar la tabla de alcances y límites.
- Aclarar que el impuesto es configurable.

### 5:00–8:00 — Arquitectura y tecnologías

**Responsable:** Integrante 2  
**Pantalla:** Diagrama de arquitectura del informe.

**Guion:**

> La solución tiene tres capas. El frontend está desarrollado en Next.js 15 con React 19, TypeScript y Tailwind CSS. El backend es una API REST en ASP.NET Core 8 con Entity Framework Core. La base de datos es SQL Server 2022. El navegador llama a `/api/*`; Next.js reescribe esas solicitudes al backend configurado en `API_URL`.
>
> La autenticación usa un JWT almacenado en una cookie `httpOnly` llamada `access_token`. Esto evita que JavaScript del navegador lea el token. La API valida el rol en cada endpoint sensible. Los roles son Administrador, Inventario, Ventas y Consulta.

**Acciones:**

- Mostrar el diagrama de arquitectura.
- Abrir Swagger y señalar la documentación de endpoints.
- Explicar brevemente el flujo login → cookie → API.

### 8:00–10:00 — Base de datos y modelo

**Responsable:** Integrante 2  
**Pantalla:** Diagrama entidad-relación.

**Guion:**

> El modelo gira alrededor de productos y documentos. Una compra tiene detalles y genera entradas de inventario. Una venta tiene detalles y genera salidas. Las notas de crédito y débito se relacionan con una venta y también generan movimientos. Cada movimiento guarda saldo anterior, saldo nuevo, costo, usuario, fecha y documento de origen.
>
> Las tablas principales son Roles, Usuarios, Categorías, Productos, Proveedores, Clientes, Compras, Ventas, NotasAjuste, MovimientosInventario, Parámetros, Secuencias y Bitácora. La integridad se garantiza con claves foráneas e índices únicos en códigos y números de documento.

**Acciones:**

- Mostrar el diagrama entidad-relación.
- Señalar las relaciones Compra–Detalle, Venta–Detalle y Nota–Detalle.
- Señalar la relación de MovimientosInventario con Producto y Usuario.

### 10:00–13:00 — Seguridad y roles

**Responsable:** Integrante 2  
**Pantalla:** `/login` y panel con diferentes usuarios.

**Guion:**

> Vamos a iniciar sesión como Administrador. La API valida las credenciales, devuelve un JWT y lo coloca en una cookie `httpOnly`. Si intentamos abrir una ruta sin sesión, el frontend redirige al login.
>
> El menú se adapta al rol. Administrador ve todo; Inventario ve productos, proveedores, compras y ajustes; Ventas ve clientes, ventas y notas; Consulta solo tiene lectura. La seguridad real está en la API, no solo en el menú.

**Acciones:**

1. Iniciar sesión como `admin`.
2. Mostrar el panel y el menú completo.
3. Cerrar sesión.
4. Iniciar sesión como `bodega` y mostrar el menú reducido.
5. Cerrar sesión.
6. Iniciar sesión como `vendedor` y mostrar clientes, ventas y notas.
7. Mencionar que `consulta` solo permite lectura.
8. Volver a iniciar sesión como Administrador para la demostración.

### 13:00–15:00 — Panel de control

**Responsable:** Integrante 3  
**Pantalla:** Panel de control.

**Guion:**

> El panel resume la operación: ventas del día y del mes, compras, productos activos, productos bajo mínimo, movimientos del día, gráfico de los últimos siete días, top de productos y últimas ventas. Los indicadores se calculan en la API con los documentos registrados.

**Acciones:**

- Señalar cada tarjeta.
- Mostrar el gráfico y la tabla de bajo mínimo.
- Abrir **Nueva venta** desde el acceso rápido y regresar.

### 15:00–18:00 — Catálogos y compras

**Responsable:** Integrante 3  
**Pantalla:** Productos, proveedores y compras.

**Guion:**

> En Productos podemos crear y editar artículos, definir categoría, unidad, costo, precio y existencia mínima. La existencia actual no se edita a mano: cambia con las operaciones. Los códigos son únicos y los registros con historial se inactivan, no se eliminan.
>
> En Proveedores registramos los datos de contacto. Ahora vamos a registrar una compra: seleccionamos proveedor, fecha, impuesto, producto, cantidad y costo. Al guardar, el sistema genera el número, aumenta el stock, recalcula el costo promedio y crea un movimiento de entrada.

**Acciones:**

1. Mostrar la tabla de productos y aplicar un filtro.
2. Abrir un producto y mostrar sus datos.
3. Ir a Proveedores y mostrar el listado.
4. Ir a **Compras → Nueva compra**.
5. Seleccionar proveedor y producto.
6. Indicar cantidad y costo.
7. Mostrar el resumen y registrar.
8. Mostrar el detalle imprimible y el nuevo número.
9. Ir a Movimientos y señalar la entrada generada.
10. Opcional: mostrar la anulación como Administrador y explicar la reversión.

### 18:00–21:00 — Ventas

**Responsable:** Integrante 4  
**Pantalla:** Ventas.

**Guion:**

> Para la venta seleccionamos cliente o consumidor final, forma de pago, impuesto y líneas con cantidad, precio y descuento. Antes de guardar, el sistema valida la existencia. Si la cantidad supera el stock y no se permite stock negativo, la venta se rechaza.
>
> Al registrar, se genera el número, se descuenta el inventario, se crea el movimiento de salida y se abre el comprobante. El documento queda disponible para imprimir o para crear una nota.

**Acciones:**

1. Ir a **Ventas → Nueva venta**.
2. Seleccionar cliente y forma de pago.
3. Agregar una línea.
4. Mostrar el total con impuesto y descuento.
5. Registrar.
6. Mostrar el detalle y el movimiento de salida.
7. Intentar una venta con cantidad mayor a la existencia y mostrar el rechazo.
8. Cancelar y regresar al listado.

### 21:00–24:00 — Notas de crédito y débito

**Responsable:** Integrante 4  
**Pantalla:** Detalle de venta y notas.

**Guion:**

> Desde el detalle de una venta podemos crear una nota de crédito o de débito. La nota de crédito se usa para devoluciones o descuentos posteriores: devuelve existencias y reduce el saldo de la venta. La nota de débito se usa para cargos adicionales: descuenta existencias y aumenta el saldo.
>
> El sistema valida que la venta esté registrada, que los productos pertenezcan a la venta, que el crédito acumulado no supere el total y que exista stock para el débito. Solo el Administrador puede anular una nota; la anulación revierte el inventario y conserva el documento.

**Acciones:**

1. Abrir una venta registrada.
2. Presionar **Crear nota**.
3. Mostrar la venta y los productos precargados.
4. Elegir **Crédito**, indicar motivo y cantidad.
5. Registrar y mostrar el movimiento de entrada.
6. Abrir el detalle de la nota e imprimir.
7. Crear una nota de débito desde la misma venta y mostrar la salida.
8. Mostrar la anulación de una nota y explicar la reversión.

### 24:00–27:00 — Movimientos, existencias y kardex

**Responsable:** Integrante 3  
**Pantalla:** Movimientos, Existencias y Kardex.

**Guion:**

> En Movimientos consultamos entradas y salidas por producto, tipo, origen y fecha. Cada fila muestra el saldo anterior y el saldo nuevo. También podemos registrar un ajuste manual con observación y exportar a CSV.
>
> En Existencias vemos la valorización al costo y a la venta, el margen potencial y los productos bajo mínimo. El kardex permite reconstruir el historial de un producto con saldo anterior y nuevo.

**Acciones:**

1. Abrir Movimientos y aplicar un filtro por producto.
2. Mostrar el resumen de entradas y salidas.
3. Registrar un ajuste de entrada de 2 unidades.
4. Abrir Existencias y mostrar el resumen valorizado.
5. Filtrar bajo mínimo.
6. Abrir el kardex de un producto y mostrar los movimientos.
7. Exportar un CSV.

### 27:00–29:00 — Reportes y parámetros

**Responsable:** Integrante 4  
**Pantalla:** Reportes y Parámetros.

**Guion:**

> En Reportes seleccionamos un período y consultamos resumen, ventas, compras, notas, top de productos y bajo mínimo. Podemos exportar la pestaña activa a CSV e imprimir.
>
> En Parámetros el Administrador configura empresa, impuesto, moneda, reglas de inventario, prefijos y duración de sesión. El cambio de impuesto aplica a documentos nuevos; los históricos conservan sus valores. La duración de la sesión se usa al generar el JWT.

**Acciones:**

1. Abrir Reportes y cambiar el rango de fechas.
2. Mostrar la pestaña Resumen.
3. Abrir Ventas y mostrar el filtro de estado.
4. Exportar o imprimir.
5. Abrir Parámetros y mostrar los grupos.
6. Cambiar un valor seguro y guardar; luego restaurarlo.
7. Explicar que los prefijos se aplican a documentos nuevos.

### 29:00–30:00 — Usuarios, perfil y cierre

**Responsable:** Integrante 1  
**Pantalla:** Usuarios, Perfil y portada del informe.

**Guion:**

> En Usuarios el Administrador crea cuentas, asigna roles, activa o desactiva usuarios y restablece contraseñas. En Mi perfil cada usuario puede cambiar su contraseña.
>
> Como conclusión, el sistema integra los procesos principales de inventario, aplica reglas de negocio y conserva trazabilidad. La arquitectura permite publicarlo en Vercel y MonsterASP.NET. Los entregables incluyen el repositorio, la aplicación publicada, el informe y este video. Gracias por su atención; quedamos atentos a las preguntas.

**Acciones:**

- Mostrar el listado de usuarios y el perfil.
- Mostrar la organización de carpetas del repositorio.
- Mostrar la tabla de enlaces del informe.
- Cerrar con la cámara del equipo.

### 30:00–35:00 — Margen

**Uso previsto:**

- responder preguntas del docente;
- repetir una operación si algo falla;
- mostrar el repositorio o los enlaces de Google Drive;
- despedida final.

---

## 4. Lista de tomas de respaldo

Si una operación falla durante la grabación:

1. Tener preparadas capturas de: login, panel, compra, venta, nota, movimientos, existencias, reportes y parámetros.
2. Tener un PDF del informe abierto.
3. Tener el repositorio abierto en GitHub.
4. Tener una grabación corta de respaldo de la operación de compra y venta.
5. Si la base demo se altera, restaurar desde respaldo o reiniciar con el sembrador.

## 5. Especificaciones del video

| Elemento | Recomendación |
|---|---|
| Resolución | 1920 × 1080 |
| Cuadros por segundo | 30 |
| Audio | Micrófono externo o audífonos; sin eco |
| Formato | MP4 |
| Duración | 30 minutos de contenido y hasta 5 de margen |
| Participación | Todos los integrantes deben aparecer y hablar |
| Nombre del archivo | `Sistema_Inventarios_Presentacion_2026.mp4` |
| Almacenamiento | Google Drive con permiso de lectura |

## 6. Publicación en Google Drive

1. Crear una carpeta llamada `Sistema de Inventarios - Entrega final`.
2. Subir:
   - video MP4;
   - informe PDF;
   - capturas o anexos;
   - enlaces a GitHub y a la aplicación publicada.
3. Configurar los permisos como **Cualquier persona con el enlace puede ver**.
4. Copiar los enlaces y pegarlos en Canvas y en la sección de enlaces del informe.

## 7. Distribución de la exposición

| Tema | Quién | Tiempo |
|---|---|---:|
| Introducción, problema y objetivos | _[Integrante 1]_ | 5 min |
| Arquitectura, base de datos y seguridad | _[Integrante 2]_ | 5 min |
| Catálogos, compras, movimientos y existencias | _[Integrante 3]_ | 8 min |
| Ventas, notas, reportes y parámetros | _[Integrante 4]_ | 8 min |
| Usuarios, cierre y preguntas | _[Integrante 1]_ | 4 min |

> Si el equipo tiene menos integrantes, cada persona asume más de una sección. Todos deben hablar al menos una vez.

# Checklist de entrega

## Sistema de Inventarios — 31 de octubre de 2026

Este checklist relaciona los requisitos del curso con el estado del proyecto y los pendientes que dependen de datos externos.

---

## 1. Requisitos mínimos del proyecto

| Requisito | Implementación | Estado |
|---|---|---|
| Proveedores | CRUD lógico, búsqueda, activación | Completado |
| Productos | CRUD, precios, costo, existencia mínima | Completado |
| Compras | Registro, detalle, impresión y anulación | Completado |
| Ventas | Registro, validación de stock, detalle y anulación | Completado |
| Notas de crédito | Registro desde venta, devolución de stock y anulación | Completado |
| Notas de débito | Registro desde venta, salida de stock y anulación | Completado |
| Movimientos de entrada | Compras, notas de crédito, ajustes y reversiones | Completado |
| Movimientos de salida | Ventas, notas de débito, ajustes y reversiones | Completado |
| Listado de existencias | Valorización, filtros, bajo mínimo y CSV | Completado |
| Acceso de seguridad | Login, JWT, cookie httpOnly y roles | Completado |
| Menú principal | Navegación lateral por rol | Completado |
| Parámetros del sistema | Empresa, impuesto, moneda, inventario, prefijos y sesión | Completado |
| Movimientos / procesos | Registro, consulta, filtros, resumen y ajuste | Completado |
| Consultas / reportes | Resumen, ventas, compras, notas, top y bajo mínimo | Completado |

## 2. Documento exigido

| Apartado | Ubicación | Estado |
|---|---|---|
| Misión | `docs/informe.md`, sección 2.1 | Completado |
| Visión | `docs/informe.md`, sección 2.2 | Completado |
| Objetivo general | `docs/informe.md`, sección 2.3 | Completado |
| Objetivos específicos | `docs/informe.md`, sección 2.4 | Completado |
| Requerimientos funcionales | `docs/informe.md`, sección 5 | Completado |
| Requerimientos no funcionales | `docs/informe.md`, sección 6 | Completado |
| Reglas de negocio | `docs/informe.md`, sección 7 | Completado |
| Alcances | `docs/informe.md`, sección 4.1 | Completado |
| Límites | `docs/informe.md`, sección 4.2 | Completado |
| Módulos funcionales | `docs/informe.md`, sección 8 | Completado |
| Diagrama de clases | `docs/informe.md`, sección 12 | Completado |
| Diagrama entidad-relación | `docs/informe.md`, sección 13 | Completado |
| Cronograma | `docs/informe.md`, sección 16 | Completado |
| Porcentaje de participación | `docs/informe.md`, sección 17 | Plantilla; faltan nombres reales |

## 3. Entregables

| Entregable | Estado | Observación |
|---|---|---|
| Aplicación funcional local | Completado | Backend en 5279 y frontend en 3000. |
| Aplicación publicada en web | Pendiente | Requiere cuentas de Vercel y MonsterASP.NET. |
| Frontend en GitHub | Pendiente | Repositorio local listo para inicializar. |
| Backend en GitHub | Pendiente | Mismo repositorio, carpeta `backend/`. |
| Informe PDF | Completado | `docs/informe.pdf`, 28 páginas con diagramas renderizados. |
| Informe en Google Drive | Pendiente | Subir PDF y configurar permiso de lectura. |
| Video de 30 minutos | Pendiente | Guion completo en `docs/guion-video.md`. |
| Video en Google Drive | Pendiente | Subir MP4 y configurar permiso de lectura. |
| Enlaces en Canvas | Pendiente | Copiar enlaces de app, GitHub, informe y video. |
| Participación de todos los integrantes | Pendiente | Completar nombres y grabar. |

## 4. Datos que debe proporcionar el equipo

- [ ] Nombre completo de cada integrante.
- [ ] Cédula de cada integrante.
- [ ] Nombre del docente o facilitador.
- [ ] Nombre de la asignatura y sección.
- [ ] Porcentaje real de participación.
- [ ] Usuario de GitHub.
- [ ] Decisión: repositorio público o privado.
- [ ] Correo de la cuenta de Vercel.
- [ ] Cuenta y plan de MonsterASP.NET.
- [ ] Dominio o subdominio para el frontend y el backend.
- [ ] Enlaces de Google Drive.
- [ ] Fecha y hora de grabación del video.

## 5. Checklist técnico previo a publicar

### Código

- [x] Backend compila sin errores.
- [x] Frontend compila sin errores.
- [x] Migración inicial aplicada.
- [x] Datos demo cargados.
- [x] Flujos de compra, venta, nota y ajuste probados.
- [x] Documentos de prueba depurados.
- [x] `.gitignore` configurado.
- [x] Variables de entorno de ejemplo creadas.
- [x] Revisar que no haya secretos reales en el repositorio.
- [x] Inicializar Git y hacer el primer commit.
- [ ] Crear repositorio remoto y subir.

### Seguridad

- [x] Contraseñas con hash.
- [x] JWT en cookie `httpOnly`.
- [x] Autorización por roles en la API.
- [x] Middleware de errores.
- [x] Bitácora de acciones.
- [ ] Cambiar contraseñas demo en producción.
- [ ] Generar una clave JWT de producción.
- [ ] Configurar `Auth__CookieSegura=true`.
- [ ] Restringir CORS al dominio del frontend.
- [ ] Evaluar deshabilitar Swagger en producción o protegerlo.

### Base de datos

- [x] SQL Server local funcionando.
- [x] Migración y siembra automática.
- [ ] Crear base en el hosting.
- [ ] Configurar usuario de aplicación con permisos mínimos.
- [ ] Programar respaldo automático.
- [ ] Probar restauración.

### Despliegue

- [ ] Publicar backend en MonsterASP.NET.
- [ ] Verificar `/api/health` público.
- [ ] Publicar frontend en Vercel con `API_URL`.
- [ ] Probar login en producción.
- [ ] Probar compra, venta y nota en producción.
- [ ] Probar impresión y CSV en producción.
- [ ] Verificar cookies y HTTPS.
- [ ] Probar en móvil.

### Documentación y entrega

- [ ] Completar nombres y porcentajes.
- [x] Exportar el informe a PDF.
- [x] Revisar que los diagramas Mermaid se vean en el PDF.
- [ ] Grabar el video con todos los integrantes.
- [ ] Verificar audio y duración.
- [ ] Subir informe y video a Google Drive.
- [ ] Configurar permisos de lectura.
- [ ] Agregar enlaces al informe.
- [ ] Publicar enlaces en Canvas antes del 31 de octubre de 2026.

## 6. Enlaces finales

| Recurso | Enlace |
|---|---|
| Repositorio GitHub | _[Pendiente]_ |
| Frontend en Vercel | _[Pendiente]_ |
| Backend en MonsterASP.NET | _[Pendiente]_ |
| Informe PDF en Google Drive | _[Pendiente]_ |
| Video en Google Drive | _[Pendiente]_ |
| Publicación en Canvas | _[Pendiente]_ |

## 7. Criterio de cierre

La entrega se considera cerrada cuando los seis enlaces de la tabla anterior estén completos, el video tenga una duración mínima de 30 minutos con participación de todos los integrantes y la aplicación publicada permita iniciar sesión y ejecutar al menos una compra, una venta y una nota.

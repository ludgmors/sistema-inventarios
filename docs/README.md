# Documentación del Sistema de Inventarios

Esta carpeta reúne los documentos de análisis, diseño, operación, pruebas y entrega del proyecto.

> Para una visión consolidada del estado, la arquitectura, los comandos y los pendientes, consultar [`../CONTEXTO.md`](../CONTEXTO.md). Para arrancar el proyecto paso a paso, consultar [`../COMO-EJECUTAR.md`](../COMO-EJECUTAR.md).

## Contenido

- [Panel administrativo](panel-administrativo.md): gestión de accesos y jerarquía Administrador/Superadmin.

- [Seguridad del acceso](seguridad-login.md): sesiones revocables, límites, CSRF y recuperación por correo.

| Documento | Descripción |
|---|---|
| [Informe del proyecto](informe.md) | Misión, objetivos, requerimientos, reglas, alcances, límites, módulos, diagramas, cronograma y participación. |
| [Informe en PDF](informe.pdf) | Versión imprimible del informe con los diagramas renderizados. |
| [Manual de usuario](manual-usuario.md) | Acceso, menú y uso paso a paso de cada módulo. |
| [Guía de despliegue](despliegue.md) | Instalación local, GitHub, Vercel, MonsterASP.NET, SQL Server y variables de entorno. |
| [Matriz de pruebas](pruebas.md) | Pruebas técnicas, funcionales, de seguridad y pendientes de aceptación. |
| [Checklist de entrega](checklist-entrega.md) | Control de requisitos, entregables y pendientes. |

## Orden sugerido de lectura

1. **Informe:** para comprender el problema, el alcance y las decisiones de diseño.
2. **Manual:** para operar la aplicación.
3. **Despliegue:** para ejecutar o publicar el sistema.
4. **Pruebas:** para verificar el funcionamiento.
5. **Guion:** para preparar la presentación.
6. **Checklist:** para confirmar que no falte ningún entregable.

## Diagramas

Los diagramas están escritos en **Mermaid** dentro del informe. GitHub los renderiza automáticamente. Para exportarlos a PDF se puede usar:

- la extensión **Markdown Preview Mermaid Support** de Visual Studio Code;
- el editor en línea <https://mermaid.live>;
- una herramienta de conversión de Markdown a PDF que soporte Mermaid.

## Nota sobre los datos pendientes

Los nombres de los integrantes, cédulas, porcentajes, enlaces de GitHub, dominios de despliegue y enlaces de Google Drive están marcados como `[Pendiente]` o `[Integrante]`. Deben completarse antes de la entrega final.

## Regenerar el informe PDF

Requisitos: Python 3, el paquete `markdown` y Microsoft Edge.

```powershell
python -m pip install markdown
python docs/generar-informe.py
```

Luego imprimir `docs/informe.html` a PDF con Edge en modo headless:

```powershell
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$html = (Resolve-Path "docs/informe.html").Path.Replace("\", "/")
$pdf = (Join-Path (Get-Location) "docs/informe.pdf")
$url = "file:///$html"
& $edge --headless=new --disable-gpu --no-pdf-header-footer `
  --print-to-pdf="$pdf" --virtual-time-budget=25000 `
  --run-all-compositor-stages-before-draw "$url"
```

Los diagramas Mermaid se cargan desde el CDN de jsDelivr. Si no hay conexión, se debe usar una copia local de Mermaid o exportar los diagramas por separado.

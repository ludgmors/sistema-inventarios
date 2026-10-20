"""Genera una versión HTML imprimible del informe a partir de Markdown.

Uso:
    python docs/generar-informe.py

El HTML resultante incluye los diagramas Mermaid y puede imprimirse a PDF con
Microsoft Edge en modo headless. El comando utilizado se documenta al final.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

import markdown

BASE = Path(__file__).resolve().parent
ORIGEN = BASE / "informe.md"
DESTINO = BASE / "informe.html"

CSS = """
@page {
  size: A4;
  margin: 17mm 15mm 18mm 15mm;
}

* {
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.48;
  color: #1f2937;
  margin: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

h1 {
  font-size: 24pt;
  color: #0f172a;
  margin: 0 0 6mm;
  line-height: 1.15;
}

h1:first-of-type {
  font-size: 32pt;
  margin-top: 38mm;
  padding-bottom: 6mm;
  border-bottom: 4px solid #0f766e;
}

h1 + h2 {
  page-break-before: avoid;
  break-before: avoid;
}

h2 {
  font-size: 16pt;
  color: #0f766e;
  border-bottom: 1.5px solid #99f6e4;
  padding-bottom: 2mm;
  margin: 0 0 4mm;
  page-break-before: always;
  break-before: page;
}

h3 {
  font-size: 12.5pt;
  color: #115e59;
  margin: 5mm 0 2mm;
  page-break-after: avoid;
  break-after: avoid;
}

h4 {
  font-size: 11pt;
  color: #134e4a;
  margin: 4mm 0 1.5mm;
}

p, ul, ol {
  margin: 0 0 3mm;
}

ul, ol {
  padding-left: 7mm;
}

li {
  margin-bottom: 1.2mm;
}

a {
  color: #0f766e;
  text-decoration: none;
}

strong {
  color: #111827;
}

blockquote {
  margin: 3mm 0;
  padding: 3mm 4mm;
  background: #f0fdfa;
  border-left: 4px solid #14b8a6;
  color: #134e4a;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 3mm 0 5mm;
  font-size: 8.9pt;
  page-break-inside: auto;
}

thead {
  display: table-header-group;
}

tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

th, td {
  border: 1px solid #cbd5e1;
  padding: 1.4mm 1.8mm;
  vertical-align: top;
  text-align: left;
  overflow-wrap: anywhere;
}

th:first-child,
td:first-child {
  white-space: nowrap;
}

table.cols-1 th,
table.cols-2 th,
table.cols-3 th,
table.cols-4 th,
table.cols-5 th {
  white-space: nowrap;
}

th {
  background: #ccfbf1;
  color: #134e4a;
  font-weight: 600;
}

tr:nth-child(even) td {
  background: #f8fafc;
}

code {
  font-family: Consolas, "Courier New", monospace;
  font-size: 8.8pt;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  padding: 0.3mm 1mm;
}

pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 3mm;
  border-radius: 2mm;
  overflow-x: auto;
  font-size: 8.5pt;
  page-break-inside: avoid;
}

pre code {
  background: transparent;
  border: 0;
  color: inherit;
  padding: 0;
}

hr {
  border: 0;
  border-top: 1px solid #cbd5e1;
  margin: 6mm 0;
}

.mermaid {
  margin: 4mm 0 6mm;
  padding: 3mm;
  border: 1px solid #e2e8f0;
  border-radius: 2mm;
  background: #ffffff;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
  overflow: hidden;
}

.mermaid svg {
  max-width: 100% !important;
  height: auto !important;
}

img {
  max-width: 100%;
}

.footer-note {
  margin-top: 8mm;
  font-size: 8.5pt;
  color: #64748b;
  text-align: center;
}

@media print {
  a::after {
    content: "";
  }
}
"""

PLANTILLA = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sistema de Inventarios - Informe</title>
<style>__CSS__</style>
</head>
<body>
__CONTENIDO__
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    fontFamily: "Segoe UI, Arial, sans-serif",
    themeVariables: {
      primaryColor: "#ccfbf1",
      primaryTextColor: "#134e4a",
      primaryBorderColor: "#0f766e",
      lineColor: "#475569",
      secondaryColor: "#f1f5f9",
      tertiaryColor: "#ffffff",
      noteBkgColor: "#fef9c3",
      noteTextColor: "#422006"
    }
  });

  try {
    await mermaid.run({ querySelector: ".mermaid" });
    document.documentElement.dataset.mermaid = "ok";
  } catch (error) {
    console.error(error);
    document.documentElement.dataset.mermaid = "error";
  }
</script>
</body>
</html>
"""


def main() -> None:
    texto = ORIGEN.read_text(encoding="utf-8")
    texto = re.sub(
        r"<!-- pdf-inicio-oculto -->.*?<!-- pdf-fin-oculto -->",
        "",
        texto,
        flags=re.DOTALL,
    )
    bloques: list[str] = []

    def reemplazar(match: re.Match[str]) -> str:
        bloque = html.escape(match.group(1).strip(), quote=False)
        bloques.append(bloque)
        return f"\n\n@@MERMAID_{len(bloques) - 1}@@\n\n"

    sin_mermaid = re.sub(r"```mermaid\s*\n(.*?)```", reemplazar, texto, flags=re.DOTALL)

    contenido = markdown.markdown(
        sin_mermaid,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
        output_format="html5",
    )

    def clasificar_tabla(match: re.Match[str]) -> str:
        tabla = match.group(0)
        columnas = tabla.count("<th")
        return tabla.replace("<table>", f'<table class="cols-{columnas}">', 1)

    contenido = re.sub(r"<table>.*?</table>", clasificar_tabla, contenido, flags=re.DOTALL)

    for indice, bloque in enumerate(bloques):
        contenido = contenido.replace(
            f"@@MERMAID_{indice}@@",
            f'<div class="mermaid">{bloque}</div>',
        )

    contenido += (
        '<p class="footer-note">Sistema de Inventarios · '
        'Documento generado para la entrega académica de octubre de 2026.</p>'
    )

    salida = PLANTILLA.replace("__CSS__", CSS).replace("__CONTENIDO__", contenido)
    DESTINO.write_text(salida, encoding="utf-8")
    print(f"HTML generado: {DESTINO}")


if __name__ == "__main__":
    main()

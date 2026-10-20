"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  tamanoPagina,
  onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanoPagina: number;
  onCambiar: (pagina: number) => void;
}) {
  if (total === 0) return null;

  const desde = (pagina - 1) * tamanoPagina + 1;
  const hasta = Math.min(pagina * tamanoPagina, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        Mostrando <span className="font-semibold text-slate-700">{desde}</span>–
        <span className="font-semibold text-slate-700">{hasta}</span> de{" "}
        <span className="font-semibold text-slate-700">{total}</span> registros
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-xs font-medium text-slate-600">
          Página {pagina} de {Math.max(totalPaginas, 1)}
        </span>

        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

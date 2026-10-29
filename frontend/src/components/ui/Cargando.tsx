"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function Cargando({ texto = "Cargando información…" }: { texto?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-700 dark:text-emerald-300" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function PantallaCargando() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Cargando Sistema de Inventarios…</p>
    </div>
  );
}

export function EstadoVacio({
  titulo = "No hay registros",
  descripcion = "No se encontraron datos para los filtros seleccionados.",
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{titulo}</p>
      <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">{descripcion}</p>
      {accion}
    </div>
  );
}

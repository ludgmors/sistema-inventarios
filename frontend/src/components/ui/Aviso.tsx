"use client";

import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tono = "exito" | "error" | "aviso" | "info";

const estilos: Record<Tono, { caja: string; icono: ReactNode }> = {
  exito: {
    caja: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200",
    icono: <CheckCircle2 className="h-4 w-4" />,
  },
  error: {
    caja: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200",
    icono: <AlertCircle className="h-4 w-4" />,
  },
  aviso: {
    caja: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200",
    icono: <TriangleAlert className="h-4 w-4" />,
  },
  info: {
    caja: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200",
    icono: <Info className="h-4 w-4" />,
  },
};

export function Aviso({
  tono = "info",
  children,
}: {
  tono?: Tono;
  children: ReactNode;
}) {
  const estilo = estilos[tono];

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${estilo.caja}`}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{estilo.icono}</span>
      <div>{children}</div>
    </div>
  );
}

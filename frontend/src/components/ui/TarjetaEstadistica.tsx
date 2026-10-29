import type { ReactNode } from "react";

type Tono = "verde" | "azul" | "ambar" | "rojo" | "violeta";

const tonos: Record<Tono, { icono: string; fondo: string }> = {
  verde: { icono: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300", fondo: "from-emerald-50/60 dark:from-emerald-950/60" },
  azul: { icono: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300", fondo: "from-blue-50/60 dark:from-blue-950/60" },
  ambar: { icono: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300", fondo: "from-amber-50/60 dark:from-amber-950/60" },
  rojo: { icono: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300", fondo: "from-red-50/60 dark:from-red-950/60" },
  violeta: { icono: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300", fondo: "from-violet-50/60 dark:from-violet-950/60" },
};

export function TarjetaEstadistica({
  titulo,
  valor,
  detalle,
  icono,
  tono = "verde",
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: ReactNode;
  tono?: Tono;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br to-white dark:bg-slate-900 dark:to-slate-900 p-5 shadow-sm ${tonos[tono].fondo}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detalle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tonos[tono].icono}`}>
          {icono}
        </div>
      </div>
    </div>
  );
}

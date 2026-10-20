import type { ReactNode } from "react";

type Tono = "verde" | "azul" | "ambar" | "rojo" | "violeta";

const tonos: Record<Tono, { icono: string; fondo: string }> = {
  verde: { icono: "bg-emerald-50 text-emerald-700", fondo: "from-emerald-50/60" },
  azul: { icono: "bg-blue-50 text-blue-700", fondo: "from-blue-50/60" },
  ambar: { icono: "bg-amber-50 text-amber-700", fondo: "from-amber-50/60" },
  rojo: { icono: "bg-red-50 text-red-700", fondo: "from-red-50/60" },
  violeta: { icono: "bg-violet-50 text-violet-700", fondo: "from-violet-50/60" },
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
      className={`rounded-xl border border-slate-200 bg-gradient-to-br to-white p-5 shadow-sm ${tonos[tono].fondo}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tonos[tono].icono}`}>
          {icono}
        </div>
      </div>
    </div>
  );
}

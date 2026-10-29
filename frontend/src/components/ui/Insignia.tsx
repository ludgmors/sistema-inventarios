import type { ReactNode } from "react";

type Tono = "verde" | "rojo" | "amarillo" | "azul" | "gris" | "morado";

const tonos: Record<Tono, string> = {
  verde: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20",
  rojo: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-red-600/20",
  amarillo: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-600/20",
  azul: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-blue-600/20",
  gris: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-500/20",
  morado: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-violet-600/20",
};

export function Insignia({
  children,
  tono = "gris",
}: {
  children: ReactNode;
  tono?: Tono;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

export function InsigniaEstado({ estado }: { estado: string }) {
  const normalizado = estado?.toLowerCase() ?? "";

  if (normalizado === "registrada") return <Insignia tono="verde">Registrada</Insignia>;
  if (normalizado === "anulada") return <Insignia tono="rojo">Anulada</Insignia>;
  if (normalizado === "credito") return <Insignia tono="azul">Crédito</Insignia>;
  if (normalizado === "debito") return <Insignia tono="morado">Débito</Insignia>;
  if (normalizado === "entrada") return <Insignia tono="verde">Entrada</Insignia>;
  if (normalizado === "salida") return <Insignia tono="rojo">Salida</Insignia>;

  return <Insignia>{estado}</Insignia>;
}

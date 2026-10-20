"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "peligro" | "fantasma" | "oscuro";
type Tamano = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: ReactNode;
}

const estilosVariante: Record<Variante, string> = {
  primario:
    "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-700 shadow-sm",
  secundario:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400 shadow-sm",
  peligro:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-sm",
  fantasma:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400",
  oscuro:
    "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900 shadow-sm",
};

const estilosTamano: Record<Tamano, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  icono,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${estilosVariante[variante]} ${estilosTamano[tamano]} ${className}`}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : icono}
      {children}
    </button>
  );
}

"use client";
import { Sun, Moon } from "lucide-react";
import { useTema } from "./ProveedorTema";
export function SelectorTema() {
  const { tema, cambiarTema } = useTema();
  return <div role="group" aria-label="Tema de color" className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
    {([{ valor: "claro", texto: "Claro", Icono: Sun }, { valor: "oscuro", texto: "Oscuro", Icono: Moon }] as const).map(({ valor, texto, Icono }) => (
      <button key={valor} type="button" onClick={() => cambiarTema(valor)} aria-pressed={tema === valor} aria-label={`Tema ${texto.toLowerCase()}`} title={`Tema ${texto.toLowerCase()}`}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-500 ${tema === valor ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}>
        <Icono className="h-4 w-4" aria-hidden="true" /><span className="hidden md:inline">{texto}</span>
      </button>
    ))}
  </div>;
}

"use client";

import type { ReactNode } from "react";
import { Cargando, EstadoVacio } from "./Cargando";

export interface Columna<T> {
  clave: string;
  titulo: string;
  render: (fila: T) => ReactNode;
  alineacion?: "izquierda" | "derecha" | "centro";
  className?: string;
}

export function Tabla<T>({
  columnas,
  datos,
  cargando = false,
  vacio = "No hay registros para mostrar.",
  pie,
  filaClave,
}: {
  columnas: Columna<T>[];
  datos: T[];
  cargando?: boolean;
  vacio?: string;
  pie?: ReactNode;
  filaClave: (fila: T) => string | number;
}) {
  const alineacion = {
    izquierda: "text-left",
    derecha: "text-right",
    centro: "text-center",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  className={`whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${alineacion[columna.alineacion ?? "izquierda"]} ${columna.className ?? ""}`}
                >
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {cargando ? (
              <tr>
                <td colSpan={columnas.length}>
                  <Cargando />
                </td>
              </tr>
            ) : datos.length === 0 ? (
              <tr>
                <td colSpan={columnas.length}>
                  <EstadoVacio titulo={vacio} />
                </td>
              </tr>
            ) : (
              datos.map((fila) => (
                <tr
                  key={filaClave(fila)}
                  className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                >
                  {columnas.map((columna) => (
                    <td
                      key={columna.clave}
                      className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${alineacion[columna.alineacion ?? "izquierda"]}`}
                    >
                      {columna.render(fila)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pie}
    </div>
  );
}

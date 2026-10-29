import type { ReactNode } from "react";

export function Tarjeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function TarjetaSeccion({
  titulo,
  descripcion,
  acciones,
  children,
  className = "",
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tarjeta className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{descripcion}</p>}
        </div>
        {acciones}
      </div>
      <div className="p-5">{children}</div>
    </Tarjeta>
  );
}

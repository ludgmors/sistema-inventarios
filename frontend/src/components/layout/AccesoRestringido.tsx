"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function AccesoRestringido() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-6 py-16 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">Acceso restringido</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Tu rol no tiene permiso para abrir esta sección. Si necesitas acceso,
        solicita al administrador que revise tus permisos.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>
    </div>
  );
}

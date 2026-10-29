"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const claseBase =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400";

interface CampoProps {
  etiqueta?: string;
  htmlFor?: string;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}

export function Campo({
  etiqueta,
  htmlFor,
  requerido,
  error,
  ayuda,
  children,
  className = "",
}: CampoProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          {etiqueta}
          {requerido && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : ayuda ? (
        <p className="text-xs text-slate-400">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Entrada({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${claseBase} ${className}`} />;
}

export function Seleccion({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${claseBase} ${className}`}>
      {children}
    </select>
  );
}

export function AreaTexto({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${claseBase} min-h-20 resize-y ${className}`} />;
}

"use client";
import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function MenuPerfil() {
  const { usuario, tieneRol, cerrarSesion } = useAuth();
  const detalle = useRef<HTMLDetailsElement>(null);
  const ruta = usePathname();
  useEffect(() => { detalle.current?.removeAttribute('open'); }, [ruta]);
  useEffect(() => {
    const cerrar = (e: PointerEvent) => { if (!detalle.current?.contains(e.target as Node)) detalle.current?.removeAttribute('open'); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && detalle.current?.open) { detalle.current.removeAttribute('open'); detalle.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', cerrar); document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', cerrar); document.removeEventListener('keydown', tecla); };
  }, []);
  const iniciales = (usuario?.nombreCompleto ?? '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const enlace = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-slate-200 dark:hover:bg-slate-800';
  return <details ref={detalle} className="relative">
    <summary aria-label="Opciones de mi cuenta" className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-emerald-500 [&::-webkit-details-marker]:hidden">
      <span className="hidden text-right sm:block"><span className="block max-w-44 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{usuario?.nombreCompleto}</span><span className="block text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{usuario?.rol}</span></span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">{iniciales || 'SI'}</span>
      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
    </summary>
    <nav aria-label="Opciones de mi cuenta" className="absolute right-0 top-full z-40 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 border-b border-slate-100 px-3 py-3 dark:border-slate-800"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{usuario?.nombreCompleto}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{usuario?.correo}</p><p className="mt-1 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">{usuario?.rol}</p></div>
      {tieneRol('Administrador') && <Link href="/administracion" className={enlace}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Panel administrativo</Link>}
      <Link href="/perfil" className={enlace}><UserRound className="h-4 w-4" aria-hidden="true" />Mi perfil</Link>
      <button type="button" onClick={() => { detalle.current?.removeAttribute('open'); void cerrarSesion(); }} className={`${enlace} w-full text-red-600 dark:text-red-400`}><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión</button>
    </nav>
  </details>;
}

"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type Tema = "claro" | "oscuro";
import { claveTema as clave } from "@/lib/tema";
const ContextoTema = createContext<{ tema: Tema; cambiarTema: (tema: Tema) => void } | null>(null);
export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("oscuro");
  const aplicar = (nuevo: Tema) => { document.documentElement.dataset.tema = nuevo; setTema(nuevo); };
  useEffect(() => {
    const leer = () => {
      let guardado: string | null = null;
      try { guardado = localStorage.getItem(clave); } catch { /* Preferencia del sistema si el almacenamiento está bloqueado. */ }
      aplicar(guardado === "claro" || guardado === "oscuro" ? guardado : matchMedia('(prefers-color-scheme: dark)').matches ? "oscuro" : "claro");
    };
    leer();
    const cambio = (e: StorageEvent) => { if (e.key === clave || e.key === null) leer(); };
    const sistema = matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('storage', cambio); sistema.addEventListener('change', leer);
    return () => { window.removeEventListener('storage', cambio); sistema.removeEventListener('change', leer); };
  }, []);
  const cambiarTema = (nuevo: Tema) => { aplicar(nuevo); try { localStorage.setItem(clave, nuevo); } catch { /* Conservar durante esta visita. */ } };
  return <ContextoTema.Provider value={{ tema, cambiarTema }}>{children}</ContextoTema.Provider>;
}
export function useTema() {
  const contexto = useContext(ContextoTema);
  if (!contexto) throw new Error("Falta el proveedor de tema.");
  return contexto;
}

"use client";

import { CalendarDays, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { fechaLarga } from "@/lib/formato";

const titulos: { ruta: string; titulo: string }[] = [
  { ruta: "/productos", titulo: "Productos" },
  { ruta: "/categorias", titulo: "Categorías" },
  { ruta: "/proveedores", titulo: "Proveedores" },
  { ruta: "/clientes", titulo: "Clientes" },
  { ruta: "/compras/nueva", titulo: "Registrar compra" },
  { ruta: "/compras", titulo: "Compras" },
  { ruta: "/ventas/nueva", titulo: "Registrar venta" },
  { ruta: "/ventas", titulo: "Ventas" },
  { ruta: "/notas/nueva", titulo: "Registrar nota" },
  { ruta: "/notas", titulo: "Notas de crédito y débito" },
  { ruta: "/movimientos", titulo: "Movimientos de inventario" },
  { ruta: "/existencias", titulo: "Existencias" },
  { ruta: "/reportes", titulo: "Reportes" },
  { ruta: "/parametros", titulo: "Parámetros del sistema" },
  { ruta: "/usuarios", titulo: "Usuarios y roles" },
  { ruta: "/perfil", titulo: "Mi perfil" },
];

export function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const ruta = usePathname();
  const { usuario, cerrarSesion } = useAuth();

  const titulo =
    titulos
      .filter((item) => ruta === item.ruta || ruta.startsWith(`${item.ruta}/`))
      .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.titulo ??
    (ruta === "/" ? "Panel de control" : "Sistema de Inventarios");

  const iniciales = (usuario?.nombreCompleto ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <header className="no-imprimir sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-800">{titulo}</h2>
          <p className="hidden items-center gap-1 text-[11px] text-slate-400 first-letter:uppercase sm:flex">
            <CalendarDays className="h-3 w-3" />
            {fechaLarga()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-slate-800">{usuario?.nombreCompleto}</p>
          <p className="text-[10px] uppercase tracking-wide text-emerald-700">{usuario?.rol}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
          {iniciales || "SI"}
        </div>

        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

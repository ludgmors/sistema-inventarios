"use client";

import { CalendarDays, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { MenuPerfil } from "./MenuPerfil";
import { fechaLarga } from "@/lib/formato";
import { SelectorTema } from "@/components/tema/SelectorTema";

const titulos: { ruta: string; titulo: string }[] = [
  { ruta: "/administracion/usuarios", titulo: "Administración · Usuarios y roles" },
  { ruta: "/administracion", titulo: "Panel administrativo" },
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

  const titulo =
    titulos
      .filter((item) => ruta === item.ruta || ruta.startsWith(`${item.ruta}/`))
      .sort((a, b) => b.ruta.length - a.ruta.length)[0]?.titulo ??
    (ruta === "/" ? "Panel de control" : "Sistema de Inventarios");

  return (
    <header className="no-imprimir sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{titulo}</h2>
          <p className="hidden items-center gap-1 text-[11px] text-slate-400 first-letter:uppercase sm:flex">
            <CalendarDays className="h-3 w-3" />
            {fechaLarga()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SelectorTema />
        <MenuPerfil />
      </div>
    </header>
  );
}

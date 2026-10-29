"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Rol } from "@/lib/tipos";
import { useAuth } from "./AuthProvider";
import { AccesoRestringido } from "./AccesoRestringido";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const permisosRuta: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: "/categorias", roles: ["Administrador", "Inventario"] },
  { prefijo: "/proveedores", roles: ["Administrador", "Inventario"] },
  { prefijo: "/clientes", roles: ["Administrador", "Ventas"] },
  { prefijo: "/compras", roles: ["Administrador", "Inventario"] },
  { prefijo: "/ventas", roles: ["Administrador", "Ventas"] },
  { prefijo: "/notas", roles: ["Administrador", "Ventas"] },
  { prefijo: "/parametros", roles: ["Administrador"] },
  { prefijo: "/usuarios", roles: ["Administrador"] },
];

function puedeAbrir(ruta: string, rol: Rol): boolean {
  return !permisosRuta.some(
    (permiso) =>
      (ruta === permiso.prefijo || ruta.startsWith(`${permiso.prefijo}/`)) &&
      !permiso.roles.includes(rol),
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ruta = usePathname();
  const { usuario } = useAuth();
  const permitida = usuario ? puedeAbrir(ruta, usuario.rol) : false;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="lg:pl-64 print:pl-0">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />

        <main className="mx-auto w-full max-w-[1600px] p-4 lg:p-8 print:p-0">
          {permitida ? children : <AccesoRestringido />}
        </main>
      </div>
    </div>
  );
}

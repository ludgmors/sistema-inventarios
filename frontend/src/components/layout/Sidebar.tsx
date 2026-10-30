"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Rol } from "@/lib/tipos";

interface ItemMenu {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  roles?: Rol[];
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

const grupos: GrupoMenu[] = [
  {
    titulo: "Principal",
    items: [
      { href: "/", etiqueta: "Panel de control", icono: LayoutDashboard },
    ],
  },
  {
    titulo: "Catálogos",
    items: [
      { href: "/productos", etiqueta: "Productos", icono: Package },
      { href: "/categorias", etiqueta: "Categorías", icono: Tags, roles: ["Administrador", "Inventario"] },
      { href: "/proveedores", etiqueta: "Proveedores", icono: Truck, roles: ["Administrador", "Inventario"] },
      { href: "/clientes", etiqueta: "Clientes", icono: Users, roles: ["Administrador", "Ventas"] },
    ],
  },
  {
    titulo: "Operaciones",
    items: [
      { href: "/compras", etiqueta: "Compras", icono: ShoppingCart, roles: ["Administrador", "Inventario"] },
      { href: "/ventas", etiqueta: "Ventas", icono: Receipt, roles: ["Administrador", "Ventas"] },
      { href: "/notas", etiqueta: "Notas de ajuste", icono: FileText, roles: ["Administrador", "Ventas"] },
    ],
  },
  {
    titulo: "Inventario",
    items: [
      { href: "/movimientos", etiqueta: "Movimientos", icono: ArrowLeftRight },
      { href: "/existencias", etiqueta: "Existencias", icono: Warehouse },
    ],
  },
  {
    titulo: "Análisis",
    items: [
      { href: "/reportes", etiqueta: "Reportes", icono: BarChart3 },
    ],
  },
  {
    titulo: "Configuración",
    items: [
      { href: "/parametros", etiqueta: "Parámetros", icono: Settings, roles: ["Administrador"] },
      { href: "/perfil", etiqueta: "Mi perfil", icono: Users },
    ],
  },
];

export function Sidebar({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const ruta = usePathname();
  const { usuario, tieneRol } = useAuth();

  const esActivo = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  const contenido = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={onCerrar}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-900/40">
            <Boxes className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-white">Inventarios</span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Gestión empresarial
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {grupos.map((grupo) => {
          const items = grupo.items.filter(
            (item) => !item.roles || tieneRol(...item.roles),
          );

          if (items.length === 0) return null;

          return (
            <div key={grupo.titulo}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {grupo.titulo}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icono = item.icono;
                  const activo = esActivo(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCerrar}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                        activo
                          ? "bg-emerald-600/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icono className={`h-4 w-4 ${activo ? "text-emerald-400" : ""}`} />
                      {item.etiqueta}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] font-medium text-slate-400">{usuario?.nombreCompleto}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
          {usuario?.rol}
        </p>
        <p className="mt-3 text-[10px] text-slate-600">Sistema de Inventarios v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block print:hidden">
        {contenido}
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCerrar}
            aria-label="Cerrar menú"
          />
          <aside className="relative h-full w-72 shadow-2xl">{contenido}</aside>
        </div>
      )}
    </>
  );
}

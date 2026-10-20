"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  DollarSign,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Aviso } from "@/components/ui/Aviso";
import { Cargando } from "@/components/ui/Cargando";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta, TarjetaSeccion } from "@/components/ui/Tarjeta";
import { TarjetaEstadistica } from "@/components/ui/TarjetaEstadistica";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatoFechaCorta, formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { Dashboard } from "@/lib/tipos";

export default function PaginaPanel() {
  const { usuario, tieneRol } = useAuth();
  const { datos, cargando, error } = useApi<Dashboard>("/api/dashboard");

  if (cargando) return <Cargando texto="Cargando panel de control…" />;

  if (error || !datos) {
    return <Aviso tono="error">{error || "No se pudo cargar el panel."}</Aviso>;
  }

  const maximoTop = Math.max(...datos.topProductos.map((item) => item.cantidadVendida), 1);

  const acciones = [
    {
      href: "/ventas/nueva",
      etiqueta: "Nueva venta",
      icono: Receipt,
      visible: tieneRol("Administrador", "Ventas"),
    },
    {
      href: "/compras/nueva",
      etiqueta: "Nueva compra",
      icono: ShoppingCart,
      visible: tieneRol("Administrador", "Inventario"),
    },
    {
      href: "/movimientos",
      etiqueta: "Movimientos",
      icono: Warehouse,
      visible: true,
    },
  ].filter((accion) => accion.visible);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Resumen general
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Hola, {usuario?.nombreCompleto.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Este es el estado actual de su inventario y sus operaciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {acciones.map((accion) => {
            const Icono = accion.icono;
            return (
              <Link
                key={accion.href}
                href={accion.href}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Icono className="h-4 w-4" />
                {accion.etiqueta}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaEstadistica
          titulo="Ventas de hoy"
          valor={formatoMoneda(datos.ventasHoy)}
          detalle={`${formatoMoneda(datos.ventasMes)} en el mes`}
          icono={<DollarSign className="h-5 w-5" />}
          tono="verde"
        />
        <TarjetaEstadistica
          titulo="Compras del mes"
          valor={formatoMoneda(datos.comprasMes)}
          detalle={`${formatoMoneda(datos.comprasHoy)} registradas hoy`}
          icono={<ShoppingCart className="h-5 w-5" />}
          tono="azul"
        />
        <TarjetaEstadistica
          titulo="Productos activos"
          valor={formatoNumero(datos.productosActivos)}
          detalle={`${datos.proveedoresActivos} proveedores · ${datos.clientesActivos} clientes`}
          icono={<Package className="h-5 w-5" />}
          tono="violeta"
        />
        <TarjetaEstadistica
          titulo="Stock bajo mínimo"
          valor={formatoNumero(datos.productosBajoMinimo)}
          detalle={`${datos.movimientosHoy} movimientos registrados hoy`}
          icono={<AlertTriangle className="h-5 w-5" />}
          tono={datos.productosBajoMinimo > 0 ? "ambar" : "verde"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <TarjetaSeccion
          titulo="Ventas de los últimos 7 días"
          descripcion="Ingresos registrados por día (documentos vigentes)."
          acciones={
            <Link
              href="/reportes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Ver reportes <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datos.ventasUltimosDias} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(valor: string) => formatoFechaCorta(valor)}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(valor: number) => `$${valor}`}
                />
                <Tooltip
                  formatter={(valor) => [formatoMoneda(Number(valor)), "Ventas"]}
                  labelFormatter={(valor) => formatoFechaCorta(String(valor))}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#047857"
                  strokeWidth={2.5}
                  fill="url(#ventas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Productos más vendidos"
          descripcion="Últimos 30 días por cantidad vendida."
        >
          {datos.topProductos.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Aún no hay ventas registradas.
            </p>
          ) : (
            <ul className="space-y-4">
              {datos.topProductos.map((producto, indice) => (
                <li key={producto.productoId}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                        {indice + 1}
                      </span>
                      <span className="truncate font-medium text-slate-700">{producto.nombre}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {formatoNumero(producto.cantidadVendida)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${(producto.cantidadVendida / maximoTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TarjetaSeccion
          titulo="Productos por debajo del mínimo"
          descripcion="Requieren reposición inmediata."
          acciones={<Insignia tono={datos.productosBajoMinimo > 0 ? "amarillo" : "verde"}>{datos.productosBajoMinimo} alertas</Insignia>}
        >
          {datos.productosBajoMinimoLista.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Boxes className="h-8 w-8 text-emerald-500" />
              <p className="text-xs font-medium text-slate-600">Todo el inventario está sobre el mínimo.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {datos.productosBajoMinimoLista.map((producto) => (
                <li key={producto.productoId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{producto.nombre}</p>
                    <p className="text-[11px] text-slate-400">
                      {producto.codigo} · {producto.categoria}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-red-600">{formatoNumero(producto.existenciaActual)}</p>
                    <p className="text-[10px] text-slate-400">mín. {formatoNumero(producto.existenciaMinima)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Últimas ventas"
          descripcion="Documentos recientes registrados en el sistema."
          acciones={
            <Link
              href="/ventas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {datos.ultimasVentas.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Aún no hay ventas registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {datos.ultimasVentas.map((venta) => (
                <li key={venta.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="text-xs font-semibold text-slate-800 hover:text-emerald-700"
                    >
                      {venta.numero}
                    </Link>
                    <p className="truncate text-[11px] text-slate-400">
                      {venta.cliente} · {formatoFechaCorta(venta.fecha)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Insignia tono={venta.estado === "Anulada" ? "rojo" : "verde"}>
                      {venta.estado}
                    </Insignia>
                    <span className="text-xs font-bold text-slate-900">{formatoMoneda(venta.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>
      </div>

      <Tarjeta className="flex flex-wrap items-center justify-between gap-4 border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Inventario valorizado</p>
            <p className="text-xs text-slate-500">
              Consulte el costo y el valor de venta de todas sus existencias.
            </p>
          </div>
        </div>
        <Link
          href="/existencias"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800"
        >
          Ver existencias <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </Tarjeta>
    </div>
  );
}

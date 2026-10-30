"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  DollarSign,
  Download,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InformePanel } from "@/components/panel/InformePanel";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta, TarjetaSeccion } from "@/components/ui/Tarjeta";
import { TarjetaEstadistica } from "@/components/ui/TarjetaEstadistica";
import { useAuth } from "@/components/layout/AuthProvider";
import { mensajeDeError } from "@/lib/api";
import {
  descargarArchivo,
  formatoFechaCorta,
  formatoMoneda,
  formatoNumero,
  variacionPorcentual,
} from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { Dashboard, Parametro } from "@/lib/tipos";

const COLORES_PAGO = ["#047857", "#2563EB", "#7C3AED", "#D97706", "#DC2626", "#0891B2"];

const estiloTooltip = {
  borderRadius: 10,
  border: "1px solid var(--borde)",
  backgroundColor: "var(--superficie)",
  color: "var(--texto)",
  fontSize: 12,
};

export default function PaginaPanel() {
  const { usuario, tieneRol } = useAuth();
  const { datos, cargando, error, recargar } = useApi<Dashboard>("/api/dashboard");
  const { datos: parametros } = useApi<Parametro[]>("/api/parametros");
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

  if (cargando && !datos) return <Cargando texto="Cargando panel de control…" />;

  if (error || !datos) {
    return <Aviso tono="error">{error || "No se pudo cargar el panel."}</Aviso>;
  }

  const parametro = (clave: string) =>
    parametros?.find((item) => item.clave === clave)?.valor ?? "";

  const empresa = {
    nombre: parametro("Empresa.Nombre") || "Sistema de Inventarios",
    documento: parametro("Empresa.Documento"),
    direccion: parametro("Empresa.Direccion"),
    telefono: parametro("Empresa.Telefono"),
    correo: parametro("Empresa.Correo"),
  };

  const usuarioActual = usuario?.nombreCompleto || usuario?.nombreUsuario || "Sistema";
  const variacionVentas = variacionPorcentual(datos.ventasMes, datos.ventasMesAnterior);
  const variacionCompras = variacionPorcentual(datos.comprasMes, datos.comprasMesAnterior);
  const actualizado = new Date(datos.actualizadoUtc);
  const horaActualizacion = Number.isNaN(actualizado.getTime())
    ? "—"
    : actualizado.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });

  const maximoTop = Math.max(...datos.topProductos.map((item) => item.cantidadVendida), 1);
  const maximoCliente = Math.max(...datos.topClientes.map((item) => item.total), 1);
  const totalFormasPago = datos.ventasPorFormaPago.reduce((total, item) => total + item.total, 0);

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

  const exportarExcel = async () => {
    setExportando(true);
    setErrorExportacion("");

    try {
      const respuesta = await fetch("/api/dashboard/exportar", {
        credentials: "include",
        cache: "no-store",
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo generar el archivo de Excel.");
      }

      const disposicion = respuesta.headers.get("Content-Disposition") ?? "";
      const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion);
      const nombre = coincidencia ? decodeURIComponent(coincidencia[1]) : "Panel-Gerencial.xlsx";
      descargarArchivo(nombre, await respuesta.blob());
    } catch (e) {
      setErrorExportacion(mensajeDeError(e));
    } finally {
      setExportando(false);
    }
  };

  return (
    <>
      <div className="pantalla-panel space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Panel gerencial
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Hola, {usuario?.nombreCompleto.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Estado del negocio, comparativos del mes y alertas de inventario.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Boton
                variante="secundario"
                onClick={() => void recargar()}
                cargando={cargando}
                icono={<RefreshCw className="h-4 w-4" />}
              >
                Actualizar
              </Boton>
              <Boton
                variante="secundario"
                onClick={() => window.print()}
                icono={<Printer className="h-4 w-4" />}
              >
                Imprimir
              </Boton>
              <Boton
                variante="secundario"
                onClick={exportarExcel}
                cargando={exportando}
                icono={<Download className="h-4 w-4" />}
              >
                Excel
              </Boton>
            </div>
            <p className="text-[11px] text-slate-400">Actualizado hoy a las {horaActualizacion}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {acciones.map((accion) => {
            const Icono = accion.icono;
            return (
              <Link
                key={accion.href}
                href={accion.href}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-200"
              >
                <Icono className="h-4 w-4" />
                {accion.etiqueta}
              </Link>
            );
          })}
        </div>

        {errorExportacion && <Aviso tono="error">{errorExportacion}</Aviso>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <TarjetaEstadistica
            titulo="Ventas del mes"
            valor={formatoMoneda(datos.ventasMes)}
            detalle={`${variacionVentas.texto} vs anterior · Ticket ${formatoMoneda(datos.ticketPromedioMes)}`}
            icono={<DollarSign className="h-5 w-5" />}
            tono="verde"
          />
          <TarjetaEstadistica
            titulo="Compras del mes"
            valor={formatoMoneda(datos.comprasMes)}
            detalle={`${variacionCompras.texto} vs mes anterior · ${datos.cantidadComprasMes} doc.`}
            icono={<ShoppingCart className="h-5 w-5" />}
            tono="azul"
          />
          <TarjetaEstadistica
            titulo="Margen bruto estimado"
            valor={formatoMoneda(datos.margenBrutoMes)}
            detalle={`${datos.porcentajeMargenMes.toFixed(1)}% de margen · costo ${formatoMoneda(datos.costoVentasMes)}`}
            icono={<TrendingUp className="h-5 w-5" />}
            tono="violeta"
          />
          <TarjetaEstadistica
            titulo="Inventario valorizado"
            valor={formatoMoneda(datos.valorInventarioCosto)}
            detalle={`Venta ${formatoMoneda(datos.valorInventarioVenta)} · margen ${formatoMoneda(datos.margenPotencialInventario)}`}
            icono={<Boxes className="h-5 w-5" />}
            tono="verde"
          />
          <TarjetaEstadistica
            titulo="Stock bajo mínimo"
            valor={formatoNumero(datos.productosBajoMinimo)}
            detalle={`${datos.productosSinExistencia} sin existencia · ${datos.movimientosHoy} movimientos hoy`}
            icono={<AlertTriangle className="h-5 w-5" />}
            tono={datos.productosBajoMinimo > 0 ? "ambar" : "verde"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <TarjetaSeccion
            titulo="Ventas vs compras"
            descripcion="Últimos 6 meses, documentos vigentes."
            acciones={
              <Link
                href="/reportes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
              >
                Ver reportes <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="h-72 w-full">
              {datos.ventasPorMes.every((mes) => mes.ventas === 0 && mes.compras === 0) ? (
                <p className="flex h-full items-center justify-center text-xs text-slate-400">
                  Sin ventas ni compras en los últimos 6 meses.
                </p>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.ventasPorMes} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(valor: number) => `Q${valor}`}
                  />
                  <Tooltip
                    formatter={(valor, nombre) => [
                      formatoMoneda(Number(valor)),
                      String(nombre),
                    ]}
                    contentStyle={estiloTooltip}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#047857" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compras" name="Compras" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </TarjetaSeccion>

          <TarjetaSeccion
            titulo="Formas de pago del mes"
            descripcion="Distribución de las ventas registradas."
          >
            {datos.ventasPorFormaPago.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">
                Sin ventas registradas en el mes.
              </p>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datos.ventasPorFormaPago}
                        dataKey="total"
                        nameKey="formaPago"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                      >
                        {datos.ventasPorFormaPago.map((item, indice) => (
                          <Cell key={item.formaPago} fill={COLORES_PAGO[indice % COLORES_PAGO.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor) => formatoMoneda(Number(valor))}
                        contentStyle={estiloTooltip}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <ul className="w-full min-w-0 space-y-2 sm:flex-1">
                  {datos.ventasPorFormaPago.map((item, indice) => (
                    <li key={item.formaPago} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORES_PAGO[indice % COLORES_PAGO.length] }}
                        />
                        <span className="truncate text-slate-600 dark:text-slate-300">
                          {item.formaPago}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatoMoneda(item.total)}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          {totalFormasPago > 0 ? `${((item.total / totalFormasPago) * 100).toFixed(0)}%` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TarjetaSeccion>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <TarjetaSeccion
            titulo="Ventas de los últimos 30 días"
            descripcion="Ingresos registrados por día (documentos vigentes)."
          >
            <div className="h-72 w-full">
              {datos.ventasUltimosDias.every((dia) => dia.total === 0) ? (
                <p className="flex h-full items-center justify-center text-xs text-slate-400">
                  Sin ventas registradas en los últimos 30 días.
                </p>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datos.ventasUltimosDias} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    interval={4}
                    tickFormatter={(valor: string) => formatoFechaCorta(valor)}
                    tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(valor: number) => `Q${valor}`}
                  />
                  <Tooltip
                    formatter={(valor) => [formatoMoneda(Number(valor)), "Ventas"]}
                    labelFormatter={(valor) => formatoFechaCorta(String(valor))}
                    contentStyle={estiloTooltip}
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
              )}
            </div>
          </TarjetaSeccion>

          <TarjetaSeccion titulo="Top clientes del mes" descripcion="Por total vendido.">
            {datos.topClientes.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">
                Sin ventas registradas en el mes.
              </p>
            ) : (
              <ul className="space-y-4">
                {datos.topClientes.map((cliente, indice) => (
                  <li key={`${cliente.clienteId ?? "general"}-${cliente.cliente}`}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {indice + 1}
                        </span>
                        <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                          {cliente.cliente}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                        {formatoMoneda(cliente.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(cliente.total / maximoCliente) * 100}%` }}
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
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {indice + 1}
                        </span>
                        <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                          {producto.nombre}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatoNumero(producto.cantidadVendida)}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-400">
                          {formatoMoneda(producto.totalVendido)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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

          <TarjetaSeccion
            titulo="Productos por debajo del mínimo"
            descripcion="Requieren reposición inmediata."
            acciones={
              <Insignia tono={datos.productosBajoMinimo > 0 ? "amarillo" : "verde"}>
                {datos.productosBajoMinimo} alertas
              </Insignia>
            }
          >
            {datos.productosBajoMinimoLista.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Boxes className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Todo el inventario está sobre el mínimo.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {datos.productosBajoMinimoLista.map((producto) => (
                  <li key={producto.productoId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {producto.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {producto.codigo} · {producto.categoria}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                          {formatoNumero(producto.existenciaActual)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          mín. {formatoNumero(producto.existenciaMinima)}
                        </p>
                      </div>
                      {tieneRol("Administrador", "Inventario") && (
                        <Link
                          href="/compras/nueva"
                          className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          Comprar
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TarjetaSeccion>
        </div>

        <TarjetaSeccion
          titulo="Últimas ventas"
          descripcion="Documentos recientes registrados en el sistema."
          acciones={
            <Link
              href="/ventas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {datos.ultimasVentas.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Aún no hay ventas registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {datos.ultimasVentas.map((venta) => (
                <li key={venta.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      {venta.numero}
                    </Link>
                    <p className="truncate text-[11px] text-slate-400">
                      {venta.cliente} · {formatoFechaCorta(venta.fecha)} · {venta.usuario}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Insignia tono={venta.estado === "Anulada" ? "rojo" : "verde"}>
                      {venta.estado}
                    </Insignia>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {formatoMoneda(venta.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>

        <Tarjeta className="flex flex-wrap items-center justify-between gap-4 border-emerald-100 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 dark:from-emerald-950/60 to-white dark:to-slate-900 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Existencias y kardex
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulte la valorización y el historial de cada producto.
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

      <InformePanel datos={datos} empresa={empresa} usuario={usuarioActual} />
    </>
  );
}

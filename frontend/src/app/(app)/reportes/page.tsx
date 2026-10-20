"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileText,
  Printer,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { InsigniaEstado } from "@/components/ui/Insignia";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { construirQuery } from "@/lib/api";
import {
  descargarCsv,
  formatoFecha,
  formatoMoneda,
  formatoNumero,
  haceDiasISO,
  hoyISO,
} from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type {
  BajoMinimo,
  ReporteCompra,
  ReporteNota,
  ReporteVenta,
  ResumenPeriodo,
  TopProducto,
} from "@/lib/tipos";

type Pestana = "resumen" | "ventas" | "compras" | "notas";

const pestanas: { valor: Pestana; etiqueta: string }[] = [
  { valor: "resumen", etiqueta: "Resumen" },
  { valor: "ventas", etiqueta: "Ventas" },
  { valor: "compras", etiqueta: "Compras" },
  { valor: "notas", etiqueta: "Notas" },
];

export default function PaginaReportes() {
  const [desde, setDesde] = useState(haceDiasISO(30));
  const [hasta, setHasta] = useState(hoyISO());
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [estadoVentas, setEstadoVentas] = useState("");
  const [estadoCompras, setEstadoCompras] = useState("");
  const [tipoNota, setTipoNota] = useState("");

  const rango = { desde, hasta };

  const { datos: resumen, error: errorResumen } = useApi<ResumenPeriodo>(
    `/api/reportes/resumen${construirQuery(rango)}`,
  );
  const { datos: ventas, error: errorVentas } = useApi<ReporteVenta[]>(
    `/api/reportes/ventas${construirQuery({ ...rango, estado: estadoVentas })}`,
  );
  const { datos: compras, error: errorCompras } = useApi<ReporteCompra[]>(
    `/api/reportes/compras${construirQuery({ ...rango, estado: estadoCompras })}`,
  );
  const { datos: notas, error: errorNotas } = useApi<ReporteNota[]>(
    `/api/reportes/notas${construirQuery({ ...rango, tipo: tipoNota })}`,
  );
  const { datos: topProductos } = useApi<TopProducto[]>(
    `/api/reportes/top-productos${construirQuery({ ...rango, limite: 8 })}`,
  );
  const { datos: bajoMinimo } = useApi<BajoMinimo[]>("/api/reportes/bajo-minimo");

  const maximoTop = Math.max(
    ...(topProductos ?? []).map((producto) => producto.cantidadVendida),
    1,
  );

  const totalVentasPeriodo = (ventas ?? []).reduce((total, venta) => total + venta.total, 0);
  const totalComprasPeriodo = (compras ?? []).reduce((total, compra) => total + compra.total, 0);
  const totalNotasPeriodo = (notas ?? []).reduce((total, nota) => total + nota.total, 0);

  const exportar = () => {
    if (pestana === "ventas") {
      descargarCsv(
        `reporte-ventas-${desde}-${hasta}.csv`,
        ["Número", "Fecha", "Cliente", "Vendedor", "Forma de pago", "Subtotal", "Impuesto", "Total", "Estado"],
        (ventas ?? []).map((venta) => [
          venta.numero,
          formatoFecha(venta.fecha),
          venta.cliente,
          venta.usuario,
          venta.formaPago,
          venta.subtotal,
          venta.impuesto,
          venta.total,
          venta.estado,
        ]),
      );
      return;
    }

    if (pestana === "compras") {
      descargarCsv(
        `reporte-compras-${desde}-${hasta}.csv`,
        ["Número", "Fecha", "Proveedor", "Registrado por", "Subtotal", "Impuesto", "Total", "Estado"],
        (compras ?? []).map((compra) => [
          compra.numero,
          formatoFecha(compra.fecha),
          compra.proveedor,
          compra.usuario,
          compra.subtotal,
          compra.impuesto,
          compra.total,
          compra.estado,
        ]),
      );
      return;
    }

    if (pestana === "notas") {
      descargarCsv(
        `reporte-notas-${desde}-${hasta}.csv`,
        ["Número", "Tipo", "Fecha", "Venta", "Cliente", "Motivo", "Total", "Estado"],
        (notas ?? []).map((nota) => [
          nota.numero,
          nota.tipo,
          formatoFecha(nota.fecha),
          nota.ventaNumero,
          nota.cliente,
          nota.motivo,
          nota.total,
          nota.estado,
        ]),
      );
      return;
    }

    descargarCsv(
      `resumen-${desde}-${hasta}.csv`,
      ["Indicador", "Valor"],
      [
        ["Total de ventas", resumen?.totalVentas ?? 0],
        ["Cantidad de ventas", resumen?.cantidadVentas ?? 0],
        ["Total de compras", resumen?.totalCompras ?? 0],
        ["Cantidad de compras", resumen?.cantidadCompras ?? 0],
        ["Total de notas de crédito", resumen?.totalNotasCredito ?? 0],
        ["Total de notas de débito", resumen?.totalNotasDebito ?? 0],
        ["Productos bajo mínimo", bajoMinimo?.length ?? 0],
      ],
    );
  };

  const columnasVentas: Columna<ReporteVenta>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (venta) => (
        <Link
          href={`/ventas/${venta.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {venta.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (venta) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatoFecha(venta.fecha)}
        </span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente",
      render: (venta) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{venta.cliente}</p>
          <p className="text-[11px] text-slate-400">
            {venta.usuario} · {venta.formaPago}
          </p>
        </div>
      ),
    },
    {
      clave: "subtotal",
      titulo: "Subtotal",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-xs text-slate-500">{formatoMoneda(venta.subtotal)}</span>
      ),
    },
    {
      clave: "impuesto",
      titulo: "Impuesto",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-xs text-slate-500">{formatoMoneda(venta.impuesto)}</span>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-sm font-bold text-slate-900">{formatoMoneda(venta.total)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (venta) => <InsigniaEstado estado={venta.estado} />,
    },
  ];

  const columnasCompras: Columna<ReporteCompra>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (compra) => (
        <Link
          href={`/compras/${compra.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {compra.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (compra) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatoFecha(compra.fecha)}
        </span>
      ),
    },
    {
      clave: "proveedor",
      titulo: "Proveedor",
      render: (compra) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{compra.proveedor}</p>
          <p className="text-[11px] text-slate-400">Registró: {compra.usuario}</p>
        </div>
      ),
    },
    {
      clave: "subtotal",
      titulo: "Subtotal",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-xs text-slate-500">{formatoMoneda(compra.subtotal)}</span>
      ),
    },
    {
      clave: "impuesto",
      titulo: "Impuesto",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-xs text-slate-500">{formatoMoneda(compra.impuesto)}</span>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-sm font-bold text-slate-900">{formatoMoneda(compra.total)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (compra) => <InsigniaEstado estado={compra.estado} />,
    },
  ];

  const columnasNotas: Columna<ReporteNota>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (nota) => (
        <Link
          href={`/notas/${nota.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {nota.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (nota) => (
        <span className="whitespace-nowrap text-xs text-slate-500">{formatoFecha(nota.fecha)}</span>
      ),
    },
    {
      clave: "tipo",
      titulo: "Tipo",
      alineacion: "centro",
      render: (nota) => <InsigniaEstado estado={nota.tipo} />,
    },
    {
      clave: "venta",
      titulo: "Venta",
      render: (nota) => (
        <span className="font-mono text-xs text-slate-600">{nota.ventaNumero}</span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente / motivo",
      render: (nota) => (
        <div className="max-w-xs">
          <p className="truncate text-sm font-medium text-slate-800">{nota.cliente}</p>
          <p className="truncate text-[11px] text-slate-400">{nota.motivo}</p>
        </div>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (nota) => (
        <span className="text-sm font-bold text-slate-900">{formatoMoneda(nota.total)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (nota) => <InsigniaEstado estado={nota.estado} />,
    },
  ];

  const errorActual =
    pestana === "ventas"
      ? errorVentas
      : pestana === "compras"
        ? errorCompras
        : pestana === "notas"
          ? errorNotas
          : errorResumen;

  return (
    <div>
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Analice el desempeño comercial y el valor del inventario en un período."
        acciones={
          <>
            <Boton
              variante="secundario"
              onClick={() => window.print()}
              icono={<Printer className="h-4 w-4" />}
            >
              Imprimir
            </Boton>
            <Boton
              variante="secundario"
              onClick={exportar}
              icono={<Download className="h-4 w-4" />}
            >
              Exportar CSV
            </Boton>
          </>
        }
      />

      <div className="no-imprimir mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="reporte-desde">
            Desde
          </label>
          <input
            id="reporte-desde"
            type="date"
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="reporte-hasta">
            Hasta
          </label>
          <input
            id="reporte-hasta"
            type="date"
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
          />
        </div>

        <div className="sm:col-span-2">
          {pestana === "ventas" && (
            <Seleccion
              value={estadoVentas}
              onChange={(evento) => setEstadoVentas(evento.target.value)}
              aria-label="Estado de ventas"
            >
              <option value="">Todas las ventas</option>
              <option value="Registrada">Solo registradas</option>
              <option value="Anulada">Solo anuladas</option>
            </Seleccion>
          )}

          {pestana === "compras" && (
            <Seleccion
              value={estadoCompras}
              onChange={(evento) => setEstadoCompras(evento.target.value)}
              aria-label="Estado de compras"
            >
              <option value="">Todas las compras</option>
              <option value="Registrada">Solo registradas</option>
              <option value="Anulada">Solo anuladas</option>
            </Seleccion>
          )}

          {pestana === "notas" && (
            <Seleccion
              value={tipoNota}
              onChange={(evento) => setTipoNota(evento.target.value)}
              aria-label="Tipo de nota"
            >
              <option value="">Todas las notas</option>
              <option value="Credito">Notas de crédito</option>
              <option value="Debito">Notas de débito</option>
            </Seleccion>
          )}

          {(pestana === "resumen" || pestana === "notas") && (
            <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 px-3 text-[11px] text-slate-400">
              {pestana === "resumen"
                ? "El resumen incluye documentos registrados y anulados del período."
                : "Filtre las notas por tipo para conciliar devoluciones y cargos."}
            </div>
          )}
        </div>
      </div>

      <div className="no-imprimir mb-5 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {pestanas.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setPestana(item.valor)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
              pestana === item.valor
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.valor === "resumen" && <TrendingUp className="h-3.5 w-3.5" />}
            {item.valor === "ventas" && <Receipt className="h-3.5 w-3.5" />}
            {item.valor === "compras" && <ShoppingCart className="h-3.5 w-3.5" />}
            {item.valor === "notas" && <FileText className="h-3.5 w-3.5" />}
            {item.etiqueta}
          </button>
        ))}
      </div>

      {errorActual && (
        <div className="mb-4">
          <Aviso tono="error">{errorActual}</Aviso>
        </div>
      )}

      {pestana === "resumen" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">Ventas del período</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatoMoneda(resumen?.totalVentas ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {resumen?.cantidadVentas ?? 0} documento(s) registrado(s)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">Compras del período</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ArrowDownRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatoMoneda(resumen?.totalCompras ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {resumen?.cantidadCompras ?? 0} documento(s) registrado(s)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">Notas de crédito</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatoMoneda(resumen?.totalNotasCredito ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                débitos: {formatoMoneda(resumen?.totalNotasDebito ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Productos más vendidos</h2>
                  <p className="text-xs text-slate-400">Por cantidad, en el período seleccionado.</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>

              {!topProductos?.length ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No hay ventas en el período seleccionado.
                </p>
              ) : (
                <ul className="space-y-4">
                  {topProductos.map((producto) => (
                    <li key={producto.productoId}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate font-medium text-slate-700">
                          {producto.nombre}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {formatoNumero(producto.cantidadVendida)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${(producto.cantidadVendida / maximoTop) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>{producto.codigo}</span>
                        <span>{formatoMoneda(producto.totalVendido)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Productos bajo mínimo</h2>
                  <p className="text-xs text-slate-400">Alertas actuales de reposición.</p>
                </div>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>

              {!bajoMinimo?.length ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Todo el inventario está sobre el nivel mínimo.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {bajoMinimo.map((producto) => (
                    <li
                      key={producto.productoId}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {producto.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {producto.codigo} · {producto.categoria}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-red-600">
                          {formatoNumero(producto.existenciaActual)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          mín. {formatoNumero(producto.existenciaMinima)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {pestana === "ventas" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {ventas?.length ?? 0} documento(s) ·{" "}
              <span className="font-semibold text-slate-800">
                {formatoMoneda(totalVentasPeriodo)}
              </span>
            </p>
          </div>

          <Tabla
            columnas={columnasVentas}
            datos={ventas ?? []}
            filaClave={(venta) => venta.id}
            vacio="No hay ventas en el período seleccionado."
          />
        </section>
      )}

      {pestana === "compras" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {compras?.length ?? 0} documento(s) ·{" "}
              <span className="font-semibold text-slate-800">
                {formatoMoneda(totalComprasPeriodo)}
              </span>
            </p>
          </div>

          <Tabla
            columnas={columnasCompras}
            datos={compras ?? []}
            filaClave={(compra) => compra.id}
            vacio="No hay compras en el período seleccionado."
          />
        </section>
      )}

      {pestana === "notas" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {notas?.length ?? 0} nota(s) ·{" "}
              <span className="font-semibold text-slate-800">
                {formatoMoneda(totalNotasPeriodo)}
              </span>
            </p>
          </div>

          <Tabla
            columnas={columnasNotas}
            datos={notas ?? []}
            filaClave={(nota) => nota.id}
            vacio="No hay notas de ajuste en el período seleccionado."
          />
        </section>
      )}

      <p className="mt-5 text-center text-[10px] text-slate-400">
        Reporte generado el {formatoFecha(new Date().toISOString(), true)} · Período {desde} al {hasta}
      </p>
    </div>
  );
}

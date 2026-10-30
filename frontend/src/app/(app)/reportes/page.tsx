"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { InformeImpresion, type EmpresaInforme } from "@/components/reportes/InformeImpresion";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { InsigniaEstado } from "@/components/ui/Insignia";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { construirQuery, mensajeDeError } from "@/lib/api";
import {
  descargarArchivo,
  descargarCsv,
  fechaCsv,
  formatoFecha,
  formatoMoneda,
  formatoNumero,
  haceDiasISO,
  hoyISO,
} from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type {
  BajoMinimo,
  Parametro,
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
  const { usuario } = useAuth();
  const [desde, setDesde] = useState(haceDiasISO(30));
  const [hasta, setHasta] = useState(hoyISO());
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [estadoVentas, setEstadoVentas] = useState("");
  const [estadoCompras, setEstadoCompras] = useState("");
  const [tipoNota, setTipoNota] = useState("");
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

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
  const { datos: parametros } = useApi<Parametro[]>("/api/parametros");

  const parametro = (clave: string) =>
    parametros?.find((item) => item.clave === clave)?.valor ?? "";

  const empresa: EmpresaInforme = {
    nombre: parametro("Empresa.Nombre") || "Sistema de Inventarios",
    documento: parametro("Empresa.Documento"),
    direccion: parametro("Empresa.Direccion"),
    telefono: parametro("Empresa.Telefono"),
    correo: parametro("Empresa.Correo"),
  };

  const usuarioActual = usuario?.nombreCompleto || usuario?.nombreUsuario || "Sistema";

  const maximoTop = Math.max(
    ...(topProductos ?? []).map((producto) => producto.cantidadVendida),
    1,
  );

  const totalVentasPeriodo = (ventas ?? []).reduce((total, venta) => total + venta.total, 0);
  const totalComprasPeriodo = (compras ?? []).reduce((total, compra) => total + compra.total, 0);
  const totalNotasPeriodo = (notas ?? []).reduce((total, nota) => total + nota.total, 0);
  const subtotalVentas = (ventas ?? []).reduce((total, venta) => total + venta.subtotal, 0);
  const impuestoVentas = (ventas ?? []).reduce((total, venta) => total + venta.impuesto, 0);
  const subtotalCompras = (compras ?? []).reduce((total, compra) => total + compra.subtotal, 0);
  const impuestoCompras = (compras ?? []).reduce((total, compra) => total + compra.impuesto, 0);

  const exportarCsv = () => {
    if (pestana === "ventas") {
      const filas = ventas ?? [];
      descargarCsv(
        `reporte-ventas-${desde}-${hasta}.csv`,
        ["Documento", "Fecha", "Cliente", "Vendedor", "Forma de pago", "Subtotal", "Impuesto", "Total", "Estado"],
        [
          ...filas.map((venta) => [
            venta.numero,
            fechaCsv(venta.fecha),
            venta.cliente,
            venta.usuario,
            venta.formaPago,
            venta.subtotal,
            venta.impuesto,
            venta.total,
            venta.estado,
          ]),
          ["TOTALES", "", "", "", "", subtotalVentas, impuestoVentas, totalVentasPeriodo, ""],
        ],
      );
      return;
    }

    if (pestana === "compras") {
      const filas = compras ?? [];
      descargarCsv(
        `reporte-compras-${desde}-${hasta}.csv`,
        ["Documento", "Fecha", "Proveedor", "Registrado por", "Subtotal", "Impuesto", "Total", "Estado"],
        [
          ...filas.map((compra) => [
            compra.numero,
            fechaCsv(compra.fecha),
            compra.proveedor,
            compra.usuario,
            compra.subtotal,
            compra.impuesto,
            compra.total,
            compra.estado,
          ]),
          ["TOTALES", "", "", "", subtotalCompras, impuestoCompras, totalComprasPeriodo, ""],
        ],
      );
      return;
    }

    if (pestana === "notas") {
      const filas = notas ?? [];
      descargarCsv(
        `reporte-notas-${desde}-${hasta}.csv`,
        ["Documento", "Tipo", "Fecha", "Venta", "Cliente", "Motivo", "Total", "Estado"],
        [
          ...filas.map((nota) => [
            nota.numero,
            nota.tipo,
            fechaCsv(nota.fecha),
            nota.ventaNumero,
            nota.cliente,
            nota.motivo,
            nota.total,
            nota.estado,
          ]),
          ["TOTALES", "", "", "", "", "", totalNotasPeriodo, ""],
        ],
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
        ["Ticket promedio de venta", (resumen?.cantidadVentas ?? 0) > 0 ? (resumen?.totalVentas ?? 0) / (resumen?.cantidadVentas ?? 1) : 0],
        ["Productos bajo mínimo", bajoMinimo?.length ?? 0],
      ],
    );
  };

  const exportarExcel = async () => {
    setExportando(true);
    setErrorExportacion("");

    try {
      const consulta = construirQuery({
        tipo: pestana,
        desde,
        hasta,
        estado: pestana === "ventas" ? estadoVentas : pestana === "compras" ? estadoCompras : "",
        tipoNota: pestana === "notas" ? tipoNota : "",
      });
      const respuesta = await fetch(`/api/reportes/exportar${consulta}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo generar el archivo de Excel.");
      }

      const blob = await respuesta.blob();
      const disposicion = respuesta.headers.get("Content-Disposition") ?? "";
      const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion);
      const nombre = coincidencia
        ? decodeURIComponent(coincidencia[1])
        : `Informe-Gerencial_${pestana}_${desde}_${hasta}.xlsx`;

      descargarArchivo(nombre, blob);
    } catch (error) {
      setErrorExportacion(mensajeDeError(error));
    } finally {
      setExportando(false);
    }
  };

  const columnasVentas: Columna<ReporteVenta>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (venta) => (
        <Link
          href={`/ventas/${venta.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {venta.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (venta) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatoFecha(venta.fecha)}
        </span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente",
      render: (venta) => (
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{venta.cliente}</p>
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
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoMoneda(venta.subtotal)}</span>
      ),
    },
    {
      clave: "impuesto",
      titulo: "Impuesto",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoMoneda(venta.impuesto)}</span>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(venta.total)}</span>
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
          className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {compra.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (compra) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
          {formatoFecha(compra.fecha)}
        </span>
      ),
    },
    {
      clave: "proveedor",
      titulo: "Proveedor",
      render: (compra) => (
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{compra.proveedor}</p>
          <p className="text-[11px] text-slate-400">Registró: {compra.usuario}</p>
        </div>
      ),
    },
    {
      clave: "subtotal",
      titulo: "Subtotal",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoMoneda(compra.subtotal)}</span>
      ),
    },
    {
      clave: "impuesto",
      titulo: "Impuesto",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoMoneda(compra.impuesto)}</span>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(compra.total)}</span>
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
          className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {nota.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (nota) => (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{formatoFecha(nota.fecha)}</span>
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
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{nota.ventaNumero}</span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente / motivo",
      render: (nota) => (
        <div className="max-w-xs">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{nota.cliente}</p>
          <p className="truncate text-[11px] text-slate-400">{nota.motivo}</p>
        </div>
      ),
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (nota) => (
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(nota.total)}</span>
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
    <>
      <div className="pantalla-reportes">
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
              onClick={exportarCsv}
              icono={<Download className="h-4 w-4" />}
            >
              Exportar CSV
            </Boton>
            <Boton
              variante="secundario"
              onClick={exportarExcel}
              cargando={exportando}
              icono={<FileSpreadsheet className="h-4 w-4" />}
            >
              Exportar Excel
            </Boton>
          </>
        }
      />

      {errorExportacion && (
        <div className="no-imprimir mb-4">
          <Aviso tono="error">{errorExportacion}</Aviso>
        </div>
      )}

      <div className="no-imprimir mb-4 grid gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="reporte-desde">
            Desde
          </label>
          <input
            id="reporte-desde"
            type="date"
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="reporte-hasta">
            Hasta
          </label>
          <input
            id="reporte-hasta"
            type="date"
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-emerald-600"
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
            <div className="flex h-10 items-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-3 text-[11px] text-slate-400">
              {pestana === "resumen"
                ? "El resumen incluye documentos registrados y anulados del período."
                : "Filtre las notas por tipo para conciliar devoluciones y cargos."}
            </div>
          )}
        </div>
      </div>

      <div className="no-imprimir mb-5 flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
        {pestanas.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setPestana(item.valor)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
              pestana === item.valor
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ventas del período</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatoMoneda(resumen?.totalVentas ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {resumen?.cantidadVentas ?? 0} documento(s) registrado(s)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Compras del período</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                  <ArrowDownRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatoMoneda(resumen?.totalCompras ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {resumen?.cantidadCompras ?? 0} documento(s) registrado(s)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Notas de crédito</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatoMoneda(resumen?.totalNotasCredito ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                débitos: {formatoMoneda(resumen?.totalNotasDebito ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Productos más vendidos</h2>
                  <p className="text-xs text-slate-400">Por cantidad, en el período seleccionado.</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                        <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                          {producto.nombre}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                          {formatoNumero(producto.cantidadVendida)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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

            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Productos bajo mínimo</h2>
                  <p className="text-xs text-slate-400">Alertas actuales de reposición.</p>
                </div>
                <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>

              {!bajoMinimo?.length ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Todo el inventario está sobre el nivel mínimo.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bajoMinimo.map((producto) => (
                    <li
                      key={producto.productoId}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                          {producto.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {producto.codigo} · {producto.categoria}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ventas?.length ?? 0} documento(s) ·{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {compras?.length ?? 0} documento(s) ·{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {notas?.length ?? 0} nota(s) ·{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
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

      <InformeImpresion
        empresa={empresa}
        desde={desde}
        hasta={hasta}
        pestana={pestana}
        usuario={usuarioActual}
        resumen={resumen}
        ventas={ventas ?? undefined}
        compras={compras ?? undefined}
        notas={notas ?? undefined}
        topProductos={topProductos ?? undefined}
        bajoMinimo={bajoMinimo ?? undefined}
      />
    </>
  );
}

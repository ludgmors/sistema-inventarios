"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { InsigniaEstado } from "@/components/ui/Insignia";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { ModalAjuste } from "@/components/inventario/ModalAjuste";
import { useAuth } from "@/components/layout/AuthProvider";
import { construirQuery } from "@/lib/api";
import { descargarCsv, formatoFecha, formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useDebounce } from "@/lib/useDebounce";
import type { AjusteRespuesta, Movimiento, Paginado, Producto } from "@/lib/tipos";

interface ResumenMovimientos {
  entradas: number;
  salidas: number;
  cantidad: number;
}

const origenes: { valor: string; etiqueta: string }[] = [
  { valor: "Compra", etiqueta: "Compras" },
  { valor: "Venta", etiqueta: "Ventas" },
  { valor: "NotaCredito", etiqueta: "Notas de crédito" },
  { valor: "NotaDebito", etiqueta: "Notas de débito" },
  { valor: "Ajuste", etiqueta: "Ajustes manuales" },
  { valor: "Anulacion", etiqueta: "Anulaciones" },
];

const nombreOrigen = (origen: string): string =>
  origenes.find((item) => item.valor === origen)?.etiqueta ?? origen;

export default function PaginaMovimientos() {
  const { tieneRol } = useAuth();
  const puedeAjustar = tieneRol("Administrador", "Inventario");

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [origen, setOrigen] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const filtros = {
    buscar: busquedaAplicada,
    productoId,
    tipo,
    origen,
    desde,
    hasta,
  };

  const { datos, cargando, error, recargar } = useApi<Paginado<Movimiento>>(
    `/api/movimientos${construirQuery({
      pagina,
      tamanoPagina: 15,
      ...filtros,
    })}`,
  );

  const {
    datos: resumen,
    recargar: recargarResumen,
  } = useApi<ResumenMovimientos>(
    `/api/movimientos/resumen${construirQuery({ desde, hasta })}`,
  );

  const { datos: productos } = useApi<Paginado<Producto>>(
    "/api/productos?tamanoPagina=200&soloActivos=true",
  );

  const alGuardarAjuste = async (resultado: AjusteRespuesta) => {
    setMensaje(
      `Ajuste ${resultado.numero} registrado. Nueva existencia de ${resultado.producto}: ${formatoNumero(resultado.existenciaNueva)}.`,
    );
    await Promise.all([recargar(), recargarResumen()]);
  };

  const exportar = () => {
    if (!datos?.items.length) return;

    descargarCsv(
      `movimientos-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Fecha",
        "Producto",
        "Código",
        "Tipo",
        "Origen",
        "Documento",
        "Cantidad",
        "Costo unitario",
        "Saldo anterior",
        "Saldo nuevo",
        "Usuario",
        "Observación",
      ],
      datos.items.map((movimiento) => [
        formatoFecha(movimiento.fecha, true),
        movimiento.producto,
        movimiento.codigoProducto,
        movimiento.tipo,
        nombreOrigen(movimiento.origen),
        movimiento.documentoNumero ?? "",
        movimiento.cantidad,
        movimiento.costoUnitario,
        movimiento.saldoAnterior,
        movimiento.saldoNuevo,
        movimiento.usuario,
        movimiento.observacion ?? "",
      ]),
    );
  };

  const columnas: Columna<Movimiento>[] = [
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (movimiento) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatoFecha(movimiento.fecha, true)}
        </span>
      ),
    },
    {
      clave: "producto",
      titulo: "Producto",
      render: (movimiento) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-800">{movimiento.producto}</p>
          <p className="text-[11px] text-slate-400">
            {movimiento.codigoProducto}
            {movimiento.observacion && ` · ${movimiento.observacion}`}
          </p>
        </div>
      ),
    },
    {
      clave: "tipo",
      titulo: "Tipo",
      alineacion: "centro",
      render: (movimiento) => <InsigniaEstado estado={movimiento.tipo} />,
    },
    {
      clave: "origen",
      titulo: "Origen",
      render: (movimiento) => (
        <div>
          <p className="text-xs font-medium text-slate-600">{nombreOrigen(movimiento.origen)}</p>
          <p className="font-mono text-[10px] text-slate-400">
            {movimiento.documentoNumero ?? "—"}
          </p>
        </div>
      ),
    },
    {
      clave: "cantidad",
      titulo: "Cantidad",
      alineacion: "derecha",
      render: (movimiento) => (
        <span
          className={`text-sm font-bold ${
            movimiento.tipo === "Entrada" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {movimiento.tipo === "Entrada" ? "+" : "−"}
          {formatoNumero(movimiento.cantidad)}
        </span>
      ),
    },
    {
      clave: "saldo",
      titulo: "Saldo",
      alineacion: "derecha",
      render: (movimiento) => (
        <div className="text-right text-[11px] text-slate-500">
          <p>{formatoNumero(movimiento.saldoAnterior)}</p>
          <p className="font-semibold text-slate-700">→ {formatoNumero(movimiento.saldoNuevo)}</p>
        </div>
      ),
    },
    {
      clave: "costo",
      titulo: "Costo unit.",
      alineacion: "derecha",
      render: (movimiento) => (
        <span className="text-xs text-slate-500">{formatoMoneda(movimiento.costoUnitario)}</span>
      ),
    },
    {
      clave: "usuario",
      titulo: "Usuario",
      render: (movimiento) => (
        <span className="text-xs text-slate-500">{movimiento.usuario}</span>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Movimientos de inventario"
        descripcion="Audite todas las entradas y salidas generadas por compras, ventas, notas y ajustes."
        acciones={
          <>
            <Boton
              variante="secundario"
              onClick={exportar}
              disabled={!datos?.items.length}
              icono={<Download className="h-4 w-4" />}
            >
              Exportar CSV
            </Boton>
            {puedeAjustar && (
              <Boton onClick={() => setModalAbierto(true)} icono={<Plus className="h-4 w-4" />}>
                Nuevo ajuste
              </Boton>
            )}
          </>
        }
      />

      {mensaje && (
        <div className="mb-4">
          <Aviso tono="exito">{mensaje}</Aviso>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Aviso tono="error">{error}</Aviso>
        </div>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            Entradas
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatoNumero(resumen?.entradas ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400">unidades ingresadas en el período</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <ArrowUpFromLine className="h-4 w-4" />
            </span>
            Salidas
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatoNumero(resumen?.salidas ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400">unidades retiradas en el período</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            Movimientos
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatoNumero(resumen?.cantidad ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400">registros en el período seleccionado</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            placeholder="Producto, código o documento…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <Seleccion
          value={productoId}
          onChange={(evento) => {
            setProductoId(evento.target.value);
            setPagina(1);
          }}
          aria-label="Producto"
        >
          <option value="">Todos los productos</option>
          {(productos?.items ?? []).map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.codigo} · {producto.nombre}
            </option>
          ))}
        </Seleccion>

        <Seleccion
          value={tipo}
          onChange={(evento) => {
            setTipo(evento.target.value);
            setPagina(1);
          }}
          aria-label="Tipo"
        >
          <option value="">Entradas y salidas</option>
          <option value="Entrada">Solo entradas</option>
          <option value="Salida">Solo salidas</option>
        </Seleccion>

        <Seleccion
          value={origen}
          onChange={(evento) => {
            setOrigen(evento.target.value);
            setPagina(1);
          }}
          aria-label="Origen"
        >
          <option value="">Todos los orígenes</option>
          {origenes.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.etiqueta}
            </option>
          ))}
        </Seleccion>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={desde}
            onChange={(evento) => {
              setDesde(evento.target.value);
              setPagina(1);
            }}
            className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600"
            aria-label="Desde"
          />
          <input
            type="date"
            value={hasta}
            onChange={(evento) => {
              setHasta(evento.target.value);
              setPagina(1);
            }}
            className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-emerald-600"
            aria-label="Hasta"
          />
        </div>
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(movimiento) => movimiento.id}
        vacio="No se encontraron movimientos con los filtros seleccionados."
        pie={
          datos && (
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              total={datos.total}
              tamanoPagina={datos.tamanoPagina}
              onCambiar={setPagina}
            />
          )
        }
      />

      <ModalAjuste
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={(resultado) => void alGuardarAjuste(resultado)}
      />
    </div>
  );
}

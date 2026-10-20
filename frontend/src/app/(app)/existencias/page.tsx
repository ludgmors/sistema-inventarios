"use client";

import {
  Boxes,
  Download,
  History,
  PackageSearch,
  Plus,
  Search,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia, InsigniaEstado } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { ModalAjuste } from "@/components/inventario/ModalAjuste";
import { useAuth } from "@/components/layout/AuthProvider";
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
import { useDebounce } from "@/lib/useDebounce";
import type {
  AjusteRespuesta,
  Categoria,
  Existencia,
  KardexFila,
  Paginado,
  ResumenExistencias,
} from "@/lib/tipos";

const nombreOrigen = (origen: string): string => {
  const nombres: Record<string, string> = {
    Compra: "Compra",
    Venta: "Venta",
    NotaCredito: "Nota de crédito",
    NotaDebito: "Nota de débito",
    Ajuste: "Ajuste",
    Anulacion: "Anulación",
  };

  return nombres[origen] ?? origen;
};

function ModalKardex({
  producto,
  onCerrar,
}: {
  producto: Existencia | null;
  onCerrar: () => void;
}) {
  const [desde, setDesde] = useState(haceDiasISO(30));
  const [hasta, setHasta] = useState(hoyISO());

  useEffect(() => {
    if (!producto) return;
    setDesde(haceDiasISO(30));
    setHasta(hoyISO());
  }, [producto]);

  const { datos, cargando, error } = useApi<KardexFila[]>(
    producto
      ? `/api/reportes/kardex${construirQuery({
          productoId: producto.productoId,
          desde,
          hasta,
        })}`
      : null,
  );

  const exportar = () => {
    if (!producto || !datos?.length) return;

    descargarCsv(
      `kardex-${producto.codigo}.csv`,
      [
        "Fecha",
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
      datos.map((fila) => [
        formatoFecha(fila.fecha, true),
        fila.tipo,
        nombreOrigen(fila.origen),
        fila.documentoNumero ?? "",
        fila.cantidad,
        fila.costoUnitario,
        fila.saldoAnterior,
        fila.saldoNuevo,
        fila.usuario,
        fila.observacion ?? "",
      ]),
    );
  };

  return (
    <Modal
      abierto={Boolean(producto)}
      titulo={producto ? `Kardex · ${producto.nombre}` : "Kardex"}
      descripcion={
        producto
          ? `${producto.codigo} · Existencia actual: ${formatoNumero(producto.existenciaActual)} ${producto.unidadMedida}`
          : undefined
      }
      onCerrar={onCerrar}
      tamano="xl"
      pie={
        <>
          <Boton
            variante="secundario"
            onClick={exportar}
            disabled={!datos?.length}
            icono={<Download className="h-4 w-4" />}
          >
            Exportar CSV
          </Boton>
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Desde">
            <input
              type="date"
              value={desde}
              onChange={(evento) => setDesde(evento.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
            />
          </Campo>
          <Campo etiqueta="Hasta">
            <input
              type="date"
              value={hasta}
              onChange={(evento) => setHasta(evento.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600"
            />
          </Campo>
        </div>

        {error && <Aviso tono="error">{error}</Aviso>}

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5">Origen / documento</th>
                  <th className="px-3 py-2.5 text-right">Cantidad</th>
                  <th className="px-3 py-2.5 text-right">Costo</th>
                  <th className="px-3 py-2.5 text-right">Saldo</th>
                  <th className="px-3 py-2.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-slate-400">
                      Cargando kardex…
                    </td>
                  </tr>
                ) : !datos?.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-slate-400">
                      No hay movimientos en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  datos.map((fila) => (
                    <tr key={fila.id}>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                        {formatoFecha(fila.fecha, true)}
                      </td>
                      <td className="px-3 py-2.5">
                        <InsigniaEstado estado={fila.tipo} />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs text-slate-600">{nombreOrigen(fila.origen)}</p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {fila.documentoNumero ?? "—"}
                        </p>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-xs font-bold ${
                          fila.tipo === "Entrada" ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {fila.tipo === "Entrada" ? "+" : "−"}
                        {formatoNumero(fila.cantidad)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-500">
                        {formatoMoneda(fila.costoUnitario)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-slate-600">
                        {formatoNumero(fila.saldoAnterior)} →{" "}
                        <span className="font-semibold text-slate-800">
                          {formatoNumero(fila.saldoNuevo)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{fila.usuario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function PaginaExistencias() {
  const { tieneRol } = useAuth();
  const puedeAjustar = tieneRol("Administrador", "Inventario");

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [categoriaId, setCategoriaId] = useState("");
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [soloActivos, setSoloActivos] = useState(true);
  const [pagina, setPagina] = useState(1);

  const [productoKardex, setProductoKardex] = useState<Existencia | null>(null);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const { datos, cargando, error, recargar } = useApi<Paginado<Existencia>>(
    `/api/existencias${construirQuery({
      pagina,
      tamanoPagina: 15,
      buscar: busquedaAplicada,
      categoriaId,
      soloBajoMinimo: soloBajoMinimo || undefined,
      soloActivos: soloActivos || undefined,
    })}`,
  );

  const {
    datos: resumen,
    recargar: recargarResumen,
  } = useApi<ResumenExistencias>("/api/existencias/resumen");

  const { datos: categorias } = useApi<Categoria[]>("/api/categorias");

  const exportar = () => {
    if (!datos?.items.length) return;

    descargarCsv(
      `existencias-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Código",
        "Producto",
        "Categoría",
        "Unidad",
        "Existencia",
        "Mínima",
        "Costo unitario",
        "Precio venta",
        "Valor costo",
        "Valor venta",
        "Estado",
      ],
      datos.items.map((item) => [
        item.codigo,
        item.nombre,
        item.categoria,
        item.unidadMedida,
        item.existenciaActual,
        item.existenciaMinima,
        item.precioCosto,
        item.precioVenta,
        item.valorCosto,
        item.valorVenta,
        item.bajoMinimo ? "Bajo mínimo" : "Normal",
      ]),
    );
  };

  const alGuardarAjuste = async (resultado: AjusteRespuesta) => {
    setMensaje(
      `Ajuste ${resultado.numero} registrado. Nueva existencia de ${resultado.producto}: ${formatoNumero(resultado.existenciaNueva)}.`,
    );
    await Promise.all([recargar(), recargarResumen()]);
  };

  const columnas: Columna<Existencia>[] = [
    {
      clave: "producto",
      titulo: "Producto",
      render: (item) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
          <p className="font-mono text-[11px] text-slate-400">
            {item.codigo} · {item.categoria}
          </p>
        </div>
      ),
    },
    {
      clave: "existencia",
      titulo: "Existencia",
      alineacion: "derecha",
      render: (item) => (
        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              item.bajoMinimo ? "text-red-600" : "text-slate-900"
            }`}
          >
            {formatoNumero(item.existenciaActual)}
          </p>
          <p className="text-[10px] text-slate-400">
            {item.unidadMedida} · mín. {formatoNumero(item.existenciaMinima)}
          </p>
        </div>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (item) => (
        <div className="flex flex-col items-center gap-1">
          <Insignia tono={item.activo ? "verde" : "gris"}>
            {item.activo ? "Activo" : "Inactivo"}
          </Insignia>
          {item.bajoMinimo && (
            <Insignia tono="rojo">
              <TriangleAlert className="h-3 w-3" /> Bajo mínimo
            </Insignia>
          )}
        </div>
      ),
    },
    {
      clave: "costo",
      titulo: "Costo unit.",
      alineacion: "derecha",
      render: (item) => (
        <span className="text-xs text-slate-500">{formatoMoneda(item.precioCosto)}</span>
      ),
    },
    {
      clave: "precio",
      titulo: "Precio venta",
      alineacion: "derecha",
      render: (item) => (
        <span className="text-xs font-medium text-slate-700">{formatoMoneda(item.precioVenta)}</span>
      ),
    },
    {
      clave: "valores",
      titulo: "Valorización",
      alineacion: "derecha",
      render: (item) => (
        <div className="text-right text-[11px]">
          <p className="text-slate-500">Costo: {formatoMoneda(item.valorCosto)}</p>
          <p className="font-semibold text-slate-700">Venta: {formatoMoneda(item.valorVenta)}</p>
        </div>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (item) => (
        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={() => setProductoKardex(item)}
          icono={<History className="h-3.5 w-3.5" />}
        >
          Kardex
        </Boton>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Existencias"
        descripcion="Consulte el inventario disponible, su valorización y el historial de cada producto."
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
              <Boton onClick={() => setModalAjuste(true)} icono={<Plus className="h-4 w-4" />}>
                Ajustar inventario
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

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Productos activos</p>
            <PackageSearch className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatoNumero(resumen?.totalProductos ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {formatoNumero(resumen?.productosBajoMinimo ?? 0)} por debajo del mínimo
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Unidades en stock</p>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatoNumero(resumen?.unidadesEnStock ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">suma de todas las existencias</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Valor al costo</p>
            <Warehouse className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatoMoneda(resumen?.valorCosto ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">inversión actual en inventario</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-700">Valor de venta</p>
            <Boxes className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {formatoMoneda(resumen?.valorVenta ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            margen potencial: {formatoMoneda((resumen?.valorVenta ?? 0) - (resumen?.valorCosto ?? 0))}
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            placeholder="Código, producto o categoría…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <Seleccion
          value={categoriaId}
          onChange={(evento) => {
            setCategoriaId(evento.target.value);
            setPagina(1);
          }}
          aria-label="Categoría"
        >
          <option value="">Todas las categorías</option>
          {(categorias ?? []).map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Seleccion>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={soloBajoMinimo}
            onChange={(evento) => {
              setSoloBajoMinimo(evento.target.checked);
              setPagina(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
          />
          Solo bajo mínimo
        </label>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(evento) => {
              setSoloActivos(evento.target.checked);
              setPagina(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
          />
          Solo activos
        </label>
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(item) => item.productoId}
        vacio="No se encontraron existencias con los filtros seleccionados."
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

      <ModalKardex producto={productoKardex} onCerrar={() => setProductoKardex(null)} />

      <ModalAjuste
        abierto={modalAjuste}
        onCerrar={() => setModalAjuste(false)}
        onGuardado={(resultado) => void alGuardarAjuste(resultado)}
      />
    </div>
  );
}

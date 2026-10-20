"use client";

import { ArrowLeft, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { Cargando } from "@/components/ui/Cargando";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoMoneda, hoyISO } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { Cliente, Paginado, Producto, Venta } from "@/lib/tipos";

interface LineaVenta {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

const formasPago = ["Efectivo", "Tarjeta", "Transferencia", "Yappy", "Cheque"];

export default function PaginaNuevaVenta() {
  const router = useRouter();
  const { datos: clientes, cargando: cargandoClientes } = useApi<Paginado<Cliente>>(
    "/api/clientes?tamanoPagina=200",
  );
  const { datos: productos, cargando: cargandoProductos } = useApi<Paginado<Producto>>(
    "/api/productos?tamanoPagina=200&soloActivos=true",
  );

  const [clienteId, setClienteId] = useState(0);
  const [fecha, setFecha] = useState(hoyISO());
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [descuento, setDescuento] = useState(0);
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(7);
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<LineaVenta[]>([
    { productoId: 0, cantidad: 1, precioUnitario: 0, descuento: 0 },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const productosPorId = useMemo(() => {
    const mapa = new Map<number, Producto>();
    (productos?.items ?? []).forEach((producto) => mapa.set(producto.id, producto));
    return mapa;
  }, [productos]);

  const subtotal = lineas.reduce(
    (total, linea) =>
      total +
      Math.max(
        Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0) -
          Number(linea.descuento || 0),
        0,
      ),
    0,
  );

  const descuentoGeneral = Math.min(Number(descuento || 0), subtotal);
  const baseImponible = subtotal - descuentoGeneral;
  const impuesto = baseImponible * (Number(impuestoPorcentaje) / 100);
  const total = baseImponible + impuesto;

  const hayStockInsuficiente = lineas.some((linea) => {
    const producto = productosPorId.get(linea.productoId);
    return Boolean(producto && linea.cantidad > producto.existenciaActual);
  });

  const agregarLinea = () => {
    setLineas([...lineas, { productoId: 0, cantidad: 1, precioUnitario: 0, descuento: 0 }]);
  };

  const eliminarLinea = (indice: number) => {
    setLineas(lineas.filter((_, posicion) => posicion !== indice));
  };

  const actualizarLinea = (indice: number, cambios: Partial<LineaVenta>) => {
    setLineas((actuales) =>
      actuales.map((linea, posicion) =>
        posicion === indice ? { ...linea, ...cambios } : linea,
      ),
    );
  };

  const seleccionarProducto = (indice: number, productoId: number) => {
    const producto = productosPorId.get(productoId);
    actualizarLinea(indice, {
      productoId,
      precioUnitario: producto?.precioVenta ?? 0,
      descuento: 0,
    });
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");

    const detalles = lineas.filter((linea) => linea.productoId > 0 && linea.cantidad > 0);

    if (detalles.length === 0) {
      setError("Debe agregar al menos un producto con cantidad mayor que cero.");
      return;
    }

    if (hayStockInsuficiente) {
      setError("Hay productos con cantidad mayor a la existencia disponible.");
      return;
    }

    setGuardando(true);

    try {
      const venta = await apiFetch<Venta>("/api/ventas", {
        method: "POST",
        body: JSON.stringify({
          clienteId: clienteId > 0 ? clienteId : null,
          fecha: `${fecha}T${new Date().toTimeString().slice(0, 8)}`,
          formaPago,
          descuento: descuentoGeneral,
          impuestoPorcentaje,
          observaciones,
          detalles,
        }),
      });

      router.push(`/ventas/${venta.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoClientes || cargandoProductos) {
    return <Cargando texto="Cargando catálogos…" />;
  }

  return (
    <div>
      <Link
        href="/ventas"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a ventas
      </Link>

      <EncabezadoPagina
        titulo="Registrar venta"
        descripcion="La venta descuenta automáticamente las existencias y queda registrada para reportes."
      />

      <form onSubmit={guardar} className="space-y-5">
        {error && <Aviso tono="error">{error}</Aviso>}
        {hayStockInsuficiente && (
          <Aviso tono="aviso">
            <span className="inline-flex items-center gap-1">
              <TriangleAlert className="h-3.5 w-3.5" />
              Revise las cantidades: un producto supera la existencia disponible.
            </span>
          </Aviso>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo etiqueta="Cliente" className="lg:col-span-2">
              <Seleccion
                value={clienteId}
                onChange={(evento) => setClienteId(Number(evento.target.value))}
              >
                <option value={0}>Consumidor final</option>
                {(clientes?.items ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>

            <Campo etiqueta="Fecha">
              <Entrada
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                required
              />
            </Campo>

            <Campo etiqueta="Forma de pago">
              <Seleccion
                value={formaPago}
                onChange={(evento) => setFormaPago(evento.target.value)}
              >
                {formasPago.map((forma) => (
                  <option key={forma} value={forma}>
                    {forma}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Productos vendidos</h2>
              <p className="text-xs text-slate-500">
                Los precios se cargan del catálogo y pueden ajustarse.
              </p>
            </div>
            <Boton
              type="button"
              variante="secundario"
              tamano="sm"
              onClick={agregarLinea}
              icono={<Plus className="h-3.5 w-3.5" />}
            >
              Agregar línea
            </Boton>
          </div>

          <div className="divide-y divide-slate-100">
            {lineas.map((linea, indice) => {
              const producto = productosPorId.get(linea.productoId);
              const importe = Math.max(
                Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0) -
                  Number(linea.descuento || 0),
                0,
              );
              const stockInsuficiente = Boolean(
                producto && linea.cantidad > producto.existenciaActual,
              );

              return (
                <div
                  key={indice}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_100px_120px_110px_120px_40px] sm:items-end"
                >
                  <Campo etiqueta={indice === 0 ? "Producto" : undefined}>
                    <Seleccion
                      value={linea.productoId}
                      onChange={(evento) =>
                        seleccionarProducto(indice, Number(evento.target.value))
                      }
                    >
                      <option value={0}>Seleccione…</option>
                      {(productos?.items ?? []).map((opcion) => (
                        <option key={opcion.id} value={opcion.id}>
                          {opcion.codigo} · {opcion.nombre}
                        </option>
                      ))}
                    </Seleccion>
                  </Campo>

                  <Campo etiqueta={indice === 0 ? "Cantidad" : undefined}>
                    <Entrada
                      type="number"
                      min={0.0001}
                      step="0.0001"
                      value={linea.cantidad}
                      onChange={(evento) =>
                        actualizarLinea(indice, { cantidad: Number(evento.target.value) })
                      }
                    />
                  </Campo>

                  <Campo etiqueta={indice === 0 ? "Precio" : undefined}>
                    <Entrada
                      type="number"
                      min={0}
                      step="0.01"
                      value={linea.precioUnitario}
                      onChange={(evento) =>
                        actualizarLinea(indice, {
                          precioUnitario: Number(evento.target.value),
                        })
                      }
                    />
                  </Campo>

                  <Campo etiqueta={indice === 0 ? "Descuento" : undefined}>
                    <Entrada
                      type="number"
                      min={0}
                      step="0.01"
                      value={linea.descuento}
                      onChange={(evento) =>
                        actualizarLinea(indice, { descuento: Number(evento.target.value) })
                      }
                    />
                  </Campo>

                  <div className="pb-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Importe
                    </p>
                    <p className="text-sm font-bold text-slate-800">{formatoMoneda(importe)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarLinea(indice)}
                    disabled={lineas.length === 1}
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Eliminar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {producto && (
                    <p
                      className={`text-[11px] sm:col-span-6 sm:-mt-2 ${
                        stockInsuficiente ? "font-semibold text-red-600" : "text-slate-400"
                      }`}
                    >
                      Existencia: {producto.existenciaActual} {producto.unidadMedida} · Precio
                      catálogo: {formatoMoneda(producto.precioVenta)}
                      {stockInsuficiente && " · Stock insuficiente"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Campo etiqueta="Observaciones">
              <AreaTexto
                value={observaciones}
                onChange={(evento) => setObservaciones(evento.target.value)}
                placeholder="Notas o referencia de la venta (opcional)"
                maxLength={500}
              />
            </Campo>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Resumen</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <dt>Subtotal</dt>
                <dd>{formatoMoneda(subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 text-slate-500">
                <dt>Descuento general</dt>
                <dd className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={descuento}
                    onChange={(evento) => setDescuento(Number(evento.target.value))}
                    className="h-8 w-24 rounded-md border border-slate-300 px-2 text-right text-xs outline-none focus:border-emerald-600"
                  />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 text-slate-500">
                <dt>Impuesto (%)</dt>
                <dd>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={impuestoPorcentaje}
                    onChange={(evento) => setImpuestoPorcentaje(Number(evento.target.value))}
                    className="h-8 w-20 rounded-md border border-slate-300 px-2 text-right text-xs outline-none focus:border-emerald-600"
                  />
                </dd>
              </div>

              <div className="flex justify-between text-slate-500">
                <dt>Impuesto</dt>
                <dd>{formatoMoneda(impuesto)}</dd>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <dt>Total</dt>
                <dd>{formatoMoneda(total)}</dd>
              </div>
            </dl>

            <Boton
              type="submit"
              cargando={guardando}
              className="mt-5 w-full"
              icono={<Save className="h-4 w-4" />}
            >
              Registrar venta
            </Boton>
          </div>
        </div>
      </form>
    </div>
  );
}

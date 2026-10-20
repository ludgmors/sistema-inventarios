"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada, Seleccion, AreaTexto } from "@/components/ui/Campos";
import { Cargando } from "@/components/ui/Cargando";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoMoneda, hoyISO } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { Compra, Paginado, Producto, Proveedor } from "@/lib/tipos";

interface LineaCompra {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export default function PaginaNuevaCompra() {
  const router = useRouter();
  const { datos: proveedores, cargando: cargandoProveedores } = useApi<Paginado<Proveedor>>(
    "/api/proveedores?tamanoPagina=200",
  );
  const { datos: productos, cargando: cargandoProductos } = useApi<Paginado<Producto>>(
    "/api/productos?tamanoPagina=200&soloActivos=true",
  );

  const [proveedorId, setProveedorId] = useState(0);
  const [fecha, setFecha] = useState(hoyISO());
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(7);
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<LineaCompra[]>([
    { productoId: 0, cantidad: 1, precioUnitario: 0 },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const productosPorId = useMemo(() => {
    const mapa = new Map<number, Producto>();
    (productos?.items ?? []).forEach((producto) => mapa.set(producto.id, producto));
    return mapa;
  }, [productos]);

  const subtotal = lineas.reduce(
    (total, linea) => total + Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
    0,
  );
  const impuesto = subtotal * (Number(impuestoPorcentaje) / 100);
  const total = subtotal + impuesto;

  const agregarLinea = () => {
    setLineas([...lineas, { productoId: 0, cantidad: 1, precioUnitario: 0 }]);
  };

  const eliminarLinea = (indice: number) => {
    setLineas(lineas.filter((_, posicion) => posicion !== indice));
  };

  const actualizarLinea = (indice: number, cambios: Partial<LineaCompra>) => {
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
      precioUnitario: producto?.precioCosto ?? 0,
    });
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");

    if (proveedorId <= 0) {
      setError("Debe seleccionar un proveedor.");
      return;
    }

    const detalles = lineas.filter((linea) => linea.productoId > 0 && linea.cantidad > 0);

    if (detalles.length === 0) {
      setError("Debe agregar al menos un producto con cantidad mayor que cero.");
      return;
    }

    setGuardando(true);

    try {
      const compra = await apiFetch<Compra>("/api/compras", {
        method: "POST",
        body: JSON.stringify({
          proveedorId,
          fecha: `${fecha}T${new Date().toTimeString().slice(0, 8)}`,
          impuestoPorcentaje,
          observaciones,
          detalles,
        }),
      });

      router.push(`/compras/${compra.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoProveedores || cargandoProductos) {
    return <Cargando texto="Cargando catálogos…" />;
  }

  return (
    <div>
      <Link
        href="/compras"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a compras
      </Link>

      <EncabezadoPagina
        titulo="Registrar compra"
        descripcion="La compra genera entradas de inventario y actualiza el costo promedio de los productos."
      />

      <form onSubmit={guardar} className="space-y-5">
        {error && <Aviso tono="error">{error}</Aviso>}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo etiqueta="Proveedor" requerido className="lg:col-span-2">
              <Seleccion
                value={proveedorId}
                onChange={(evento) => setProveedorId(Number(evento.target.value))}
                required
              >
                <option value={0}>Seleccione un proveedor…</option>
                {(proveedores?.items ?? []).map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.razonSocial}
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

            <Campo etiqueta="Impuesto (%)">
              <Entrada
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={impuestoPorcentaje}
                onChange={(evento) => setImpuestoPorcentaje(Number(evento.target.value))}
              />
            </Campo>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Productos de la compra</h2>
              <p className="text-xs text-slate-500">Seleccione los productos y cantidades recibidas.</p>
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
              const importe = Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0);

              return (
                <div key={indice} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_110px_130px_120px_40px] sm:items-end">
                  <Campo etiqueta={indice === 0 ? "Producto" : undefined}>
                    <Seleccion
                      value={linea.productoId}
                      onChange={(evento) => seleccionarProducto(indice, Number(evento.target.value))}
                    >
                      <option value={0}>Seleccione…</option>
                      {(productos?.items ?? []).map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.codigo} · {producto.nombre}
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

                  <Campo etiqueta={indice === 0 ? "Costo unitario" : undefined}>
                    <Entrada
                      type="number"
                      min={0}
                      step="0.01"
                      value={linea.precioUnitario}
                      onChange={(evento) =>
                        actualizarLinea(indice, { precioUnitario: Number(evento.target.value) })
                      }
                    />
                  </Campo>

                  <div className="pb-2 text-right sm:pb-2.5">
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
                    <p className="text-[11px] text-slate-400 sm:col-span-5 sm:-mt-2">
                      Existencia actual: {producto.existenciaActual} {producto.unidadMedida} · Costo
                      actual: {formatoMoneda(producto.precioCosto)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Campo etiqueta="Observaciones">
              <AreaTexto
                value={observaciones}
                onChange={(evento) => setObservaciones(evento.target.value)}
                placeholder="Notas o referencia de la compra (opcional)"
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
              <div className="flex justify-between text-slate-500">
                <dt>Impuesto ({impuestoPorcentaje}%)</dt>
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
              Registrar compra
            </Boton>
          </div>
        </div>
      </form>
    </div>
  );
}

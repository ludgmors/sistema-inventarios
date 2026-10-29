"use client";

import { ArrowLeft, Info, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoMoneda, formatoNumero, hoyISO } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { Nota, Paginado, Venta, VentaResumen } from "@/lib/tipos";

interface LineaNota {
  productoId: number;
  producto: string;
  cantidadVendida: number;
  cantidad: number;
  precioUnitario: number;
}

export default function PaginaNuevaNota() {
  const router = useRouter();
  const [ventaId, setVentaId] = useState(0);
  const [tipo, setTipo] = useState<"Credito" | "Debito">("Credito");
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [impuestoPorcentaje, setImpuestoPorcentaje] = useState(12);
  const [lineas, setLineas] = useState<LineaNota[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const { datos: ventas } = useApi<Paginado<VentaResumen>>(
    "/api/ventas?tamanoPagina=200&estado=Registrada",
  );
  const {
    datos: venta,
    cargando: cargandoVenta,
    error: errorVenta,
  } = useApi<Venta>(ventaId > 0 ? `/api/ventas/${ventaId}` : null);

  useEffect(() => {
    const parametro = Number(new URLSearchParams(window.location.search).get("ventaId"));

    if (Number.isFinite(parametro) && parametro > 0) {
      setVentaId(parametro);
    }
  }, []);

  useEffect(() => {
    if (!venta) return;

    setLineas(
      venta.detalles.map((detalle) => ({
        productoId: detalle.productoId,
        producto: detalle.producto,
        cantidadVendida: detalle.cantidad,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
      })),
    );
    setImpuestoPorcentaje(venta.impuestoPorcentaje ?? 12);
  }, [venta]);

  const creditoUtilizado = useMemo(
    () =>
      (venta?.notas ?? [])
        .filter((nota) => nota.tipo === "Credito" && nota.estado === "Registrada")
        .reduce((total, nota) => total + nota.total, 0),
    [venta],
  );

  const disponibleCredito = Math.max((venta?.total ?? 0) - creditoUtilizado, 0);
  const subtotal = lineas.reduce(
    (total, linea) => total + Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0),
    0,
  );
  const impuesto = subtotal * (Number(impuestoPorcentaje) / 100);
  const total = subtotal + impuesto;

  const actualizarLinea = (indice: number, cambios: Partial<LineaNota>) => {
    setLineas((actuales) =>
      actuales.map((linea, posicion) =>
        posicion === indice ? { ...linea, ...cambios } : linea,
      ),
    );
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");

    if (!venta) {
      setError("Debe seleccionar una venta registrada.");
      return;
    }

    if (!motivo.trim()) {
      setError("Indique el motivo de la nota.");
      return;
    }

    const detalles = lineas.filter((linea) => linea.cantidad > 0);

    if (detalles.length === 0) {
      setError("Debe indicar al menos un producto con cantidad mayor que cero.");
      return;
    }

    if (detalles.some((linea) => linea.cantidad > linea.cantidadVendida)) {
      setError("La cantidad de una nota no puede superar la cantidad vendida del producto.");
      return;
    }

    if (tipo === "Credito" && total > disponibleCredito + 0.001) {
      setError(
        `El total de la nota supera el crédito disponible de la venta (${formatoMoneda(disponibleCredito)}).`,
      );
      return;
    }

    setGuardando(true);

    try {
      const nota = await apiFetch<Nota>("/api/notas", {
        method: "POST",
        body: JSON.stringify({
          ventaId: venta.id,
          tipo,
          motivo: motivo.trim(),
          fecha: `${fecha}T${new Date().toTimeString().slice(0, 8)}`,
          impuestoPorcentaje,
          detalles: detalles.map((linea) => ({
            productoId: linea.productoId,
            cantidad: linea.cantidad,
            precioUnitario: linea.precioUnitario,
          })),
        }),
      });

      router.push(`/notas/${nota.id}`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <Link
        href="/notas"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a notas
      </Link>

      <EncabezadoPagina
        titulo="Registrar nota de ajuste"
        descripcion="Las notas de crédito devuelven existencias; las notas de débito descuentan inventario."
      />

      <form onSubmit={guardar} className="space-y-5">
        {error && <Aviso tono="error">{error}</Aviso>}
        {errorVenta && <Aviso tono="error">{errorVenta}</Aviso>}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo etiqueta="Venta de referencia" requerido className="lg:col-span-2">
              <Seleccion
                value={ventaId}
                onChange={(evento) => {
                  setVentaId(Number(evento.target.value));
                  setLineas([]);
                }}
                required
              >
                <option value={0}>Seleccione una venta registrada…</option>
                {(ventas?.items ?? []).map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.numero} · {opcion.cliente} · {formatoMoneda(opcion.total)}
                  </option>
                ))}
              </Seleccion>
            </Campo>

            <Campo etiqueta="Tipo de nota" requerido>
              <Seleccion
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value as "Credito" | "Debito")}
              >
                <option value="Credito">Nota de crédito (devuelve inventario)</option>
                <option value="Debito">Nota de débito (descuenta inventario)</option>
              </Seleccion>
            </Campo>

            <Campo etiqueta="Fecha" requerido>
              <Entrada
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
                required
              />
            </Campo>
          </div>
        </div>

        {cargandoVenta && (
          <Aviso tono="info">Cargando los productos de la venta seleccionada…</Aviso>
        )}

        {venta && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Cliente
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{venta.cliente}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Total de la venta
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatoMoneda(venta.total)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Crédito utilizado
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatoMoneda(creditoUtilizado)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Crédito disponible
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {formatoMoneda(disponibleCredito)}
              </p>
            </div>
          </div>
        )}

        {!venta && !cargandoVenta && (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/60 p-8 text-center">
            <Info className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Seleccione una venta para cargar sus productos.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Solo se pueden ajustar productos incluidos en la venta de referencia.
            </p>
          </div>
        )}

        {venta && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Productos de la nota</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indique la cantidad ajustada. No puede superar la cantidad vendida.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-3 py-3 text-right">Cantidad vendida</th>
                    <th className="px-3 py-3 text-right">Cantidad nota</th>
                    <th className="px-3 py-3 text-right">Precio</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lineas.map((linea, indice) => (
                    <tr key={linea.productoId}>
                      <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{linea.producto}</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                        {formatoNumero(linea.cantidadVendida)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={linea.cantidadVendida}
                          step="0.0001"
                          value={linea.cantidad}
                          onChange={(evento) =>
                            actualizarLinea(indice, { cantidad: Number(evento.target.value) })
                          }
                          className="h-9 w-24 rounded-md border border-slate-300 dark:border-slate-600 px-2 text-right text-sm outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={linea.precioUnitario}
                          onChange={(evento) =>
                            actualizarLinea(indice, {
                              precioUnitario: Number(evento.target.value),
                            })
                          }
                          className="h-9 w-24 rounded-md border border-slate-300 dark:border-slate-600 px-2 text-right text-sm outline-none focus:border-emerald-600"
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatoMoneda(linea.cantidad * linea.precioUnitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <Campo etiqueta="Motivo" requerido>
              <AreaTexto
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                placeholder="Ej.: devolución de mercancía, descuento posterior, corrección de precio…"
                required
                maxLength={300}
              />
            </Campo>

            <div className="mt-3">
              <Aviso tono={tipo === "Credito" ? "info" : "aviso"}>
                {tipo === "Credito"
                  ? "La nota de crédito genera una entrada al inventario y reduce el saldo cobrado de la venta."
                  : "La nota de débito genera una salida del inventario y aumenta el saldo cobrado de la venta."}
              </Aviso>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Resumen de la nota</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <dt>Subtotal</dt>
                <dd>{formatoMoneda(subtotal)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
                <dt>Impuesto (%)</dt>
                <dd>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={impuestoPorcentaje}
                    onChange={(evento) => setImpuestoPorcentaje(Number(evento.target.value))}
                    className="h-8 w-20 rounded-md border border-slate-300 dark:border-slate-600 px-2 text-right text-xs outline-none focus:border-emerald-600"
                  />
                </dd>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <dt>Impuesto</dt>
                <dd>{formatoMoneda(impuesto)}</dd>
              </div>

              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <dt>Total</dt>
                <dd>{formatoMoneda(total)}</dd>
              </div>
            </dl>

            <Boton
              type="submit"
              cargando={guardando}
              disabled={!venta}
              className="mt-5 w-full"
              icono={<Save className="h-4 w-4" />}
            >
              Registrar nota
            </Boton>
          </div>
        </div>
      </form>
    </div>
  );
}

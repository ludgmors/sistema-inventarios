"use client";

import { ArrowLeft, Ban, Building2, FilePlus2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { Insignia, InsigniaEstado } from "@/components/ui/Insignia";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoFecha, formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useEmpresa } from "@/lib/useEmpresa";
import type { Venta } from "@/lib/tipos";

export default function PaginaDetalleVenta() {
  const parametros = useParams<{ id: string }>();
  const id = Number(parametros?.id);
  const { tieneRol } = useAuth();
  const empresa = useEmpresa();
  const { datos: venta, cargando, error, recargar } = useApi<Venta>(
    Number.isFinite(id) ? `/api/ventas/${id}` : null,
  );

  const [confirmar, setConfirmar] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const anular = async () => {
    if (!venta) return;
    setAnulando(true);
    setErrorAccion("");

    try {
      await apiFetch(`/api/ventas/${venta.id}/anular`, { method: "POST" });
      setConfirmar(false);
      await recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
      setConfirmar(false);
    } finally {
      setAnulando(false);
    }
  };

  if (cargando) return <Cargando texto="Cargando venta…" />;

  if (error || !venta) {
    return (
      <div className="space-y-4">
        <Aviso tono="error">{error || "No se encontró la venta."}</Aviso>
        <Link href="/ventas" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Volver a ventas
        </Link>
      </div>
    );
  }

  const notasVigentes = venta.notas.filter((nota) => nota.estado === "Registrada");

  return (
    <div className="space-y-5">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/ventas"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a ventas
        </Link>

        <div className="flex flex-wrap gap-2">
          <Boton
            variante="secundario"
            onClick={() => window.print()}
            icono={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Boton>

          {tieneRol("Administrador", "Ventas") && venta.estado === "Registrada" && (
            <Link
              href={`/notas/nueva?ventaId=${venta.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FilePlus2 className="h-4 w-4" /> Nota de ajuste
            </Link>
          )}

          {tieneRol("Administrador") && venta.estado === "Registrada" && (
            <Boton
              variante="peligro"
              onClick={() => setConfirmar(true)}
              icono={<Ban className="h-4 w-4" />}
            >
              Anular venta
            </Boton>
          )}
        </div>
      </div>

      {errorAccion && <div className="no-imprimir"><Aviso tono="error">{errorAccion}</Aviso></div>}

      <article className="documento-impresion mx-auto max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-9">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{empresa.nombre}</h1>
              {empresa.documento && (
                <p className="text-xs text-slate-500 dark:text-slate-400">NIT / Documento: {empresa.documento}</p>
              )}
              {empresa.direccion && <p className="text-xs text-slate-500 dark:text-slate-400">{empresa.direccion}</p>}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {empresa.telefono} {empresa.correo && `· ${empresa.correo}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Documento de venta
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">{venta.numero}</p>
            <div className="mt-2 flex justify-end">
              <InsigniaEstado estado={venta.estado} />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{venta.cliente}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Fecha
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatoFecha(venta.fecha, true)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Forma de pago
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{venta.formaPago}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Vendedor
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{venta.usuario}</p>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
                <th className="px-3 py-2.5 text-right">Precio</th>
                <th className="px-3 py-2.5 text-right">Descuento</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {venta.detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {detalle.codigoProducto}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{detalle.producto}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                    {formatoNumero(detalle.cantidad)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                    {formatoMoneda(detalle.precioUnitario)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                    {formatoMoneda(detalle.descuento ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-100">
                    {formatoMoneda(detalle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-5 flex flex-col gap-5 sm:flex-row sm:justify-between">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Observaciones
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {venta.observaciones || "Sin observaciones."}
            </p>
            {venta.fechaAnulacion && (
              <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                Documento anulado el {formatoFecha(venta.fechaAnulacion, true)}.
              </p>
            )}
          </div>

          <dl className="w-full space-y-2 text-sm sm:w-64">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <dt>Subtotal</dt>
              <dd>{formatoMoneda(venta.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <dt>Descuento</dt>
              <dd>{formatoMoneda(venta.descuento)}</dd>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <dt>Impuesto ({venta.impuestoPorcentaje}%)</dt>
              <dd>{formatoMoneda(venta.impuesto)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <dt>Total</dt>
              <dd>{formatoMoneda(venta.total)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[10px] text-slate-400">
          Documento generado por el Sistema de Inventarios · {formatoFecha(new Date().toISOString(), true)}
        </footer>
      </article>

      {venta.notas.length > 0 && (
        <section className="no-imprimir rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notas de crédito y débito asociadas
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {venta.notas.map((nota) => (
              <div key={nota.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{nota.numero}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatoFecha(nota.fecha)} · {nota.motivo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Insignia tono={nota.tipo === "Credito" ? "azul" : "morado"}>
                    {nota.tipo === "Credito" ? "Crédito" : "Débito"}
                  </Insignia>
                  <InsigniaEstado estado={nota.estado} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatoMoneda(nota.total)}</span>
                </div>
              </div>
            ))}
          </div>
          {notasVigentes.length > 0 && (
            <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300">
              La venta tiene {notasVigentes.length} nota(s) vigente(s); anule primero las notas
              para poder anular la venta.
            </p>
          )}
        </section>
      )}

      <ModalConfirmacion
        abierto={confirmar}
        titulo="Anular venta"
        mensaje={`¿Confirma que desea anular la venta ${venta.numero}? Las existencias vendidas se devolverán al inventario.`}
        textoConfirmar="Anular venta"
        cargando={anulando}
        onConfirmar={() => void anular()}
        onCerrar={() => setConfirmar(false)}
      />
    </div>
  );
}

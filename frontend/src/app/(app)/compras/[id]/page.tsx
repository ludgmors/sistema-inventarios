"use client";

import { ArrowLeft, Ban, Building2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { InsigniaEstado } from "@/components/ui/Insignia";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoFecha, formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useEmpresa } from "@/lib/useEmpresa";
import type { Compra } from "@/lib/tipos";

export default function PaginaDetalleCompra() {
  const parametros = useParams<{ id: string }>();
  const id = Number(parametros?.id);
  const { tieneRol } = useAuth();
  const empresa = useEmpresa();
  const { datos: compra, cargando, error, recargar } = useApi<Compra>(
    Number.isFinite(id) ? `/api/compras/${id}` : null,
  );

  const [confirmar, setConfirmar] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const anular = async () => {
    if (!compra) return;
    setAnulando(true);
    setErrorAccion("");

    try {
      await apiFetch(`/api/compras/${compra.id}/anular`, { method: "POST" });
      setConfirmar(false);
      await recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
      setConfirmar(false);
    } finally {
      setAnulando(false);
    }
  };

  if (cargando) return <Cargando texto="Cargando compra…" />;

  if (error || !compra) {
    return (
      <div className="space-y-4">
        <Aviso tono="error">{error || "No se encontró la compra."}</Aviso>
        <Link href="/compras" className="text-sm font-semibold text-emerald-700">
          Volver a compras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/compras"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a compras
        </Link>

        <div className="flex flex-wrap gap-2">
          <Boton
            variante="secundario"
            onClick={() => window.print()}
            icono={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Boton>
          {tieneRol("Administrador") && compra.estado === "Registrada" && (
            <Boton
              variante="peligro"
              onClick={() => setConfirmar(true)}
              icono={<Ban className="h-4 w-4" />}
            >
              Anular compra
            </Boton>
          )}
        </div>
      </div>

      {errorAccion && <div className="no-imprimir"><Aviso tono="error">{errorAccion}</Aviso></div>}

      <article className="documento-impresion mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{empresa.nombre}</h1>
              {empresa.documento && (
                <p className="text-xs text-slate-500">RUC / Documento: {empresa.documento}</p>
              )}
              {empresa.direccion && <p className="text-xs text-slate-500">{empresa.direccion}</p>}
              <p className="text-xs text-slate-500">
                {empresa.telefono} {empresa.correo && `· ${empresa.correo}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Documento de compra
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900">{compra.numero}</p>
            <div className="mt-2 flex justify-end">
              <InsigniaEstado estado={compra.estado} />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Proveedor
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{compra.proveedor}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Fecha de emisión
            </p>
            <p className="mt-1 text-sm text-slate-700">{formatoFecha(compra.fecha, true)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Registrado por
            </p>
            <p className="mt-1 text-sm text-slate-700">{compra.usuario}</p>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
                <th className="px-3 py-2.5 text-right">Costo unitario</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compra.detalles.map((detalle) => (
                <tr key={detalle.id}>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                    {detalle.codigoProducto}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{detalle.producto}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {formatoNumero(detalle.cantidad)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {formatoMoneda(detalle.precioUnitario)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-slate-800">
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
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {compra.observaciones || "Sin observaciones."}
            </p>
            {compra.fechaAnulacion && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Documento anulado el {formatoFecha(compra.fechaAnulacion, true)}.
              </p>
            )}
          </div>

          <dl className="w-full space-y-2 text-sm sm:w-64">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd>{formatoMoneda(compra.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Impuesto ({compra.impuestoPorcentaje}%)</dt>
              <dd>{formatoMoneda(compra.impuesto)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatoMoneda(compra.total)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-8 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">
          Documento generado por el Sistema de Inventarios · {formatoFecha(new Date().toISOString(), true)}
        </footer>
      </article>

      <ModalConfirmacion
        abierto={confirmar}
        titulo="Anular compra"
        mensaje={`¿Confirma que desea anular la compra ${compra.numero}? Se revertirán las existencias ingresadas y la operación no se puede deshacer.`}
        textoConfirmar="Anular compra"
        cargando={anulando}
        onConfirmar={() => void anular()}
        onCerrar={() => setConfirmar(false)}
      />
    </div>
  );
}

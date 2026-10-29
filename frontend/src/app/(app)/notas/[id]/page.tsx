"use client";

import { ArrowLeft, Ban, Building2, Printer } from "lucide-react";
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
import type { Nota } from "@/lib/tipos";

export default function PaginaDetalleNota() {
  const parametros = useParams<{ id: string }>();
  const id = Number(parametros?.id);
  const { tieneRol } = useAuth();
  const empresa = useEmpresa();
  const { datos: nota, cargando, error, recargar } = useApi<Nota>(
    Number.isFinite(id) ? `/api/notas/${id}` : null,
  );

  const [confirmar, setConfirmar] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const anular = async () => {
    if (!nota) return;
    setAnulando(true);
    setErrorAccion("");

    try {
      await apiFetch(`/api/notas/${nota.id}/anular`, { method: "POST" });
      setConfirmar(false);
      await recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
      setConfirmar(false);
    } finally {
      setAnulando(false);
    }
  };

  if (cargando) return <Cargando texto="Cargando nota de ajuste…" />;

  if (error || !nota) {
    return (
      <div className="space-y-4">
        <Aviso tono="error">{error || "No se encontró la nota."}</Aviso>
        <Link href="/notas" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Volver a notas
        </Link>
      </div>
    );
  }

  const esCredito = nota.tipo === "Credito";

  return (
    <div className="space-y-5">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/notas"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a notas
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ventas/${nota.ventaId}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Ver venta {nota.ventaNumero}
          </Link>

          <Boton
            variante="secundario"
            onClick={() => window.print()}
            icono={<Printer className="h-4 w-4" />}
          >
            Imprimir
          </Boton>

          {tieneRol("Administrador") && nota.estado === "Registrada" && (
            <Boton
              variante="peligro"
              onClick={() => setConfirmar(true)}
              icono={<Ban className="h-4 w-4" />}
            >
              Anular nota
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
              {esCredito ? "Nota de crédito" : "Nota de débito"}
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">{nota.numero}</p>
            <div className="mt-2 flex justify-end">
              <InsigniaEstado estado={nota.estado} />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{nota.cliente}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Fecha
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatoFecha(nota.fecha, true)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Venta de referencia
            </p>
            <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-200">{nota.ventaNumero}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Registrado por
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{nota.usuario}</p>
          </div>
        </section>

        <section className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          <Insignia tono={esCredito ? "azul" : "morado"}>
            {esCredito ? "Crédito" : "Débito"}
          </Insignia>
          <span>
            {esCredito
              ? "Este documento devuelve mercancía al inventario."
              : "Este documento descuenta mercancía del inventario."}
          </span>
        </section>

        <section className="mt-7 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Cantidad</th>
                <th className="px-3 py-2.5 text-right">Precio</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {nota.detalles.map((detalle) => (
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
              Motivo
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{nota.motivo}</p>
            {nota.fechaAnulacion && (
              <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                Documento anulado el {formatoFecha(nota.fechaAnulacion, true)}.
              </p>
            )}
          </div>

          <dl className="w-full space-y-2 text-sm sm:w-64">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <dt>Subtotal</dt>
              <dd>{formatoMoneda(nota.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <dt>Impuesto ({nota.impuestoPorcentaje}%)</dt>
              <dd>{formatoMoneda(nota.impuesto)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <dt>Total</dt>
              <dd>{formatoMoneda(nota.total)}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[10px] text-slate-400">
          Documento generado por el Sistema de Inventarios · {formatoFecha(new Date().toISOString(), true)}
        </footer>
      </article>

      <ModalConfirmacion
        abierto={confirmar}
        titulo="Anular nota de ajuste"
        mensaje={`¿Confirma que desea anular la nota ${nota.numero}? Se revertirá el movimiento de inventario generado por este documento.`}
        textoConfirmar="Anular nota"
        cargando={anulando}
        onConfirmar={() => void anular()}
        onCerrar={() => setConfirmar(false)}
      />
    </div>
  );
}

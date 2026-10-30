"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Insignia } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { descargarArchivo, formatoNumero } from "@/lib/formato";

export type TipoImportacion = "productos" | "clientes" | "proveedores";

interface FilaImportacion {
  fila: number;
  estado: "valida" | "advertencia" | "error" | "omitida";
  mensajes: string[];
  datos: Record<string, string>;
}

interface Previsualizacion {
  tipo: string;
  totalFilas: number;
  validas: number;
  advertencias: number;
  omitidas: number;
  errores: number;
  columnas: string[];
  filas: FilaImportacion[];
}

interface Resultado {
  tipo: string;
  creados: number;
  actualizados: number;
  omitidos: number;
  errores: number;
  mensaje: string;
}

const titulos: Record<TipoImportacion, string> = {
  productos: "productos",
  clientes: "clientes",
  proveedores: "proveedores",
};

const tonos: Record<FilaImportacion["estado"], "verde" | "amarillo" | "rojo" | "gris"> = {
  valida: "verde",
  advertencia: "amarillo",
  error: "rojo",
  omitida: "gris",
};

const etiquetas: Record<FilaImportacion["estado"], string> = {
  valida: "Válida",
  advertencia: "Advertencia",
  error: "Error",
  omitida: "Se omite",
};

async function tokenCsrf(): Promise<string> {
  const respuesta = await fetch("/api/auth/csrf", { credentials: "include", cache: "no-store" });
  if (!respuesta.ok) throw new Error("No se pudo validar la seguridad. Intente nuevamente.");
  const datos = (await respuesta.json()) as { token: string };
  return datos.token;
}

async function leerError(respuesta: Response): Promise<string> {
  const texto = await respuesta.text();
  if (!texto) return "No se pudo procesar el archivo.";

  try {
    const datos = JSON.parse(texto) as { detail?: string; title?: string; errors?: Record<string, string[]> };
    if (datos.detail) return datos.detail;
    if (datos.title) return datos.title;
    if (datos.errors) {
      const primero = Object.values(datos.errors).flat()[0];
      if (primero) return primero;
    }
  } catch {
    // El cuerpo no era JSON.
  }

  return "No se pudo procesar el archivo.";
}

export function ModalImportacion({
  tipo,
  abierto,
  onCerrar,
  onImportado,
}: {
  tipo: TipoImportacion;
  abierto: boolean;
  onCerrar: () => void;
  onImportado: () => void | Promise<void>;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [previa, setPrevia] = useState<Previsualizacion | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const reiniciar = () => {
    setArchivo(null);
    setActualizarExistentes(false);
    setPrevia(null);
    setResultado(null);
    setError("");
    setProcesando(false);
    setDescargando(false);
  };

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  const descargarPlantilla = async () => {
    setDescargando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/importacion/plantilla/${tipo}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!respuesta.ok) throw new Error(await leerError(respuesta));
      descargarArchivo(`plantilla-${tipo}.xlsx`, await respuesta.blob());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descargar la plantilla.");
    } finally {
      setDescargando(false);
    }
  };

  const enviar = async (confirmar: boolean) => {
    if (!archivo) {
      setError("Seleccione el archivo de Excel o CSV.");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const token = await tokenCsrf();
      const datos = new FormData();
      datos.append("archivo", archivo);

      const accion = confirmar ? "confirmar" : "previsualizar";
      const respuesta = await fetch(
        `/api/importacion/${accion}/${tipo}?actualizarExistentes=${actualizarExistentes}`,
        {
          method: "POST",
          credentials: "include",
          body: datos,
          headers: { "X-CSRF-TOKEN": token },
        },
      );

      if (!respuesta.ok) throw new Error(await leerError(respuesta));

      if (confirmar) {
        const datosResultado = (await respuesta.json()) as Resultado;
        setResultado(datosResultado);
        await onImportado();
      } else {
        setPrevia((await respuesta.json()) as Previsualizacion);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el archivo.");
    } finally {
      setProcesando(false);
    }
  };

  const valorDe = (fila: FilaImportacion, prefijo: string) => {
    const clave = Object.keys(fila.datos).find((nombre) =>
      nombre.toLowerCase().startsWith(prefijo.toLowerCase()),
    );
    return clave ? fila.datos[clave] : "";
  };

  return (
    <Modal
      abierto={abierto}
      titulo={`Importar ${titulos[tipo]}`}
      descripcion="Descargue la plantilla, complétela y previsualice antes de confirmar."
      onCerrar={cerrar}
      tamano="xl"
      pie={
        resultado ? (
          <Boton onClick={cerrar}>Cerrar</Boton>
        ) : previa ? (
          <>
            <Boton variante="secundario" onClick={() => setPrevia(null)} disabled={procesando}>
              Volver
            </Boton>
            <Boton
              onClick={() => enviar(true)}
              cargando={procesando}
              disabled={previa.errores > 0}
            >
              Confirmar importación
            </Boton>
          </>
        ) : (
          <>
            <Boton variante="secundario" onClick={cerrar} disabled={procesando}>
              Cancelar
            </Boton>
            <Boton
              onClick={() => enviar(false)}
              cargando={procesando}
              disabled={!archivo}
              icono={<Upload className="h-4 w-4" />}
            >
              Previsualizar
            </Boton>
          </>
        )
      }
    >
      {error && (
        <div className="mb-4">
          <Aviso tono="error">{error}</Aviso>
        </div>
      )}

      {resultado ? (
        <div className="space-y-4">
          <Aviso tono="exito">{resultado.mensaje}</Aviso>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] uppercase text-slate-500">Creados</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatoNumero(resultado.creados)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] uppercase text-slate-500">Actualizados</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {formatoNumero(resultado.actualizados)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] uppercase text-slate-500">Omitidos</p>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
                {formatoNumero(resultado.omitidos)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-[11px] uppercase text-slate-500">Errores</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatoNumero(resultado.errores)}
              </p>
            </div>
          </div>
        </div>
      ) : previa ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Insignia tono="gris">{previa.totalFilas} fila(s)</Insignia>
            <Insignia tono="verde">{previa.validas} válida(s)</Insignia>
            <Insignia tono="amarillo">{previa.advertencias} con advertencia</Insignia>
            <Insignia tono="gris">{previa.omitidas} omitida(s)</Insignia>
            <Insignia tono="rojo">{previa.errores} con error</Insignia>
          </div>

          {previa.errores > 0 && (
            <Aviso tono="aviso">
              Hay filas con error. Corrija el archivo y vuelva a previsualizar; no se importará nada
              hasta que no queden errores.
            </Aviso>
          )}

          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {previa.filas.slice(0, 300).map((fila) => (
                  <tr key={fila.fila} className="align-top">
                    <td className="px-3 py-2 font-mono text-slate-500">{fila.fila}</td>
                    <td className="px-3 py-2">
                      <Insignia tono={tonos[fila.estado]}>{etiquetas[fila.estado]}</Insignia>
                    </td>
                    <td className="px-3 py-2 font-mono">{valorDe(fila, "Código")}</td>
                    <td className="px-3 py-2">
                      {valorDe(fila, "Nombre") || valorDe(fila, "Razón")}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {fila.mensajes.join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previa.filas.length > 300 && (
            <p className="text-[11px] text-slate-400">
              Se muestran las primeras 300 filas de {previa.totalFilas}.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ol className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <li>1. Descargue la plantilla y complétela sin cambiar los encabezados.</li>
            <li>2. Suba el archivo y revise la previsualización.</li>
            <li>3. Confirme para aplicar los cambios en una sola transacción.</li>
          </ol>

          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Plantilla de {titulos[tipo]}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Excel con encabezados, ejemplo e instrucciones.
                </p>
              </div>
              <Boton
                variante="secundario"
                onClick={descargarPlantilla}
                cargando={descargando}
                icono={<Download className="h-4 w-4" />}
              >
                Descargar plantilla
              </Boton>
            </div>
          </div>

          <div>
            <label
              htmlFor={`archivo-${tipo}`}
              className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Archivo (.xlsx o .csv, máximo 5 MB)
            </label>
            <input
              id={`archivo-${tipo}`}
              type="file"
              accept=".xlsx,.xlsm,.csv"
              onChange={(evento) => {
                setArchivo(evento.target.files?.[0] ?? null);
                setError("");
              }}
              className="block w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-800"
            />
            {archivo && (
              <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {archivo.name} · {(archivo.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={actualizarExistentes}
              onChange={(evento) => setActualizarExistentes(evento.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-700 focus:ring-emerald-600"
            />
            <span>
              Actualizar los registros que ya existen (si se desmarca, se omiten).
            </span>
          </label>
        </div>
      )}
    </Modal>
  );
}

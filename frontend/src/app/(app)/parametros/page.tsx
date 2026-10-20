"use client";

import { RotateCcw, Save, Settings } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { Cargando } from "@/components/ui/Cargando";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Parametro } from "@/lib/tipos";

const titulosGrupo: Record<string, string> = {
  Empresa: "Datos de la empresa",
  Impuestos: "Impuestos",
  Moneda: "Moneda",
  Inventario: "Inventario",
  Documentos: "Prefijos de documentos",
  Seguridad: "Seguridad",
};

const descripcionesGrupo: Record<string, string> = {
  Empresa: "Estos datos se muestran en los documentos imprimibles.",
  Impuestos: "Valor inicial aplicado a nuevas compras, ventas y notas. Puede ajustarse en cada documento.",
  Moneda: "Configuración de presentación de importes.",
  Inventario: "Reglas generales para el control de existencias.",
  Documentos: "Prefijo utilizado al generar la numeración de cada tipo de documento.",
  Seguridad: "Parámetros de duración de la sesión de usuario.",
};

const esNumero = (clave: string) =>
  ["Impuesto.Porcentaje", "Sesion.MinutosExpiracion", "Inventario.ExistenciaMinimaDefecto"].includes(
    clave,
  );

export default function PaginaParametros() {
  const { datos, cargando, error, recargar } = useApi<Parametro[]>("/api/parametros");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");

  useEffect(() => {
    if (!datos) return;
    setValores(
      Object.fromEntries(datos.map((parametro) => [parametro.clave, parametro.valor])),
    );
  }, [datos]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Parametro[]>();

    (datos ?? []).forEach((parametro) => {
      const lista = mapa.get(parametro.grupo) ?? [];
      lista.push(parametro);
      mapa.set(parametro.grupo, lista);
    });

    return Array.from(mapa.entries());
  }, [datos]);

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");
    setErrorFormulario("");

    try {
      await apiFetch<Parametro[]>("/api/parametros", {
        method: "PUT",
        body: JSON.stringify({
          parametros: Object.entries(valores).map(([clave, valor]) => ({ clave, valor })),
        }),
      });

      setMensaje("Parámetros actualizados correctamente.");
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const restablecer = () => {
    if (!datos) return;
    setValores(
      Object.fromEntries(datos.map((parametro) => [parametro.clave, parametro.valor])),
    );
    setMensaje("");
    setErrorFormulario("");
  };

  if (cargando) return <Cargando texto="Cargando parámetros…" />;

  if (error || !datos) {
    return <Aviso tono="error">{error || "No se pudieron cargar los parámetros."}</Aviso>;
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Parámetros del sistema"
        descripcion="Configure la empresa, impuestos, moneda, inventario y numeración de documentos."
        acciones={
          <>
            <Boton
              variante="secundario"
              onClick={restablecer}
              disabled={guardando}
              icono={<RotateCcw className="h-4 w-4" />}
            >
              Restablecer
            </Boton>
            <Boton
              type="submit"
              form="formulario-parametros"
              cargando={guardando}
              icono={<Save className="h-4 w-4" />}
            >
              Guardar cambios
            </Boton>
          </>
        }
      />

      {mensaje && (
        <div className="mb-4">
          <Aviso tono="exito">{mensaje}</Aviso>
        </div>
      )}

      {errorFormulario && (
        <div className="mb-4">
          <Aviso tono="error">{errorFormulario}</Aviso>
        </div>
      )}

      <Aviso tono="info">
        Los cambios aplican a los documentos y operaciones nuevos. Los documentos históricos
        conservan el impuesto y los datos con los que fueron registrados.
      </Aviso>

      <form id="formulario-parametros" onSubmit={guardar} className="mt-5 space-y-5">
        {grupos.map(([grupo, parametros]) => (
          <section
            key={grupo}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Settings className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {titulosGrupo[grupo] ?? grupo}
                </h2>
                <p className="text-xs text-slate-500">
                  {descripcionesGrupo[grupo] ?? "Configuración general del sistema."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {parametros.map((parametro) => (
                <Campo
                  key={parametro.clave}
                  etiqueta={parametro.descripcion ?? parametro.clave}
                  ayuda={parametro.clave}
                >
                  {parametro.clave === "Inventario.PermitirStockNegativo" ? (
                    <Seleccion
                      value={valores[parametro.clave] ?? "false"}
                      onChange={(evento) =>
                        setValores((actuales) => ({
                          ...actuales,
                          [parametro.clave]: evento.target.value,
                        }))
                      }
                    >
                      <option value="false">No permitir stock negativo</option>
                      <option value="true">Permitir stock negativo</option>
                    </Seleccion>
                  ) : esNumero(parametro.clave) ? (
                    <Entrada
                      type="number"
                      min={0}
                      max={parametro.clave === "Impuesto.Porcentaje" ? 100 : undefined}
                      step={parametro.clave === "Impuesto.Porcentaje" ? "0.01" : "1"}
                      value={valores[parametro.clave] ?? ""}
                      onChange={(evento) =>
                        setValores((actuales) => ({
                          ...actuales,
                          [parametro.clave]: evento.target.value,
                        }))
                      }
                      required
                    />
                  ) : (
                    <Entrada
                      value={valores[parametro.clave] ?? ""}
                      onChange={(evento) =>
                        setValores((actuales) => ({
                          ...actuales,
                          [parametro.clave]: evento.target.value,
                        }))
                      }
                      maxLength={500}
                      required
                    />
                  )}
                </Campo>
              ))}
            </div>
          </section>
        ))}
      </form>
    </div>
  );
}

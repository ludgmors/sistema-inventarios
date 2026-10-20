"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import type { AjusteRespuesta, Paginado, Producto } from "@/lib/tipos";

export function ModalAjuste({
  abierto,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: (resultado: AjusteRespuesta) => void;
}) {
  const { datos: productos } = useApi<Paginado<Producto>>(
    "/api/productos?tamanoPagina=200&soloActivos=true",
  );

  const [productoId, setProductoId] = useState(0);
  const [tipo, setTipo] = useState<"Entrada" | "Salida">("Entrada");
  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const productosPorId = useMemo(() => {
    const mapa = new Map<number, Producto>();
    (productos?.items ?? []).forEach((producto) => mapa.set(producto.id, producto));
    return mapa;
  }, [productos]);

  const producto = productosPorId.get(productoId);

  useEffect(() => {
    if (!abierto) return;

    setProductoId(0);
    setTipo("Entrada");
    setCantidad(1);
    setCostoUnitario(0);
    setObservacion("");
    setError("");
  }, [abierto]);

  const seleccionarProducto = (id: number) => {
    setProductoId(id);
    setCostoUnitario(productosPorId.get(id)?.precioCosto ?? 0);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");

    if (productoId <= 0) {
      setError("Debe seleccionar un producto.");
      return;
    }

    if (cantidad <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      return;
    }

    setGuardando(true);

    try {
      const resultado = await apiFetch<AjusteRespuesta>("/api/movimientos/ajuste", {
        method: "POST",
        body: JSON.stringify({
          productoId,
          tipo,
          cantidad,
          costoUnitario,
          observacion,
        }),
      });

      onGuardado(resultado);
      onCerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const salidaExcedeStock = Boolean(
    producto && tipo === "Salida" && cantidad > producto.existenciaActual,
  );

  return (
    <Modal
      abierto={abierto}
      titulo="Ajuste manual de inventario"
      descripcion="Registre una entrada o salida que no proviene de una compra o venta."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            form="formulario-ajuste"
            cargando={guardando}
            icono={<Save className="h-4 w-4" />}
          >
            Registrar ajuste
          </Boton>
        </>
      }
    >
      <form id="formulario-ajuste" onSubmit={guardar} className="space-y-4">
        {error && <Aviso tono="error">{error}</Aviso>}

        <Campo etiqueta="Producto" requerido>
          <Seleccion
            value={productoId}
            onChange={(evento) => seleccionarProducto(Number(evento.target.value))}
            required
          >
            <option value={0}>Seleccione un producto…</option>
            {(productos?.items ?? []).map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.codigo} · {opcion.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>

        {producto && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Existencia actual:{" "}
            <span className="font-semibold text-slate-700">
              {formatoNumero(producto.existenciaActual)} {producto.unidadMedida}
            </span>
            {" · "}Costo: {formatoMoneda(producto.precioCosto)}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Tipo de movimiento" requerido>
            <Seleccion
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as "Entrada" | "Salida")}
            >
              <option value="Entrada">Entrada (aumenta inventario)</option>
              <option value="Salida">Salida (reduce inventario)</option>
            </Seleccion>
          </Campo>

          <Campo etiqueta="Cantidad" requerido>
            <Entrada
              type="number"
              min={0.0001}
              step="0.0001"
              value={cantidad}
              onChange={(evento) => setCantidad(Number(evento.target.value))}
              required
            />
          </Campo>
        </div>

        <Campo etiqueta="Costo unitario" ayuda="Se usa para valorizar la entrada o salida.">
          <Entrada
            type="number"
            min={0}
            step="0.01"
            value={costoUnitario}
            onChange={(evento) => setCostoUnitario(Number(evento.target.value))}
          />
        </Campo>

        <Campo etiqueta="Observación">
          <AreaTexto
            value={observacion}
            onChange={(evento) => setObservacion(evento.target.value)}
            placeholder="Motivo del ajuste (conteo físico, merma, corrección…)"
            maxLength={500}
          />
        </Campo>

        {salidaExcedeStock && (
          <Aviso tono="aviso">
            La cantidad de salida supera la existencia actual. Si el sistema no permite stock
            negativo, la operación será rechazada.
          </Aviso>
        )}
      </form>
    </Modal>
  );
}

"use client";

import { TriangleAlert } from "lucide-react";
import { Boton } from "./Boton";
import { Modal } from "./Modal";

export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = true,
  cargando = false,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCerrar}
      tamano="sm"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            {textoCancelar}
          </Boton>
          <Boton
            variante={peligro ? "peligro" : "primario"}
            onClick={onConfirmar}
            cargando={cargando}
          >
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <TriangleAlert className="h-5 w-5" />
        </div>
        <p className="pt-1 text-sm text-slate-600">{mensaje}</p>
      </div>
    </Modal>
  );
}

"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campos";
import { Cargando } from "@/components/ui/Cargando";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Categoria } from "@/lib/tipos";

interface FormularioCategoria {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

const inicial: FormularioCategoria = { nombre: "", descripcion: "", activo: true };

export default function PaginaCategorias() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol("Administrador", "Inventario");
  const esAdmin = tieneRol("Administrador");

  const { datos, cargando, error, recargar } = useApi<Categoria[]>("/api/categorias");
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formulario, setFormulario] = useState<FormularioCategoria>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [porEliminar, setPorEliminar] = useState<Categoria | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(inicial);
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const abrirEditar = (categoria: Categoria) => {
    setEditando(categoria);
    setFormulario({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? "",
      activo: categoria.activo,
    });
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setErrorFormulario("");

    try {
      await apiFetch(editando ? `/api/categorias/${editando.id}` : "/api/categorias", {
        method: editando ? "PUT" : "POST",
        body: JSON.stringify(formulario),
      });

      setModalAbierto(false);
      setMensaje(editando ? "Categoría actualizada." : "Categoría creada.");
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);

    try {
      await apiFetch(`/api/categorias/${porEliminar.id}`, { method: "DELETE" });
      setMensaje("Categoría eliminada.");
      setPorEliminar(null);
      await recargar();
    } catch (e) {
      setMensaje("");
      setErrorFormulario(mensajeDeError(e));
      setPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const filtradas = (datos ?? []).filter((categoria) =>
    categoria.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  const columnas: Columna<Categoria>[] = [
    {
      clave: "nombre",
      titulo: "Categoría",
      render: (categoria) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{categoria.nombre}</p>
          <p className="text-[11px] text-slate-400">{categoria.descripcion || "Sin descripción"}</p>
        </div>
      ),
    },
    {
      clave: "productos",
      titulo: "Productos",
      alineacion: "derecha",
      render: (categoria) => (
        <span className="text-xs font-medium text-slate-600">{categoria.cantidadProductos}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (categoria) => (
        <Insignia tono={categoria.activo ? "verde" : "gris"}>
          {categoria.activo ? "Activa" : "Inactiva"}
        </Insignia>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (categoria) => (
        <div className="flex justify-end gap-1">
          {puedeEditar && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => abrirEditar(categoria)}
              icono={<Pencil className="h-3.5 w-3.5" />}
            >
              Editar
            </Boton>
          )}
          {esAdmin && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setPorEliminar(categoria)}
              icono={<Trash2 className="h-3.5 w-3.5" />}
              className="text-red-600 hover:bg-red-50"
              aria-label="Eliminar categoría"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Categorías"
        descripcion="Organice los productos del inventario por categorías."
        acciones={
          puedeEditar ? (
            <Boton onClick={abrirNuevo} icono={<Plus className="h-4 w-4" />}>
              Nueva categoría
            </Boton>
          ) : undefined
        }
      />

      {mensaje && <div className="mb-4"><Aviso tono="exito">{mensaje}</Aviso></div>}
      {error && <div className="mb-4"><Aviso tono="error">{error}</Aviso></div>}

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar categoría…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
      </div>

      {cargando ? (
        <Cargando />
      ) : (
        <Tabla
          columnas={columnas}
          datos={filtradas}
          filaClave={(categoria) => categoria.id}
          vacio="No hay categorías registradas."
        />
      )}

      <Modal
        abierto={modalAbierto}
        titulo={editando ? "Editar categoría" : "Nueva categoría"}
        onCerrar={() => setModalAbierto(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="formulario-categoria" cargando={guardando}>
              {editando ? "Guardar cambios" : "Crear categoría"}
            </Boton>
          </>
        }
      >
        <form id="formulario-categoria" onSubmit={guardar} className="space-y-4">
          {errorFormulario && <Aviso tono="error">{errorFormulario}</Aviso>}

          <Campo etiqueta="Nombre" requerido>
            <Entrada
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              placeholder="Bebidas"
              required
              maxLength={100}
            />
          </Campo>

          <Campo etiqueta="Descripción">
            <Entrada
              value={formulario.descripcion}
              onChange={(evento) => setFormulario({ ...formulario, descripcion: evento.target.value })}
              placeholder="Descripción opcional"
              maxLength={300}
            />
          </Campo>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formulario.activo}
              onChange={(evento) => setFormulario({ ...formulario, activo: evento.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            Categoría activa
          </label>
        </form>
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar categoría"
        mensaje={`¿Confirma que desea eliminar la categoría "${porEliminar?.nombre}"? Solo es posible si no tiene productos asociados.`}
        cargando={eliminando}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setPorEliminar(null)}
      />
    </div>
  );
}

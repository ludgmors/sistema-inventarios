"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, construirQuery, mensajeDeError } from "@/lib/api";
import { formatoFecha } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useDebounce } from "@/lib/useDebounce";
import type { Cliente, Paginado } from "@/lib/tipos";

interface FormularioCliente {
  codigo: string;
  nombre: string;
  documento: string;
  telefono: string;
  correo: string;
  direccion: string;
  activo: boolean;
}

const inicial: FormularioCliente = {
  codigo: "",
  nombre: "",
  documento: "",
  telefono: "",
  correo: "",
  direccion: "",
  activo: true,
};

export default function PaginaClientes() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol("Administrador", "Ventas");
  const esAdmin = tieneRol("Administrador");

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error, recargar } = useApi<Paginado<Cliente>>(
    `/api/clientes${construirQuery({ pagina, tamanoPagina: 10, buscar: busquedaAplicada })}`,
  );

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [formulario, setFormulario] = useState<FormularioCliente>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [porEliminar, setPorEliminar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(inicial);
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setEditando(cliente);
    setFormulario({
      codigo: cliente.codigo,
      nombre: cliente.nombre,
      documento: cliente.documento ?? "",
      telefono: cliente.telefono ?? "",
      correo: cliente.correo ?? "",
      direccion: cliente.direccion ?? "",
      activo: cliente.activo,
    });
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setErrorFormulario("");

    try {
      await apiFetch(editando ? `/api/clientes/${editando.id}` : "/api/clientes", {
        method: editando ? "PUT" : "POST",
        body: JSON.stringify(formulario),
      });

      setModalAbierto(false);
      setMensaje(editando ? "Cliente actualizado." : "Cliente creado.");
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
      await apiFetch(`/api/clientes/${porEliminar.id}`, { method: "DELETE" });
      setMensaje("Cliente eliminado.");
      setPorEliminar(null);
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
      setPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const columnas: Columna<Cliente>[] = [
    {
      clave: "codigo",
      titulo: "Código",
      render: (cliente) => (
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{cliente.codigo}</span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente",
      render: (cliente) => (
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cliente.nombre}</p>
          <p className="text-[11px] text-slate-400">{cliente.documento || "Sin documento"}</p>
        </div>
      ),
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      render: (cliente) => (
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{cliente.telefono || "—"}</p>
          <p className="text-[11px] text-slate-400">{cliente.correo || ""}</p>
        </div>
      ),
    },
    {
      clave: "fecha",
      titulo: "Registro",
      render: (cliente) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoFecha(cliente.fechaCreacion)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (cliente) => (
        <Insignia tono={cliente.activo ? "verde" : "gris"}>
          {cliente.activo ? "Activo" : "Inactivo"}
        </Insignia>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (cliente) => (
        <div className="flex justify-end gap-1">
          {puedeEditar && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => abrirEditar(cliente)}
              icono={<Pencil className="h-3.5 w-3.5" />}
            >
              Editar
            </Boton>
          )}
          {esAdmin && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setPorEliminar(cliente)}
              icono={<Trash2 className="h-3.5 w-3.5" />}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Consulte y actualice los datos de los clientes registrados."
        acciones={
          puedeEditar ? (
            <Boton onClick={abrirNuevo} icono={<Plus className="h-4 w-4" />}>
              Nuevo cliente
            </Boton>
          ) : undefined
        }
      />

      {mensaje && <div className="mb-4"><Aviso tono="exito">{mensaje}</Aviso></div>}
      {error && <div className="mb-4"><Aviso tono="error">{error}</Aviso></div>}
      {errorFormulario && !modalAbierto && (
        <div className="mb-4"><Aviso tono="error">{errorFormulario}</Aviso></div>
      )}

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por código, nombre o documento…"
          className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(cliente) => cliente.id}
        vacio="No hay clientes registrados."
        pie={
          datos && (
            <Paginacion
              pagina={datos.pagina}
              totalPaginas={datos.totalPaginas}
              total={datos.total}
              tamanoPagina={datos.tamanoPagina}
              onCambiar={setPagina}
            />
          )
        }
      />

      <Modal
        abierto={modalAbierto}
        titulo={editando ? "Editar cliente" : "Nuevo cliente"}
        onCerrar={() => setModalAbierto(false)}
        tamano="lg"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="formulario-cliente" cargando={guardando}>
              {editando ? "Guardar cambios" : "Crear cliente"}
            </Boton>
          </>
        }
      >
        <form id="formulario-cliente" onSubmit={guardar} className="space-y-4">
          {errorFormulario && <Aviso tono="error">{errorFormulario}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Código" requerido>
              <Entrada
                value={formulario.codigo}
                onChange={(evento) => setFormulario({ ...formulario, codigo: evento.target.value })}
                placeholder="CLI-001"
                required
                maxLength={30}
              />
            </Campo>

            <Campo etiqueta="Documento">
              <Entrada
                value={formulario.documento}
                onChange={(evento) => setFormulario({ ...formulario, documento: evento.target.value })}
                placeholder="1234567-8"
                maxLength={50}
              />
            </Campo>
          </div>

          <Campo etiqueta="Nombre o razón social" requerido>
            <Entrada
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              placeholder="Nombre del cliente"
              required
              maxLength={200}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Teléfono">
              <Entrada
                value={formulario.telefono}
                onChange={(evento) => setFormulario({ ...formulario, telefono: evento.target.value })}
                placeholder="+502 6000-0000"
                maxLength={30}
              />
            </Campo>

            <Campo etiqueta="Correo electrónico">
              <Entrada
                type="email"
                value={formulario.correo}
                onChange={(evento) => setFormulario({ ...formulario, correo: evento.target.value })}
                placeholder="cliente@correo.com"
                maxLength={150}
              />
            </Campo>
          </div>

          <Campo etiqueta="Dirección">
            <Entrada
              value={formulario.direccion}
              onChange={(evento) => setFormulario({ ...formulario, direccion: evento.target.value })}
              placeholder="Dirección"
              maxLength={300}
            />
          </Campo>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formulario.activo}
              onChange={(evento) => setFormulario({ ...formulario, activo: evento.target.checked })}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-600"
            />
            Cliente activo
          </label>
        </form>
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar cliente"
        mensaje={`¿Confirma que desea eliminar a "${porEliminar?.nombre}"? Solo es posible si no tiene ventas registradas.`}
        cargando={eliminando}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setPorEliminar(null)}
      />
    </div>
  );
}

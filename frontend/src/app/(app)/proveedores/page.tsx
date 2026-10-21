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
import type { Paginado, Proveedor } from "@/lib/tipos";

interface FormularioProveedor {
  codigo: string;
  razonSocial: string;
  documento: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  activo: boolean;
}

const inicial: FormularioProveedor = {
  codigo: "",
  razonSocial: "",
  documento: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
  activo: true,
};

export default function PaginaProveedores() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol("Administrador", "Inventario");
  const esAdmin = tieneRol("Administrador");

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error, recargar } = useApi<Paginado<Proveedor>>(
    `/api/proveedores${construirQuery({ pagina, tamanoPagina: 10, buscar: busquedaAplicada })}`,
  );

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [formulario, setFormulario] = useState<FormularioProveedor>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [porEliminar, setPorEliminar] = useState<Proveedor | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(inicial);
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const abrirEditar = (proveedor: Proveedor) => {
    setEditando(proveedor);
    setFormulario({
      codigo: proveedor.codigo,
      razonSocial: proveedor.razonSocial,
      documento: proveedor.documento ?? "",
      contacto: proveedor.contacto ?? "",
      telefono: proveedor.telefono ?? "",
      correo: proveedor.correo ?? "",
      direccion: proveedor.direccion ?? "",
      activo: proveedor.activo,
    });
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setErrorFormulario("");

    try {
      await apiFetch(editando ? `/api/proveedores/${editando.id}` : "/api/proveedores", {
        method: editando ? "PUT" : "POST",
        body: JSON.stringify(formulario),
      });

      setModalAbierto(false);
      setMensaje(editando ? "Proveedor actualizado." : "Proveedor creado.");
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
      await apiFetch(`/api/proveedores/${porEliminar.id}`, { method: "DELETE" });
      setMensaje("Proveedor eliminado.");
      setPorEliminar(null);
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
      setPorEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const columnas: Columna<Proveedor>[] = [
    {
      clave: "codigo",
      titulo: "Código",
      render: (proveedor) => (
        <span className="font-mono text-xs font-semibold text-slate-600">{proveedor.codigo}</span>
      ),
    },
    {
      clave: "proveedor",
      titulo: "Proveedor",
      render: (proveedor) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{proveedor.razonSocial}</p>
          <p className="text-[11px] text-slate-400">{proveedor.documento || "Sin documento"}</p>
        </div>
      ),
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      render: (proveedor) => (
        <div>
          <p className="text-xs text-slate-600">{proveedor.contacto || "—"}</p>
          <p className="text-[11px] text-slate-400">{proveedor.telefono || proveedor.correo || ""}</p>
        </div>
      ),
    },
    {
      clave: "fecha",
      titulo: "Registro",
      render: (proveedor) => (
        <span className="text-xs text-slate-500">{formatoFecha(proveedor.fechaCreacion)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (proveedor) => (
        <Insignia tono={proveedor.activo ? "verde" : "gris"}>
          {proveedor.activo ? "Activo" : "Inactivo"}
        </Insignia>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (proveedor) => (
        <div className="flex justify-end gap-1">
          {puedeEditar && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => abrirEditar(proveedor)}
              icono={<Pencil className="h-3.5 w-3.5" />}
            >
              Editar
            </Boton>
          )}
          {esAdmin && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setPorEliminar(proveedor)}
              icono={<Trash2 className="h-3.5 w-3.5" />}
              className="text-red-600 hover:bg-red-50"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Proveedores"
        descripcion="Registre y mantenga actualizada la información de sus proveedores."
        acciones={
          puedeEditar ? (
            <Boton onClick={abrirNuevo} icono={<Plus className="h-4 w-4" />}>
              Nuevo proveedor
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
          placeholder="Buscar por código, razón social o documento…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(proveedor) => proveedor.id}
        vacio="No hay proveedores registrados."
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
        titulo={editando ? "Editar proveedor" : "Nuevo proveedor"}
        onCerrar={() => setModalAbierto(false)}
        tamano="lg"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="formulario-proveedor" cargando={guardando}>
              {editando ? "Guardar cambios" : "Crear proveedor"}
            </Boton>
          </>
        }
      >
        <form id="formulario-proveedor" onSubmit={guardar} className="space-y-4">
          {errorFormulario && <Aviso tono="error">{errorFormulario}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Código" requerido>
              <Entrada
                value={formulario.codigo}
                onChange={(evento) => setFormulario({ ...formulario, codigo: evento.target.value })}
                placeholder="PRV-001"
                required
                maxLength={30}
              />
            </Campo>

            <Campo etiqueta="Documento / NIT">
              <Entrada
                value={formulario.documento}
                onChange={(evento) => setFormulario({ ...formulario, documento: evento.target.value })}
                placeholder="1234567-8"
                maxLength={50}
              />
            </Campo>
          </div>

          <Campo etiqueta="Razón social" requerido>
            <Entrada
              value={formulario.razonSocial}
              onChange={(evento) => setFormulario({ ...formulario, razonSocial: evento.target.value })}
              placeholder="Nombre o razón social"
              required
              maxLength={200}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Persona de contacto">
              <Entrada
                value={formulario.contacto}
                onChange={(evento) => setFormulario({ ...formulario, contacto: evento.target.value })}
                placeholder="Nombre del contacto"
                maxLength={150}
              />
            </Campo>

            <Campo etiqueta="Teléfono">
              <Entrada
                value={formulario.telefono}
                onChange={(evento) => setFormulario({ ...formulario, telefono: evento.target.value })}
                placeholder="+502 6000-0000"
                maxLength={30}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Correo electrónico">
              <Entrada
                type="email"
                value={formulario.correo}
                onChange={(evento) => setFormulario({ ...formulario, correo: evento.target.value })}
                placeholder="proveedor@correo.com"
                maxLength={150}
              />
            </Campo>

            <Campo etiqueta="Dirección">
              <Entrada
                value={formulario.direccion}
                onChange={(evento) => setFormulario({ ...formulario, direccion: evento.target.value })}
                placeholder="Dirección"
                maxLength={300}
              />
            </Campo>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={formulario.activo}
              onChange={(evento) => setFormulario({ ...formulario, activo: evento.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            Proveedor activo
          </label>
        </form>
      </Modal>

      <ModalConfirmacion
        abierto={Boolean(porEliminar)}
        titulo="Eliminar proveedor"
        mensaje={`¿Confirma que desea eliminar a "${porEliminar?.razonSocial}"? Solo es posible si no tiene compras registradas.`}
        cargando={eliminando}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setPorEliminar(null)}
      />
    </div>
  );
}

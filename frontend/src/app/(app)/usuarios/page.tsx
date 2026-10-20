"use client";

import { KeyRound, Pencil, Plus, Search, UserCog } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { Cargando } from "@/components/ui/Cargando";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, construirQuery, mensajeDeError } from "@/lib/api";
import { formatoFecha } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useDebounce } from "@/lib/useDebounce";
import type { RolDto, UsuarioAdmin } from "@/lib/tipos";

interface FormularioUsuario {
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  contrasena: string;
  rolId: number;
  activo: boolean;
}

const formularioInicial: FormularioUsuario = {
  nombreCompleto: "",
  nombreUsuario: "",
  correo: "",
  contrasena: "",
  rolId: 0,
  activo: true,
};

const tonoRol = (rol: string) => {
  if (rol === "Administrador") return "morado" as const;
  if (rol === "Inventario") return "azul" as const;
  if (rol === "Ventas") return "verde" as const;
  return "gris" as const;
};

export default function PaginaUsuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);

  const { datos, cargando, error, recargar } = useApi<UsuarioAdmin[]>(
    `/api/usuarios${construirQuery({ buscar: busquedaAplicada })}`,
  );
  const { datos: roles } = useApi<RolDto[]>("/api/usuarios/roles");

  const [modalUsuario, setModalUsuario] = useState(false);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [usuarioClave, setUsuarioClave] = useState<UsuarioAdmin | null>(null);
  const [claveNueva, setClaveNueva] = useState("");
  const [claveConfirmacion, setClaveConfirmacion] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [errorClave, setErrorClave] = useState("");

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({
      ...formularioInicial,
      rolId: roles?.[0]?.id ?? 0,
    });
    setErrorFormulario("");
    setModalUsuario(true);
  };

  const abrirEditar = (usuario: UsuarioAdmin) => {
    setEditando(usuario);
    setFormulario({
      nombreCompleto: usuario.nombreCompleto,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
      contrasena: "",
      rolId: usuario.rolId,
      activo: usuario.activo,
    });
    setErrorFormulario("");
    setModalUsuario(true);
  };

  const abrirClave = (usuario: UsuarioAdmin) => {
    setUsuarioClave(usuario);
    setClaveNueva("");
    setClaveConfirmacion("");
    setErrorClave("");
  };

  const guardarUsuario = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setErrorFormulario("");
    setMensaje("");

    try {
      if (editando) {
        await apiFetch(`/api/usuarios/${editando.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nombreCompleto: formulario.nombreCompleto,
            correo: formulario.correo,
            rolId: formulario.rolId,
            activo: formulario.activo,
          }),
        });
        setMensaje("Usuario actualizado correctamente.");
      } else {
        await apiFetch("/api/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nombreCompleto: formulario.nombreCompleto,
            nombreUsuario: formulario.nombreUsuario,
            correo: formulario.correo,
            contrasena: formulario.contrasena,
            rolId: formulario.rolId,
          }),
        });
        setMensaje("Usuario creado correctamente.");
      }

      setModalUsuario(false);
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const restablecerClave = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!usuarioClave) return;

    if (claveNueva !== claveConfirmacion) {
      setErrorClave("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setGuardandoClave(true);
    setErrorClave("");

    try {
      await apiFetch(`/api/usuarios/${usuarioClave.id}/contrasena`, {
        method: "PUT",
        body: JSON.stringify({ contrasenaNueva: claveNueva }),
      });
      setUsuarioClave(null);
      setMensaje(`Contraseña de ${usuarioClave.nombreCompleto} restablecida correctamente.`);
    } catch (e) {
      setErrorClave(mensajeDeError(e));
    } finally {
      setGuardandoClave(false);
    }
  };

  const columnas: Columna<UsuarioAdmin>[] = [
    {
      clave: "usuario",
      titulo: "Usuario",
      render: (usuario) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {usuario.nombreCompleto
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte[0])
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{usuario.nombreCompleto}</p>
            <p className="font-mono text-[11px] text-slate-400">@{usuario.nombreUsuario}</p>
          </div>
        </div>
      ),
    },
    {
      clave: "correo",
      titulo: "Correo",
      render: (usuario) => <span className="text-xs text-slate-500">{usuario.correo}</span>,
    },
    {
      clave: "rol",
      titulo: "Rol",
      alineacion: "centro",
      render: (usuario) => <Insignia tono={tonoRol(usuario.rol)}>{usuario.rol}</Insignia>,
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (usuario) => (
        <Insignia tono={usuario.activo ? "verde" : "gris"}>
          {usuario.activo ? "Activo" : "Inactivo"}
        </Insignia>
      ),
    },
    {
      clave: "acceso",
      titulo: "Último acceso",
      render: (usuario) => (
        <span className="text-xs text-slate-500">
          {usuario.ultimoAcceso ? formatoFecha(usuario.ultimoAcceso, true) : "Nunca"}
        </span>
      ),
    },
    {
      clave: "creacion",
      titulo: "Creado",
      render: (usuario) => (
        <span className="text-xs text-slate-400">{formatoFecha(usuario.fechaCreacion)}</span>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (usuario) => (
        <div className="flex justify-end gap-1">
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => abrirEditar(usuario)}
            icono={<Pencil className="h-3.5 w-3.5" />}
          >
            Editar
          </Boton>
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => abrirClave(usuario)}
            icono={<KeyRound className="h-3.5 w-3.5" />}
          >
            Clave
          </Boton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Usuarios y roles"
        descripcion="Administre el acceso al sistema y los permisos por rol."
        acciones={
          <Boton onClick={abrirNuevo} icono={<Plus className="h-4 w-4" />}>
            Nuevo usuario
          </Boton>
        }
      />

      {mensaje && (
        <div className="mb-4">
          <Aviso tono="exito">{mensaje}</Aviso>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Aviso tono="error">{error}</Aviso>
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre, usuario o correo…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 text-xs text-slate-500">
          <UserCog className="h-4 w-4 text-slate-400" />
          {datos?.length ?? 0} usuario(s) · 4 roles disponibles
        </div>
      </div>

      {cargando ? (
        <Cargando texto="Cargando usuarios…" />
      ) : (
        <Tabla
          columnas={columnas}
          datos={datos ?? []}
          filaClave={(usuario) => usuario.id}
          vacio="No se encontraron usuarios."
        />
      )}

      <Modal
        abierto={modalUsuario}
        titulo={editando ? "Editar usuario" : "Nuevo usuario"}
        descripcion={
          editando
            ? "Actualice los datos, el rol o el estado del usuario."
            : "Cree una cuenta de acceso con el rol correspondiente."
        }
        onCerrar={() => setModalUsuario(false)}
        pie={
          <>
            <Boton
              variante="secundario"
              onClick={() => setModalUsuario(false)}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              form="formulario-usuario"
              cargando={guardando}
            >
              {editando ? "Guardar cambios" : "Crear usuario"}
            </Boton>
          </>
        }
      >
        <form id="formulario-usuario" onSubmit={guardarUsuario} className="space-y-4">
          {errorFormulario && <Aviso tono="error">{errorFormulario}</Aviso>}

          {editando?.id === usuarioActual?.id && (
            <Aviso tono="info">
              Está editando su propia cuenta. No es posible desactivarla.
            </Aviso>
          )}

          <Campo etiqueta="Nombre completo" requerido>
            <Entrada
              value={formulario.nombreCompleto}
              onChange={(evento) =>
                setFormulario({ ...formulario, nombreCompleto: evento.target.value })
              }
              maxLength={150}
              required
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre de usuario" requerido>
              <Entrada
                value={formulario.nombreUsuario}
                onChange={(evento) =>
                  setFormulario({ ...formulario, nombreUsuario: evento.target.value })
                }
                maxLength={50}
                pattern="[a-zA-Z0-9._-]+"
                title="Solo letras, números, puntos, guiones y guiones bajos."
                disabled={Boolean(editando)}
                required
              />
            </Campo>

            <Campo etiqueta="Rol" requerido>
              <Seleccion
                value={formulario.rolId}
                onChange={(evento) =>
                  setFormulario({ ...formulario, rolId: Number(evento.target.value) })
                }
                required
              >
                <option value={0}>Seleccione un rol…</option>
                {(roles ?? []).map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>

          <Campo etiqueta="Correo electrónico" requerido>
            <Entrada
              type="email"
              value={formulario.correo}
              onChange={(evento) =>
                setFormulario({ ...formulario, correo: evento.target.value })
              }
              maxLength={150}
              required
            />
          </Campo>

          {!editando && (
            <Campo
              etiqueta="Contraseña inicial"
              requerido
              ayuda="Mínimo 8 caracteres. El usuario podrá cambiarla desde su perfil."
            >
              <Entrada
                type="password"
                value={formulario.contrasena}
                onChange={(evento) =>
                  setFormulario({ ...formulario, contrasena: evento.target.value })
                }
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Campo>
          )}

          {editando && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={formulario.activo}
                onChange={(evento) =>
                  setFormulario({ ...formulario, activo: evento.target.checked })
                }
                disabled={editando.id === usuarioActual?.id}
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              Usuario activo
            </label>
          )}
        </form>
      </Modal>

      <Modal
        abierto={Boolean(usuarioClave)}
        titulo="Restablecer contraseña"
        descripcion={
          usuarioClave
            ? `Asigne una contraseña nueva para ${usuarioClave.nombreCompleto}.`
            : undefined
        }
        onCerrar={() => setUsuarioClave(null)}
        tamano="sm"
        pie={
          <>
            <Boton
              variante="secundario"
              onClick={() => setUsuarioClave(null)}
              disabled={guardandoClave}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              form="formulario-clave"
              cargando={guardandoClave}
            >
              Restablecer
            </Boton>
          </>
        }
      >
        <form id="formulario-clave" onSubmit={restablecerClave} className="space-y-4">
          {errorClave && <Aviso tono="error">{errorClave}</Aviso>}

          <Campo etiqueta="Contraseña nueva" requerido>
            <Entrada
              type="password"
              value={claveNueva}
              onChange={(evento) => setClaveNueva(evento.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Campo>

          <Campo etiqueta="Confirmar contraseña" requerido>
            <Entrada
              type="password"
              value={claveConfirmacion}
              onChange={(evento) => setClaveConfirmacion(evento.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Campo>
        </form>
      </Modal>
    </div>
  );
}

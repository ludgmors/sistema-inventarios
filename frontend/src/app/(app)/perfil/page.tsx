"use client";

import { KeyRound, ShieldCheck, UserCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, mensajeDeError } from "@/lib/api";

const permisosPorRol: Record<string, string[]> = {
  Administrador: [
    "Acceso completo al sistema",
    "Anulación de compras, ventas y notas",
    "Configuración de parámetros y usuarios",
    "Consulta de todos los reportes",
  ],
  Inventario: [
    "Catálogo de productos, categorías y proveedores",
    "Registro de compras",
    "Ajustes manuales de inventario",
    "Consulta de existencias y reportes",
  ],
  Ventas: [
    "Catálogo de clientes",
    "Registro de ventas",
    "Notas de crédito y débito",
    "Consulta de ventas y reportes",
  ],
  Consulta: [
    "Acceso de solo lectura",
    "Consulta de productos, movimientos y existencias",
    "Consulta de reportes",
  ],
};

export default function PaginaPerfil() {
  const { usuario } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const iniciales = (usuario?.nombreCompleto ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  const cambiarClave = async (evento: FormEvent) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (nueva !== confirmacion) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setGuardando(true);

    try {
      await apiFetch("/api/auth/cambiar-contrasena", {
        method: "POST",
        body: JSON.stringify({
          contrasenaActual: actual,
          contrasenaNueva: nueva,
        }),
      });

      setMensaje("Contraseña actualizada correctamente.");
      setActual("");
      setNueva("");
      setConfirmacion("");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <EncabezadoPagina
        titulo="Mi perfil"
        descripcion="Consulte sus datos de acceso y actualice su contraseña."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-xl font-bold text-white shadow-lg shadow-emerald-900/20">
                {iniciales || <UserCircle2 className="h-8 w-8" />}
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{usuario?.nombreCompleto}</h2>
                <p className="font-mono text-xs text-slate-400">@{usuario?.nombreUsuario}</p>
                <div className="mt-1.5">
                  <Insignia tono="verde">{usuario?.rol}</Insignia>
                </div>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-xs font-medium text-slate-500">Correo electrónico</dt>
                <dd className="text-sm text-slate-800">{usuario?.correo}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-xs font-medium text-slate-500">Nombre de usuario</dt>
                <dd className="font-mono text-xs text-slate-800">{usuario?.nombreUsuario}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-xs font-medium text-slate-500">Rol asignado</dt>
                <dd className="text-sm text-slate-800">{usuario?.rol}</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              Los datos personales y el rol son administrados desde el módulo de usuarios.
              Si necesita modificarlos, contacte al administrador.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-semibold text-slate-900">Permisos de su rol</h2>
            </div>
            <ul className="mt-3 space-y-1.5">
              {(permisosPorRol[usuario?.rol ?? ""] ?? ["Acceso según asignación del administrador."]).map(
                (permiso) => (
                  <li key={permiso} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {permiso}
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Cambiar contraseña</h2>
              <p className="text-xs text-slate-500">
                Use al menos 8 caracteres y evite contraseñas compartidas.
              </p>
            </div>
          </div>

          <form onSubmit={cambiarClave} className="mt-5 space-y-4">
            {mensaje && <Aviso tono="exito">{mensaje}</Aviso>}
            {error && <Aviso tono="error">{error}</Aviso>}

            <Campo etiqueta="Contraseña actual" requerido>
              <Entrada
                type="password"
                value={actual}
                onChange={(evento) => setActual(evento.target.value)}
                autoComplete="current-password"
                required
              />
            </Campo>

            <Campo etiqueta="Contraseña nueva" requerido ayuda="Mínimo 8 caracteres.">
              <Entrada
                type="password"
                value={nueva}
                onChange={(evento) => setNueva(evento.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Campo>

            <Campo etiqueta="Confirmar contraseña nueva" requerido>
              <Entrada
                type="password"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Campo>

            <Boton type="submit" cargando={guardando} className="w-full">
              Actualizar contraseña
            </Boton>
          </form>
        </section>
      </div>
    </div>
  );
}

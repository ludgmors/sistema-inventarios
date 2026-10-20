"use client";

import {
  Boxes,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { apiFetch, mensajeDeError } from "@/lib/api";

const cuentasDemo = [
  { usuario: "admin", clave: "Admin123!", rol: "Administrador" },
  { usuario: "vendedor", clave: "Ventas123!", rol: "Ventas" },
  { usuario: "bodega", clave: "Inventario123!", rol: "Inventario" },
  { usuario: "consulta", clave: "Consulta123!", rol: "Consulta" },
];

export default function PaginaLogin() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const iniciarSesion = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ nombreUsuario, contrasena }),
      });

      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/40">
              <Boxes className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Sistema de Inventarios</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                Control · Trazabilidad · Resultados
              </p>
            </div>
          </div>

          <h1 className="mt-16 max-w-xl text-4xl font-bold leading-tight text-white">
            Todo su inventario, compras y ventas en un solo lugar.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
            Gestione proveedores, productos, existencias y movimientos con
            información confiable para tomar mejores decisiones.
          </p>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              { icono: PackageCheck, titulo: "Existencias", texto: "Stock valorizado" },
              { icono: TrendingUp, titulo: "Ventas", texto: "Control diario" },
              { icono: ShieldCheck, titulo: "Seguridad", texto: "Acceso por roles" },
            ].map((item) => {
              const Icono = item.icono;
              return (
                <div
                  key={item.titulo}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                >
                  <Icono className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-xs font-semibold text-white">{item.titulo}</p>
                  <p className="text-[10px] text-slate-400">{item.texto}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-[11px] text-slate-500">
          Proyecto de Desarrollo Web · Sistema de Inventarios · 2026
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">Sistema de Inventarios</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Gestión empresarial
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
            <h2 className="text-xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingrese sus credenciales para acceder al sistema.
            </p>

            <form onSubmit={iniciarSesion} className="mt-6 space-y-4">
              {error && <Aviso tono="error">{error}</Aviso>}

              <div className="space-y-1.5">
                <label htmlFor="usuario" className="text-xs font-semibold text-slate-600">
                  Usuario
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="usuario"
                    value={nombreUsuario}
                    onChange={(evento) => setNombreUsuario(evento.target.value)}
                    required
                    autoComplete="username"
                    placeholder="admin"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contrasena" className="text-xs font-semibold text-slate-600">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="contrasena"
                    type={mostrarClave ? "text" : "password"}
                    value={contrasena}
                    onChange={(evento) => setContrasena(evento.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarClave((valor) => !valor)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {cargando ? "Verificando…" : "Entrar al sistema"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Cuentas de demostración
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {cuentasDemo.map((cuenta) => (
                  <button
                    key={cuenta.usuario}
                    type="button"
                    onClick={() => {
                      setNombreUsuario(cuenta.usuario);
                      setContrasena(cuenta.clave);
                      setError("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="block text-[11px] font-semibold text-slate-700">
                      {cuenta.usuario}
                    </span>
                    <span className="block text-[10px] text-slate-400">{cuenta.rol}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            © 2026 Sistema de Inventarios · Todos los derechos reservados
          </p>
        </div>
      </section>
    </div>
  );
}

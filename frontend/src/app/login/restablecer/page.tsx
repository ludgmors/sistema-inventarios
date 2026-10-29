"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, mensajeDeError } from "@/lib/api";

export default function Restablecer() {
  const [token, setToken] = useState("");
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function enviar(e: FormEvent) {
    e.preventDefault(); setError("");
    if (clave !== confirmacion) { setError("Las contraseñas no coinciden."); return; }
    setOcupado(true);
    try {
      const r = await apiFetch<{ mensaje: string }>("/api/auth/restablecer", {
        method: "POST", body: JSON.stringify({ token, contrasenaNueva: clave }),
      });
      setMensaje(r.mensaje); setToken(""); setClave(""); setConfirmacion("");
    } catch (e) { setError(mensajeDeError(e)); }
    finally { setOcupado(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-800 p-6">
    <form onSubmit={enviar} className="w-full max-w-md space-y-5 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow">
      <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
      <p>Utilice una contraseña de al menos 12 caracteres.</p>
      <label className="block">Contraseña nueva
        <input type="password" autoComplete="new-password" required minLength={12} maxLength={100}
          value={clave} onChange={e => setClave(e.target.value)} className="mt-2 w-full rounded border p-3" />
      </label>
      <label className="block">Confirmar contraseña
        <input type="password" autoComplete="new-password" required minLength={12} maxLength={100}
          value={confirmacion} onChange={e => setConfirmacion(e.target.value)} className="mt-2 w-full rounded border p-3" />
      </label>
      {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
      {mensaje && <p role="status" className="text-emerald-800 dark:text-emerald-200">{mensaje}</p>}
      {!token && !mensaje && <p role="alert">Abra el enlace recibido por correo.</p>}
      <button disabled={ocupado || !token} className="w-full rounded bg-emerald-700 p-3 text-white disabled:opacity-50">
        {ocupado ? "Guardando…" : "Guardar contraseña"}
      </button>
      <a href="/login" className="block text-emerald-700 dark:text-emerald-300 underline">Volver al inicio de sesión</a>
    </form>
  </main>;
}

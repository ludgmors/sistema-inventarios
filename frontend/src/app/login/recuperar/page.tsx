"use client";

import { useState, type FormEvent } from "react";
import { apiFetch, mensajeDeError } from "@/lib/api";

export default function Recuperar() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function enviar(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError(""); setMensaje("");
    try {
      const r = await apiFetch<{ mensaje: string }>("/api/auth/recuperar", {
        method: "POST", body: JSON.stringify({ correo }),
      });
      setMensaje(r.mensaje);
    } catch (e) { setError(mensajeDeError(e)); }
    finally { setOcupado(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-800 p-6">
    <form onSubmit={enviar} className="w-full max-w-md space-y-5 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow">
      <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
      <p>Ingrese el correo registrado en su cuenta. El enlace tendrá una vigencia de 15 minutos.</p>
      <label className="block">Correo electrónico
        <input type="email" required maxLength={150} autoComplete="email" value={correo}
          onChange={e => setCorreo(e.target.value)} className="mt-2 w-full rounded border p-3" />
      </label>
      {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
      {mensaje && <p role="status" className="text-emerald-800 dark:text-emerald-200">{mensaje}</p>}
      <button disabled={ocupado} className="w-full rounded bg-emerald-700 p-3 text-white disabled:opacity-50">
        {ocupado ? "Enviando…" : "Enviar enlace"}
      </button>
      <a href="/login" className="block text-emerald-700 dark:text-emerald-300 underline">Volver al inicio de sesión</a>
    </form>
  </main>;
}

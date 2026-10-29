"use client";

import {
  Box,
  Sun,
  Moon,
  Fingerprint,
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
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./login.module.css";
import { IlustracionTecnologica } from "@/components/login/IlustracionTecnologica";
import { Aviso } from "@/components/ui/Aviso";
import { apiFetch, mensajeDeError } from "@/lib/api";
import { useTema } from "@/components/tema/ProveedorTema";

interface DesafioLogin {
  desafioId: string;
  correoOculto: string;
  expiraUtc: string;
  reenviarEnSegundos: number;
}

export default function PaginaLogin() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [desafio, setDesafio] = useState<DesafioLogin | null>(null);
  const [codigo, setCodigo] = useState("");
  const [espera, setEspera] = useState(0);
  const [aviso, setAviso] = useState("");
  const [ingresando, setIngresando] = useState(false);
  const operacionEnCurso = useRef(false);
  const { tema, cambiarTema } = useTema();
  useEffect(() => {
    if (!desafio) return;
    const reloj = window.setInterval(() => setEspera(valor => Math.max(0, valor - 1)), 1000);
    return () => window.clearInterval(reloj);
  }, [desafio]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("motivo") === "actividad") {
      setError("La sesión se cerró por actividad excesiva. Espere antes de volver a ingresar.");
    }
  }, []);

  const iniciarSesion = async (evento: FormEvent) => {
    evento.preventDefault();
    if (operacionEnCurso.current) return;
    operacionEnCurso.current = true;
    setError("");
    setAviso("");
    setCargando(true);

    try {
      const respuesta = await apiFetch<DesafioLogin>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ nombreUsuario, contrasena }),
      });

      setDesafio(respuesta);
      setError("");
      setEspera(respuesta.reenviarEnSegundos);
      setContrasena("");
      setCodigo("");
      setAviso("");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      operacionEnCurso.current = false;
      setCargando(false);
    }
  };

  const verificarCodigo = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!desafio || operacionEnCurso.current || !/^\d{6}$/.test(codigo)) return;
    operacionEnCurso.current = true;
    let verificado = false;
    setCargando(true); setError("");
    setAviso("");
    try {
      await apiFetch("/api/auth/verificar-codigo", {
        method: "POST", body: JSON.stringify({ desafioId: desafio.desafioId, codigo }),
      });
      verificado = true;
      setError("");
      setIngresando(true);
      setAviso("Código verificado. Ingresando al sistema…");
      router.replace("/"); router.refresh();
    } catch (e) { setError(mensajeDeError(e)); }
    finally {
      // Mantener el bloqueo durante la navegación: el código ya fue consumido.
      if (!verificado) { operacionEnCurso.current = false; setCargando(false); }
    }
  };

  const reenviarCodigo = async () => {
    if (!desafio || espera > 0 || operacionEnCurso.current) return;
    operacionEnCurso.current = true;
    setCargando(true); setError(""); setAviso("");
    try {
      const respuesta = await apiFetch<DesafioLogin>("/api/auth/reenviar-codigo", {
        method: "POST", body: JSON.stringify({ desafioId: desafio.desafioId }),
      });
      setDesafio(respuesta); setEspera(respuesta.reenviarEnSegundos); setCodigo("");
      setAviso("Enviamos un nuevo código. El anterior ya no funciona.");
    } catch (e) { setError(mensajeDeError(e)); }
    finally { operacionEnCurso.current = false; setCargando(false); }
  };

  return (
    <main className={styles.page} data-tema={tema}>
      <div className={styles.orbit} aria-hidden="true" />
      <div className={`${styles.orbit} ${styles.orbitBottom}`} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.themeBar}>
          <div className={styles.themeSwitch} role="group" aria-label="Tema de color">
            <button type="button" aria-pressed={tema === "claro"} onClick={() => cambiarTema("claro")}><Sun aria-hidden="true" /> Claro</button>
            <button type="button" aria-pressed={tema === "oscuro"} onClick={() => cambiarTema("oscuro")}><Moon aria-hidden="true" /> Oscuro</button>
          </div>
        </div>
        <div className={styles.card}>
          <section className={styles.hero} aria-labelledby="login-presentacion">
            <div className={styles.brand}><Box className={styles.brandIcon} aria-hidden="true" /><p>Sistema de <strong>Inventarios</strong></p></div>
            <p className={styles.eyebrow}><span aria-hidden="true" /> Su operación, conectada</p>
            <h1 id="login-presentacion" className={styles.title}>Todo conectado.<span>Todo bajo control.</span></h1>
            <p className={styles.description}>Gestione su inventario de forma simple y segura. Conecte sus datos, su equipo y cada decisión en un solo lugar.</p>
            <div className={styles.illustration}><IlustracionTecnologica /></div>
            <div className={styles.features}>
              {[
                { icono: PackageCheck, titulo: "Existencias", texto: "Stock valorizado" },
                { icono: TrendingUp, titulo: "Ventas", texto: "Control diario" },
                { icono: ShieldCheck, titulo: "Seguridad", texto: "Acceso por roles" },
              ].map(({ icono: Icono, titulo, texto }) => (
                <div key={titulo} className={styles.feature}><Icono aria-hidden="true" /><h3>{titulo}</h3><p>{texto}</p></div>
              ))}
            </div>
          </section>
          <section className={styles.formPanel} aria-labelledby="login-titulo">
            <div className={`${styles.brand} ${styles.mobileBrand}`}><Box className={styles.brandIcon} aria-hidden="true" /><p>Sistema de <strong>Inventarios</strong></p></div>
            <div className={styles.badge}><ShieldCheck aria-hidden="true" /> Conexión segura</div>
            <h2 id="login-titulo" className={styles.formTitle}>{desafio ? "Verifique su correo" : "Iniciar sesión"}</h2>
            <p className={styles.formDescription}>{desafio ? `Enviamos un código a ${desafio.correoOculto}. Revise también su carpeta de spam.` : "Acceda a su cuenta para continuar con la gestión de inventarios."}</p>
            {desafio ? (
              <form onSubmit={verificarCodigo} className={styles.form}>
                {error && <Aviso tono="error">{error}</Aviso>}
                {aviso && <p role="status" className={styles.notice}>{aviso}</p>}
                <div className={styles.field}>
                  <label htmlFor="codigo">Código de verificación</label>
                  <input id="codigo" value={codigo} onChange={e => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
                    minLength={6} maxLength={6} required autoFocus disabled={cargando} aria-describedby="codigo-ayuda" placeholder="000000"
                    className={`${styles.input} ${styles.codeInput}`} />
                  <p id="codigo-ayuda" className={styles.formDescription}>Válido hasta 5 minutos. Máximo 5 intentos.</p>
                </div>
                <button type="submit" disabled={cargando || codigo.length !== 6} className={styles.primary}>
                  {cargando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                  {ingresando ? "Ingresando…" : cargando ? "Verificando…" : "Verificar e ingresar"}
                </button>
                <button type="button" disabled={cargando || espera > 0} onClick={reenviarCodigo} className={styles.secondary}>{espera > 0 ? `Reenviar código en ${espera} segundos` : "Reenviar código"}</button>
                <button type="button" disabled={cargando} onClick={() => { setDesafio(null); setCodigo(""); setError(""); setAviso(""); }} className={styles.back}>Volver al inicio de sesión</button>
              </form>
            ) : (
              <form onSubmit={iniciarSesion} className={styles.form}>
                {error && <Aviso tono="error">{error}</Aviso>}
                <div className={styles.field}>
                  <label htmlFor="usuario">Usuario o correo</label>
                  <div className={styles.inputWrap}>
                    <UserRound className={styles.inputIcon} aria-hidden="true" />
                    <input id="usuario" name="username" value={nombreUsuario} onChange={e => { setNombreUsuario(e.target.value); setError(""); }} required maxLength={150}
                      autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={cargando} placeholder="Ingrese su usuario o correo" className={styles.input} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="contrasena">Contraseña</label>
                  <div className={styles.inputWrap}>
                    <LockKeyhole className={styles.inputIcon} aria-hidden="true" />
                    <input id="contrasena" name="password" type={mostrarClave ? "text" : "password"} value={contrasena} onChange={e => { setContrasena(e.target.value); setError(""); }} required maxLength={100}
                      autoComplete="current-password" disabled={cargando} placeholder="Ingrese su contraseña" className={styles.input} />
                    <button type="button" onClick={() => setMostrarClave(v => !v)} className={styles.eye} aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrarClave}>{mostrarClave ? <EyeOff /> : <Eye />}</button>
                  </div>
                </div>
                <button type="submit" disabled={cargando} className={styles.primary}>
                  {cargando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
                  {cargando ? "Verificando…" : "Entrar al sistema"}
                </button>
              </form>
            )}
            {!desafio && <a href="/login/recuperar" className={styles.recover}>¿Olvidó su contraseña?</a>}
            <div className={styles.divider} aria-hidden="true" />
            <p className={styles.assurance}><Fingerprint aria-hidden="true" /><span>Su información protegida.<br />Acceso con verificación por correo.</span></p>
          </section>
        </div>
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Sistema de Inventarios. Todos los derechos reservados.</span>
          <span><LockKeyhole aria-hidden="true" /> Control y confianza en cada movimiento.</span>
        </footer>
      </div>
    </main>
  );
}

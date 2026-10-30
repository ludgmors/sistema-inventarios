"use client";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Settings, ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { TarjetaEstadistica } from "@/components/ui/TarjetaEstadistica";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { Aviso } from "@/components/ui/Aviso";
import { Cargando } from "@/components/ui/Cargando";
import { useAuth } from "@/components/layout/AuthProvider";
import { useApi } from "@/lib/useApi";
import { formatoFecha } from "@/lib/formato";

interface ResumenAdministracion {
  total: number; activos: number; inactivos: number; administradores: number; bloqueados: number;
  actividad: { id: number; fecha: string; usuarioNombre: string; accion: string }[];
}
export default function Administracion() {
  const { usuario } = useAuth();
  const { datos, cargando, error } = useApi<ResumenAdministracion>('/api/administracion/resumen');
  if (cargando) return <Cargando texto="Cargando administración…" />;
  if (error || !datos) return <Aviso tono="error">{error || 'No se pudo cargar la administración.'}</Aviso>;
  return <div className="space-y-6">
    <EncabezadoPagina titulo="Panel administrativo" descripcion="Gestione las cuentas de su equipo, sus roles y la seguridad del acceso." />
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">{usuario?.rol === 'Superadmin' ? 'Superadmin · Control completo del sistema' : 'Administrador · Gestión de usuarios y administradores'}</p><p className="mt-1 text-xs leading-relaxed">{usuario?.rol === 'Superadmin' ? 'Puede administrar todos los módulos y todas las cuentas, incluidas las de otros superadmins.' : 'Puede crear y gestionar usuarios de trabajo y otros administradores. Las cuentas Superadmin están protegidas.'}</p></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TarjetaEstadistica titulo="Usuarios registrados" valor={String(datos.total)} detalle={`${datos.inactivos} cuentas inactivas`} icono={<Users className="h-5 w-5" />} />
      <TarjetaEstadistica titulo="Accesos activos" valor={String(datos.activos)} detalle="Cuentas habilitadas para ingresar" icono={<UserCheck className="h-5 w-5" />} tono="azul" />
      <TarjetaEstadistica titulo="Administración" valor={String(datos.administradores)} detalle="Administradores y superadmins activos" icono={<ShieldCheck className="h-5 w-5" />} tono="violeta" />
      <TarjetaEstadistica titulo="Bloqueos temporales" valor={String(datos.bloqueados)} detalle="Cuentas bajo control de actividad" icono={<LockKeyhole className="h-5 w-5" />} tono="ambar" />
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {[{ href: '/administracion/usuarios', titulo: 'Usuarios y roles', texto: 'Cree las cuentas de sus compañeros, asigne permisos y active o desactive su acceso.', Icono: UserPlus }, { href: '/parametros', titulo: 'Configuración y seguridad', texto: 'Ajuste los límites de actividad, la duración de las sesiones y los parámetros del sistema.', Icono: Settings }].map(({ href, titulo, texto, Icono }) => <Link key={href} href={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500"><div className="flex items-center justify-between"><Icono className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /><ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500" /></div><h2 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{texto}</p></Link>)}
    </div>
    <TarjetaSeccion titulo="Actividad reciente de seguridad" descripcion="Últimos eventos de acceso y gestión de cuentas.">
      {datos.actividad.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"><th className="px-2 pb-3 font-medium">Fecha</th><th className="px-2 pb-3 font-medium">Usuario</th><th className="px-2 pb-3 font-medium">Evento</th></tr></thead><tbody>{datos.actividad.map(a => <tr key={a.id} className="border-b border-slate-100 text-slate-700 last:border-0 dark:border-slate-800 dark:text-slate-200"><td className="whitespace-nowrap px-2 py-3">{formatoFecha(a.fecha, true)}</td><td className="px-2 py-3">{a.usuarioNombre}</td><td className="px-2 py-3">{a.accion}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no hay eventos de seguridad.</p>}
    </TarjetaSeccion>
  </div>;
}

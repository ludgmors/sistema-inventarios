"use client";

import { Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { InsigniaEstado } from "@/components/ui/Insignia";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { useAuth } from "@/components/layout/AuthProvider";
import { construirQuery } from "@/lib/api";
import { formatoFecha, formatoMoneda } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useDebounce } from "@/lib/useDebounce";
import type { Cliente, Paginado, VentaResumen } from "@/lib/tipos";

export default function PaginaVentas() {
  const { tieneRol } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error } = useApi<Paginado<VentaResumen>>(
    `/api/ventas${construirQuery({
      pagina,
      tamanoPagina: 10,
      buscar: busquedaAplicada,
      desde,
      hasta,
      clienteId,
      estado,
    })}`,
  );

  const { datos: clientes } = useApi<Paginado<Cliente>>(
    "/api/clientes?tamanoPagina=200",
  );

  const columnas: Columna<VentaResumen>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (venta) => (
        <Link
          href={`/ventas/${venta.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {venta.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (venta) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoFecha(venta.fecha)}</span>
      ),
    },
    {
      clave: "cliente",
      titulo: "Cliente",
      render: (venta) => (
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{venta.cliente}</p>
          <p className="text-[11px] text-slate-400">
            {venta.cantidadProductos} producto(s) · {venta.formaPago}
          </p>
        </div>
      ),
    },
    {
      clave: "usuario",
      titulo: "Vendedor",
      render: (venta) => <span className="text-xs text-slate-500 dark:text-slate-400">{venta.usuario}</span>,
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (venta) => (
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(venta.total)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (venta) => <InsigniaEstado estado={venta.estado} />,
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (venta) => (
        <Link
          href={`/ventas/${venta.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Eye className="h-3.5 w-3.5" /> Ver
        </Link>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Ventas"
        descripcion="Registre ventas, controle existencias y consulte los documentos emitidos."
        acciones={
          tieneRol("Administrador", "Ventas") ? (
            <Link
              href="/ventas/nueva"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> Nueva venta
            </Link>
          ) : undefined
        }
      />

      {error && <div className="mb-4"><Aviso tono="error">{error}</Aviso></div>}

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            placeholder="Número o cliente…"
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <input
          type="date"
          value={desde}
          onChange={(evento) => {
            setDesde(evento.target.value);
            setPagina(1);
          }}
          className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-emerald-600"
          aria-label="Desde"
        />

        <input
          type="date"
          value={hasta}
          onChange={(evento) => {
            setHasta(evento.target.value);
            setPagina(1);
          }}
          className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-emerald-600"
          aria-label="Hasta"
        />

        <Seleccion
          value={clienteId}
          onChange={(evento) => {
            setClienteId(evento.target.value);
            setPagina(1);
          }}
          aria-label="Cliente"
        >
          <option value="">Todos los clientes</option>
          {(clientes?.items ?? []).map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </Seleccion>

        <Seleccion
          value={estado}
          onChange={(evento) => {
            setEstado(evento.target.value);
            setPagina(1);
          }}
          aria-label="Estado"
        >
          <option value="">Todos los estados</option>
          <option value="Registrada">Registradas</option>
          <option value="Anulada">Anuladas</option>
        </Seleccion>
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(venta) => venta.id}
        vacio="No se encontraron ventas."
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
    </div>
  );
}

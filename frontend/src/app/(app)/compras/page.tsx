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
import type { CompraResumen, Paginado, Proveedor } from "@/lib/tipos";

export default function PaginaCompras() {
  const { tieneRol } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error } = useApi<Paginado<CompraResumen>>(
    `/api/compras${construirQuery({
      pagina,
      tamanoPagina: 10,
      buscar: busquedaAplicada,
      desde,
      hasta,
      proveedorId,
      estado,
    })}`,
  );

  const { datos: proveedores } = useApi<Paginado<Proveedor>>(
    "/api/proveedores?tamanoPagina=200",
  );

  const columnas: Columna<CompraResumen>[] = [
    {
      clave: "numero",
      titulo: "Documento",
      render: (compra) => (
        <Link
          href={`/compras/${compra.id}`}
          className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {compra.numero}
        </Link>
      ),
    },
    {
      clave: "fecha",
      titulo: "Fecha",
      render: (compra) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoFecha(compra.fecha)}</span>
      ),
    },
    {
      clave: "proveedor",
      titulo: "Proveedor",
      render: (compra) => (
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{compra.proveedor}</p>
          <p className="text-[11px] text-slate-400">{compra.cantidadProductos} producto(s)</p>
        </div>
      ),
    },
    {
      clave: "usuario",
      titulo: "Registrado por",
      render: (compra) => <span className="text-xs text-slate-500 dark:text-slate-400">{compra.usuario}</span>,
    },
    {
      clave: "total",
      titulo: "Total",
      alineacion: "derecha",
      render: (compra) => (
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(compra.total)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (compra) => <InsigniaEstado estado={compra.estado} />,
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (compra) => (
        <Link
          href={`/compras/${compra.id}`}
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
        titulo="Compras"
        descripcion="Registre las compras a proveedores y actualice automáticamente el inventario."
        acciones={
          tieneRol("Administrador", "Inventario") ? (
            <Link
              href="/compras/nueva"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" /> Nueva compra
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
            placeholder="Número o proveedor…"
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
          value={proveedorId}
          onChange={(evento) => {
            setProveedorId(evento.target.value);
            setPagina(1);
          }}
          aria-label="Proveedor"
        >
          <option value="">Todos los proveedores</option>
          {(proveedores?.items ?? []).map((proveedor) => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.razonSocial}
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
        filaClave={(compra) => compra.id}
        vacio="No se encontraron compras."
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

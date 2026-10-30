"use client";

import { FileUp, PackagePlus, Pencil, Search, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ModalImportacion } from "@/components/importacion/ModalImportacion";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/Campos";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { Modal } from "@/components/ui/Modal";
import { Paginacion } from "@/components/ui/Paginacion";
import { Tabla, type Columna } from "@/components/ui/Tabla";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, construirQuery, mensajeDeError } from "@/lib/api";
import { formatoMoneda, formatoNumero } from "@/lib/formato";
import { useApi } from "@/lib/useApi";
import { useDebounce } from "@/lib/useDebounce";
import type { Categoria, Paginado, Producto } from "@/lib/tipos";

interface FormularioProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  unidadMedida: string;
  precioCosto: number;
  precioVenta: number;
  existenciaMinima: number;
  activo: boolean;
}

const formularioInicial: FormularioProducto = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoriaId: 0,
  unidadMedida: "Unidad",
  precioCosto: 0,
  precioVenta: 0,
  existenciaMinima: 5,
  activo: true,
};

export default function PaginaProductos() {
  const { tieneRol } = useAuth();
  const puedeEditar = tieneRol("Administrador", "Inventario");

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebounce(busqueda);
  const [categoriaId, setCategoriaId] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [pagina, setPagina] = useState(1);

  const consulta = construirQuery({
    pagina,
    tamanoPagina: 10,
    buscar: busquedaAplicada,
    categoriaId,
    soloActivos: soloActivos || undefined,
    soloBajoMinimo: soloBajoMinimo || undefined,
  });

  const { datos, cargando, error, recargar } = useApi<Paginado<Producto>>(
    `/api/productos${consulta}`,
  );
  const { datos: categorias } = useApi<Categoria[]>("/api/categorias");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [importarAbierto, setImportarAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState<FormularioProducto>(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cambiarFiltro = (accion: () => void) => {
    accion();
    setPagina(1);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({
      ...formularioInicial,
      categoriaId: categorias?.[0]?.id ?? 0,
    });
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setEditando(producto);
    setFormulario({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      categoriaId: producto.categoriaId,
      unidadMedida: producto.unidadMedida,
      precioCosto: producto.precioCosto,
      precioVenta: producto.precioVenta,
      existenciaMinima: producto.existenciaMinima,
      activo: producto.activo,
    });
    setErrorFormulario("");
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setErrorFormulario("");

    try {
      const cuerpo = JSON.stringify({
        ...formulario,
        categoriaId: Number(formulario.categoriaId),
        precioCosto: Number(formulario.precioCosto),
        precioVenta: Number(formulario.precioVenta),
        existenciaMinima: Number(formulario.existenciaMinima),
      });

      await apiFetch(editando ? `/api/productos/${editando.id}` : "/api/productos", {
        method: editando ? "PUT" : "POST",
        body: cuerpo,
      });

      setModalAbierto(false);
      setMensaje(editando ? "Producto actualizado correctamente." : "Producto creado correctamente.");
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const columnas: Columna<Producto>[] = [
    {
      clave: "codigo",
      titulo: "Código",
      render: (producto) => (
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{producto.codigo}</span>
      ),
    },
    {
      clave: "producto",
      titulo: "Producto",
      render: (producto) => (
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{producto.nombre}</p>
          <p className="text-[11px] text-slate-400">
            {producto.categoria} · {producto.unidadMedida}
          </p>
        </div>
      ),
    },
    {
      clave: "existencia",
      titulo: "Existencia",
      alineacion: "derecha",
      render: (producto) => (
        <div className="text-right">
          <p className={`text-sm font-bold ${producto.bajoMinimo ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
            {formatoNumero(producto.existenciaActual)}
          </p>
          <p className="text-[10px] text-slate-400">mín. {formatoNumero(producto.existenciaMinima)}</p>
        </div>
      ),
    },
    {
      clave: "costo",
      titulo: "Costo",
      alineacion: "derecha",
      render: (producto) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{formatoMoneda(producto.precioCosto)}</span>
      ),
    },
    {
      clave: "precio",
      titulo: "Precio venta",
      alineacion: "derecha",
      render: (producto) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{formatoMoneda(producto.precioVenta)}</span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      alineacion: "centro",
      render: (producto) => (
        <Insignia tono={producto.activo ? "verde" : "gris"}>
          {producto.activo ? "Activo" : "Inactivo"}
        </Insignia>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alineacion: "derecha",
      render: (producto) =>
        puedeEditar ? (
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => abrirEditar(producto)}
            icono={<Pencil className="h-3.5 w-3.5" />}
          >
            Editar
          </Boton>
        ) : null,
    },
  ];

  return (
    <div>
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Administre el catálogo, precios y niveles de existencia mínima."
        acciones={
          puedeEditar ? (
            <>
              <Boton
                variante="secundario"
                onClick={() => setImportarAbierto(true)}
                icono={<FileUp className="h-4 w-4" />}
              >
                Importar
              </Boton>
              <Boton onClick={abrirNuevo} icono={<PackagePlus className="h-4 w-4" />}>
                Nuevo producto
              </Boton>
            </>
          ) : undefined
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

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por código o nombre…"
            className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </div>

        <Seleccion
          value={categoriaId}
          onChange={(evento) =>
            cambiarFiltro(() => setCategoriaId(evento.target.value))
          }
          aria-label="Categoría"
        >
          <option value="">Todas las categorías</option>
          {(categorias ?? []).map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Seleccion>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(evento) =>
              cambiarFiltro(() => setSoloActivos(evento.target.checked))
            }
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-600"
          />
          Solo activos
        </label>

        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={soloBajoMinimo}
            onChange={(evento) =>
              cambiarFiltro(() => setSoloBajoMinimo(evento.target.checked))
            }
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-600"
          />
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Bajo mínimo
        </label>
      </div>

      <Tabla
        columnas={columnas}
        datos={datos?.items ?? []}
        cargando={cargando}
        filaClave={(producto) => producto.id}
        vacio="No se encontraron productos."
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
        titulo={editando ? "Editar producto" : "Nuevo producto"}
        descripcion="La existencia se actualiza mediante compras, ventas y ajustes de inventario."
        onCerrar={() => setModalAbierto(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="formulario-producto" cargando={guardando}>
              {editando ? "Guardar cambios" : "Crear producto"}
            </Boton>
          </>
        }
      >
        <form id="formulario-producto" onSubmit={guardar} className="space-y-4">
          {errorFormulario && <Aviso tono="error">{errorFormulario}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Código" requerido>
              <Entrada
                value={formulario.codigo}
                onChange={(evento) =>
                  setFormulario({ ...formulario, codigo: evento.target.value })
                }
                placeholder="BEB-001"
                required
                maxLength={50}
              />
            </Campo>

            <Campo etiqueta="Categoría" requerido>
              <Seleccion
                value={formulario.categoriaId}
                onChange={(evento) =>
                  setFormulario({ ...formulario, categoriaId: Number(evento.target.value) })
                }
                required
              >
                <option value={0}>Seleccione…</option>
                {(categorias ?? []).filter((categoria) => categoria.activo || categoria.id === formulario.categoriaId).map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>

          <Campo etiqueta="Nombre" requerido>
            <Entrada
              value={formulario.nombre}
              onChange={(evento) =>
                setFormulario({ ...formulario, nombre: evento.target.value })
              }
              placeholder="Nombre del producto"
              required
              maxLength={150}
            />
          </Campo>

          <Campo etiqueta="Descripción">
            <Entrada
              value={formulario.descripcion}
              onChange={(evento) =>
                setFormulario({ ...formulario, descripcion: evento.target.value })
              }
              placeholder="Descripción opcional"
              maxLength={500}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Unidad de medida" requerido>
              <Entrada
                value={formulario.unidadMedida}
                onChange={(evento) =>
                  setFormulario({ ...formulario, unidadMedida: evento.target.value })
                }
                placeholder="Unidad, caja, libra…"
                required
                maxLength={30}
              />
            </Campo>

            <Campo etiqueta="Existencia mínima" requerido>
              <Entrada
                type="number"
                min={0}
                step="0.0001"
                value={formulario.existenciaMinima}
                onChange={(evento) =>
                  setFormulario({ ...formulario, existenciaMinima: Number(evento.target.value) })
                }
                required
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Precio de costo" requerido>
              <Entrada
                type="number"
                min={0}
                step="0.01"
                value={formulario.precioCosto}
                onChange={(evento) =>
                  setFormulario({ ...formulario, precioCosto: Number(evento.target.value) })
                }
                required
              />
            </Campo>

            <Campo etiqueta="Precio de venta" requerido>
              <Entrada
                type="number"
                min={0}
                step="0.01"
                value={formulario.precioVenta}
                onChange={(evento) =>
                  setFormulario({ ...formulario, precioVenta: Number(evento.target.value) })
                }
                required
              />
            </Campo>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formulario.activo}
              onChange={(evento) =>
                setFormulario({ ...formulario, activo: evento.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-600"
            />
            Producto activo
          </label>
        </form>
      </Modal>

      <ModalImportacion
        tipo="productos"
        abierto={importarAbierto}
        onCerrar={() => setImportarAbierto(false)}
        onImportado={async () => {
          setMensaje("Importación completada. Revise el listado.");
          await recargar();
        }}
      />
    </div>
  );
}

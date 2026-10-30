"use client";

import { formatoFecha, formatoMoneda, formatoNumero } from "@/lib/formato";
import type {
  BajoMinimo,
  ReporteCompra,
  ReporteNota,
  ReporteVenta,
  ResumenPeriodo,
  TopProducto,
} from "@/lib/tipos";

export type PestanaInforme = "resumen" | "ventas" | "compras" | "notas";

export interface EmpresaInforme {
  nombre: string;
  documento: string;
  direccion: string;
  telefono: string;
  correo: string;
}

interface Props {
  empresa: EmpresaInforme;
  desde: string;
  hasta: string;
  pestana: PestanaInforme;
  usuario: string;
  resumen?: ResumenPeriodo | null;
  ventas?: ReporteVenta[];
  compras?: ReporteCompra[];
  notas?: ReporteNota[];
  topProductos?: TopProducto[];
  bajoMinimo?: BajoMinimo[];
}

// Las fechas del período llegan como YYYY-MM-DD; convertirlas con new Date
// las desplaza un día por la zona horaria.
const fechaPeriodo = (valor: string) => {
  if (!valor.includes("-")) return formatoFecha(valor);
  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
};

const titulos: Record<PestanaInforme, string> = {
  resumen: "Resumen ejecutivo",
  ventas: "Detalle de ventas",
  compras: "Detalle de compras",
  notas: "Notas de ajuste",
};

export function InformeImpresion({
  empresa,
  desde,
  hasta,
  pestana,
  usuario,
  resumen,
  ventas,
  compras,
  notas,
  topProductos,
  bajoMinimo,
}: Props) {
  const totalVentas = resumen?.totalVentas ?? 0;
  const cantidadVentas = resumen?.cantidadVentas ?? 0;
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
  const totalesVentas = (ventas ?? []).reduce(
    (acumulado, venta) => ({
      subtotal: acumulado.subtotal + venta.subtotal,
      impuesto: acumulado.impuesto + venta.impuesto,
      total: acumulado.total + venta.total,
    }),
    { subtotal: 0, impuesto: 0, total: 0 },
  );
  const totalesCompras = (compras ?? []).reduce(
    (acumulado, compra) => ({
      subtotal: acumulado.subtotal + compra.subtotal,
      impuesto: acumulado.impuesto + compra.impuesto,
      total: acumulado.total + compra.total,
    }),
    { subtotal: 0, impuesto: 0, total: 0 },
  );
  const totalNotas = (notas ?? []).reduce((acumulado, nota) => acumulado + nota.total, 0);

  return (
    <section className="informe-impresion">
      <header className="informe-cabecera">
        <div>
          <p className="informe-empresa">{empresa.nombre}</p>
          <p className="informe-contacto">
            {[
              empresa.documento ? `NIT ${empresa.documento}` : "",
              empresa.direccion,
              empresa.telefono,
              empresa.correo,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="informe-meta">
          <p className="informe-titulo">Informe gerencial</p>
          <p>{titulos[pestana]}</p>
          <p>
            Período: {fechaPeriodo(desde)} al {fechaPeriodo(hasta)}
          </p>
          <p>
            Generado: {formatoFecha(new Date().toISOString(), true)} · {usuario}
          </p>
        </div>
      </header>

      <div className="informe-kpis">
        <div>
          <span>Ventas del período</span>
          <strong>{formatoMoneda(totalVentas)}</strong>
          <small>{cantidadVentas} documento(s)</small>
        </div>
        <div>
          <span>Compras del período</span>
          <strong>{formatoMoneda(resumen?.totalCompras ?? 0)}</strong>
          <small>{resumen?.cantidadCompras ?? 0} documento(s)</small>
        </div>
        <div>
          <span>Notas de crédito</span>
          <strong>{formatoMoneda(resumen?.totalNotasCredito ?? 0)}</strong>
          <small>Débitos: {formatoMoneda(resumen?.totalNotasDebito ?? 0)}</small>
        </div>
        <div>
          <span>Ticket promedio</span>
          <strong>{formatoMoneda(ticketPromedio)}</strong>
          <small>Bajo mínimo: {bajoMinimo?.length ?? 0}</small>
        </div>
      </div>

      {pestana === "resumen" && (
        <>
          <section className="informe-seccion">
            <h2>Productos más vendidos</h2>
            <table className="informe-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th className="informe-num">Cantidad</th>
                  <th className="informe-num">Total vendido</th>
                </tr>
              </thead>
              <tbody>
                {(topProductos ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>Sin ventas en el período seleccionado.</td>
                  </tr>
                ) : (
                  (topProductos ?? []).map((producto) => (
                    <tr key={producto.productoId}>
                      <td className="informe-mono">{producto.codigo}</td>
                      <td>{producto.nombre}</td>
                      <td className="informe-num">{formatoNumero(producto.cantidadVendida)}</td>
                      <td className="informe-num">{formatoMoneda(producto.totalVendido)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="informe-seccion">
            <h2>Productos bajo mínimo</h2>
            <table className="informe-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="informe-num">Existencia</th>
                  <th className="informe-num">Mínimo</th>
                  <th className="informe-num">Faltante</th>
                </tr>
              </thead>
              <tbody>
                {(bajoMinimo ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6}>Todo el inventario está sobre el nivel mínimo.</td>
                  </tr>
                ) : (
                  (bajoMinimo ?? []).map((producto) => (
                    <tr key={producto.productoId}>
                      <td className="informe-mono">{producto.codigo}</td>
                      <td>{producto.nombre}</td>
                      <td>{producto.categoria}</td>
                      <td className="informe-num">{formatoNumero(producto.existenciaActual)}</td>
                      <td className="informe-num">{formatoNumero(producto.existenciaMinima)}</td>
                      <td className="informe-num">{formatoNumero(producto.faltante)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {pestana === "ventas" && (
        <section className="informe-seccion">
          <h2>Ventas del período</h2>
          <table className="informe-tabla">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Pago</th>
                <th className="informe-num">Subtotal</th>
                <th className="informe-num">Impuesto</th>
                <th className="informe-num">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(ventas ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9}>No hay ventas en el período seleccionado.</td>
                </tr>
              ) : (
                (ventas ?? []).map((venta) => (
                  <tr key={venta.id}>
                    <td className="informe-mono">{venta.numero}</td>
                    <td>{formatoFecha(venta.fecha)}</td>
                    <td>{venta.cliente}</td>
                    <td>{venta.usuario}</td>
                    <td>{venta.formaPago}</td>
                    <td className="informe-num">{formatoMoneda(venta.subtotal)}</td>
                    <td className="informe-num">{formatoMoneda(venta.impuesto)}</td>
                    <td className="informe-num">{formatoMoneda(venta.total)}</td>
                    <td>{venta.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>Totales · {ventas?.length ?? 0} documento(s)</td>
                <td className="informe-num">{formatoMoneda(totalesVentas.subtotal)}</td>
                <td className="informe-num">{formatoMoneda(totalesVentas.impuesto)}</td>
                <td className="informe-num">{formatoMoneda(totalesVentas.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {pestana === "compras" && (
        <section className="informe-seccion">
          <h2>Compras del período</h2>
          <table className="informe-tabla">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Registró</th>
                <th className="informe-num">Subtotal</th>
                <th className="informe-num">Impuesto</th>
                <th className="informe-num">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(compras ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay compras en el período seleccionado.</td>
                </tr>
              ) : (
                (compras ?? []).map((compra) => (
                  <tr key={compra.id}>
                    <td className="informe-mono">{compra.numero}</td>
                    <td>{formatoFecha(compra.fecha)}</td>
                    <td>{compra.proveedor}</td>
                    <td>{compra.usuario}</td>
                    <td className="informe-num">{formatoMoneda(compra.subtotal)}</td>
                    <td className="informe-num">{formatoMoneda(compra.impuesto)}</td>
                    <td className="informe-num">{formatoMoneda(compra.total)}</td>
                    <td>{compra.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Totales · {compras?.length ?? 0} documento(s)</td>
                <td className="informe-num">{formatoMoneda(totalesCompras.subtotal)}</td>
                <td className="informe-num">{formatoMoneda(totalesCompras.impuesto)}</td>
                <td className="informe-num">{formatoMoneda(totalesCompras.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {pestana === "notas" && (
        <section className="informe-seccion">
          <h2>Notas de ajuste del período</h2>
          <table className="informe-tabla">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Venta</th>
                <th>Cliente</th>
                <th>Motivo</th>
                <th className="informe-num">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(notas ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay notas en el período seleccionado.</td>
                </tr>
              ) : (
                (notas ?? []).map((nota) => (
                  <tr key={nota.id}>
                    <td className="informe-mono">{nota.numero}</td>
                    <td>{nota.tipo}</td>
                    <td>{formatoFecha(nota.fecha)}</td>
                    <td className="informe-mono">{nota.ventaNumero}</td>
                    <td>{nota.cliente}</td>
                    <td>{nota.motivo}</td>
                    <td className="informe-num">{formatoMoneda(nota.total)}</td>
                    <td>{nota.estado}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Totales · {notas?.length ?? 0} nota(s)</td>
                <td className="informe-num">{formatoMoneda(totalNotas)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      <footer className="informe-pie">
        <span>Sistema de Inventarios · Documento generado automáticamente</span>
        <span>
          {empresa.nombre} · {fechaPeriodo(desde)} al {fechaPeriodo(hasta)}
        </span>
      </footer>
    </section>
  );
}

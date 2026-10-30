"use client";

import {
  formatoFecha,
  formatoMoneda,
  formatoNumero,
  variacionPorcentual,
} from "@/lib/formato";
import type { Dashboard } from "@/lib/tipos";
import type { EmpresaInforme } from "@/components/reportes/InformeImpresion";

export function InformePanel({
  datos,
  empresa,
  usuario,
}: {
  datos: Dashboard;
  empresa: EmpresaInforme;
  usuario: string;
}) {
  const variacionVentas = variacionPorcentual(datos.ventasMes, datos.ventasMesAnterior);
  const variacionCompras = variacionPorcentual(datos.comprasMes, datos.comprasMesAnterior);
  const ticketAnterior =
    datos.cantidadVentasMesAnterior > 0
      ? datos.ventasMesAnterior / datos.cantidadVentasMesAnterior
      : 0;
  const variacionTicket = variacionPorcentual(datos.ticketPromedioMes, ticketAnterior);
  const variacionDocumentos = variacionPorcentual(
    datos.cantidadVentasMes,
    datos.cantidadVentasMesAnterior,
  );
  const periodo = new Date(datos.actualizadoUtc).toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric",
  });

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
          <p className="informe-titulo">Panel gerencial</p>
          <p>Período: {periodo}</p>
          <p>
            Generado: {formatoFecha(datos.actualizadoUtc, true)} · {usuario}
          </p>
        </div>
      </header>

      <div className="informe-kpis">
        <div>
          <span>Ventas del mes</span>
          <strong>{formatoMoneda(datos.ventasMes)}</strong>
          <small>
            {variacionVentas.texto} vs mes anterior · {datos.cantidadVentasMes} doc.
          </small>
        </div>
        <div>
          <span>Compras del mes</span>
          <strong>{formatoMoneda(datos.comprasMes)}</strong>
          <small>
            {variacionCompras.texto} vs mes anterior · {datos.cantidadComprasMes} doc.
          </small>
        </div>
        <div>
          <span>Margen bruto estimado</span>
          <strong>{formatoMoneda(datos.margenBrutoMes)}</strong>
          <small>{datos.porcentajeMargenMes.toFixed(1)}% sobre ventas netas</small>
        </div>
        <div>
          <span>Inventario al costo</span>
          <strong>{formatoMoneda(datos.valorInventarioCosto)}</strong>
          <small>Venta: {formatoMoneda(datos.valorInventarioVenta)}</small>
        </div>
      </div>

      <section className="informe-seccion">
        <h2>Comparativo mensual</h2>
        <table className="informe-tabla">
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="informe-num">Mes actual</th>
              <th className="informe-num">Mes anterior</th>
              <th className="informe-num">Variación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ventas</td>
              <td className="informe-num">{formatoMoneda(datos.ventasMes)}</td>
              <td className="informe-num">{formatoMoneda(datos.ventasMesAnterior)}</td>
              <td className="informe-num">{variacionVentas.texto}</td>
            </tr>
            <tr>
              <td>Compras</td>
              <td className="informe-num">{formatoMoneda(datos.comprasMes)}</td>
              <td className="informe-num">{formatoMoneda(datos.comprasMesAnterior)}</td>
              <td className="informe-num">{variacionCompras.texto}</td>
            </tr>
            <tr>
              <td>Ticket promedio</td>
              <td className="informe-num">{formatoMoneda(datos.ticketPromedioMes)}</td>
              <td className="informe-num">{formatoMoneda(ticketAnterior)}</td>
              <td className="informe-num">{variacionTicket.texto}</td>
            </tr>
            <tr>
              <td>Documentos de venta</td>
              <td className="informe-num">{formatoNumero(datos.cantidadVentasMes)}</td>
              <td className="informe-num">{formatoNumero(datos.cantidadVentasMesAnterior)}</td>
              <td className="informe-num">{variacionDocumentos.texto}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="informe-seccion">
        <h2>Indicadores del mes e inventario</h2>
        <table className="informe-tabla">
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="informe-num">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Costo de ventas del mes</td>
              <td className="informe-num">{formatoMoneda(datos.costoVentasMes)}</td>
            </tr>
            <tr>
              <td>Margen bruto estimado</td>
              <td className="informe-num">{formatoMoneda(datos.margenBrutoMes)}</td>
            </tr>
            <tr>
              <td>Margen sobre ventas netas</td>
              <td className="informe-num">{datos.porcentajeMargenMes.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Inventario al costo</td>
              <td className="informe-num">{formatoMoneda(datos.valorInventarioCosto)}</td>
            </tr>
            <tr>
              <td>Inventario al precio de venta</td>
              <td className="informe-num">{formatoMoneda(datos.valorInventarioVenta)}</td>
            </tr>
            <tr>
              <td>Margen potencial del inventario</td>
              <td className="informe-num">{formatoMoneda(datos.margenPotencialInventario)}</td>
            </tr>
            <tr>
              <td>Productos bajo mínimo / sin existencia</td>
              <td className="informe-num">
                {formatoNumero(datos.productosBajoMinimo)} / {formatoNumero(datos.productosSinExistencia)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="informe-seccion">
        <h2>Ventas por forma de pago</h2>
        <table className="informe-tabla">
          <thead>
            <tr>
              <th>Forma de pago</th>
              <th className="informe-num">Documentos</th>
              <th className="informe-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {datos.ventasPorFormaPago.length === 0 ? (
              <tr>
                <td colSpan={3}>Sin ventas registradas en el mes.</td>
              </tr>
            ) : (
              datos.ventasPorFormaPago.map((item) => (
                <tr key={item.formaPago}>
                  <td>{item.formaPago}</td>
                  <td className="informe-num">{formatoNumero(item.cantidad)}</td>
                  <td className="informe-num">{formatoMoneda(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="informe-seccion">
        <h2>Top clientes del mes</h2>
        <table className="informe-tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th className="informe-num">Documentos</th>
              <th className="informe-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {datos.topClientes.length === 0 ? (
              <tr>
                <td colSpan={3}>Sin ventas registradas en el mes.</td>
              </tr>
            ) : (
              datos.topClientes.map((cliente) => (
                <tr key={`${cliente.clienteId ?? "general"}-${cliente.cliente}`}>
                  <td>{cliente.cliente}</td>
                  <td className="informe-num">{formatoNumero(cliente.cantidad)}</td>
                  <td className="informe-num">{formatoMoneda(cliente.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="informe-seccion">
        <h2>Productos más vendidos (30 días)</h2>
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
            {datos.topProductos.length === 0 ? (
              <tr>
                <td colSpan={4}>Sin ventas en el período.</td>
              </tr>
            ) : (
              datos.topProductos.map((producto) => (
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
            {datos.productosBajoMinimoLista.length === 0 ? (
              <tr>
                <td colSpan={6}>Todo el inventario está sobre el mínimo.</td>
              </tr>
            ) : (
              datos.productosBajoMinimoLista.map((producto) => (
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

      <footer className="informe-pie">
        <span>Sistema de Inventarios · Documento generado automáticamente</span>
        <span>{empresa.nombre} · {periodo}</span>
      </footer>
    </section>
  );
}

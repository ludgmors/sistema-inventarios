export type Rol = "Administrador" | "Inventario" | "Ventas" | "Consulta";

export interface Usuario {
  id: number;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  rolId: number;
  rol: Rol;
}

export interface RolDto {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  cantidadProductos: number;
}

export interface Proveedor {
  id: number;
  codigo: string;
  razonSocial: string;
  documento?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  categoriaId: number;
  categoria: string;
  unidadMedida: string;
  precioCosto: number;
  precioVenta: number;
  existenciaActual: number;
  existenciaMinima: number;
  activo: boolean;
  bajoMinimo: boolean;
  fechaCreacion: string;
}

export interface Parametro {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string | null;
  grupo: string;
}

export interface UsuarioAdmin {
  id: number;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  rolId: number;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string | null;
}

export interface CompraResumen {
  id: number;
  numero: string;
  fecha: string;
  proveedor: string;
  usuario: string;
  total: number;
  estado: "Registrada" | "Anulada";
  cantidadProductos: number;
}

export interface DocumentoDetalle {
  id: number;
  productoId: number;
  codigoProducto: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

export interface Compra {
  id: number;
  numero: string;
  fecha: string;
  proveedorId: number;
  proveedor: string;
  usuario: string;
  subtotal: number;
  impuestoPorcentaje: number;
  impuesto: number;
  total: number;
  estado: "Registrada" | "Anulada";
  observaciones?: string | null;
  fechaAnulacion?: string | null;
  detalles: DocumentoDetalle[];
}

export interface VentaResumen {
  id: number;
  numero: string;
  fecha: string;
  cliente: string;
  usuario: string;
  total: number;
  formaPago: string;
  estado: "Registrada" | "Anulada";
  cantidadProductos: number;
}

export interface NotaResumen {
  id: number;
  numero: string;
  tipo: "Credito" | "Debito";
  fecha: string;
  ventaId: number;
  ventaNumero: string;
  cliente: string;
  motivo: string;
  total: number;
  estado: "Registrada" | "Anulada";
}

export interface Venta {
  id: number;
  numero: string;
  fecha: string;
  clienteId?: number | null;
  cliente: string;
  usuario: string;
  subtotal: number;
  descuento: number;
  impuestoPorcentaje: number;
  impuesto: number;
  total: number;
  formaPago: string;
  estado: "Registrada" | "Anulada";
  observaciones?: string | null;
  fechaAnulacion?: string | null;
  detalles: DocumentoDetalle[];
  notas: NotaResumen[];
}

export interface Nota {
  id: number;
  numero: string;
  tipo: "Credito" | "Debito";
  fecha: string;
  ventaId: number;
  ventaNumero: string;
  cliente: string;
  motivo: string;
  subtotal: number;
  impuestoPorcentaje: number;
  impuesto: number;
  total: number;
  estado: "Registrada" | "Anulada";
  usuario: string;
  fechaAnulacion?: string | null;
  detalles: DocumentoDetalle[];
}

export interface Movimiento {
  id: number;
  fecha: string;
  productoId: number;
  codigoProducto: string;
  producto: string;
  tipo: "Entrada" | "Salida";
  origen: string;
  documentoNumero?: string | null;
  cantidad: number;
  costoUnitario: number;
  saldoAnterior: number;
  saldoNuevo: number;
  usuario: string;
  observacion?: string | null;
}

export interface KardexFila {
  id: number;
  fecha: string;
  tipo: "Entrada" | "Salida";
  origen: string;
  documentoNumero?: string | null;
  cantidad: number;
  costoUnitario: number;
  saldoAnterior: number;
  saldoNuevo: number;
  usuario: string;
  observacion?: string | null;
}

export interface Existencia {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  existenciaActual: number;
  existenciaMinima: number;
  precioCosto: number;
  precioVenta: number;
  valorCosto: number;
  valorVenta: number;
  bajoMinimo: boolean;
  activo: boolean;
}

export interface ResumenExistencias {
  totalProductos: number;
  productosBajoMinimo: number;
  unidadesEnStock: number;
  valorCosto: number;
  valorVenta: number;
}

export interface ReporteVenta {
  id: number;
  numero: string;
  fecha: string;
  cliente: string;
  usuario: string;
  formaPago: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
}

export interface ReporteCompra {
  id: number;
  numero: string;
  fecha: string;
  proveedor: string;
  usuario: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
}

export interface ReporteNota {
  id: number;
  numero: string;
  tipo: string;
  fecha: string;
  ventaNumero: string;
  cliente: string;
  motivo: string;
  total: number;
  estado: string;
}

export interface TopProducto {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
}

export interface VentaPorDia {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface BajoMinimo {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  existenciaActual: number;
  existenciaMinima: number;
  faltante: number;
}

export interface Dashboard {
  ventasHoy: number;
  ventasMes: number;
  comprasHoy: number;
  comprasMes: number;
  productosActivos: number;
  productosBajoMinimo: number;
  clientesActivos: number;
  proveedoresActivos: number;
  movimientosHoy: number;
  ventasUltimosDias: VentaPorDia[];
  topProductos: TopProducto[];
  productosBajoMinimoLista: BajoMinimo[];
  ultimasVentas: ReporteVenta[];
  ventasMesAnterior: number;
  comprasMesAnterior: number;
  cantidadVentasMes: number;
  cantidadComprasMes: number;
  cantidadVentasMesAnterior: number;
  ticketPromedioMes: number;
  costoVentasMes: number;
  margenBrutoMes: number;
  porcentajeMargenMes: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
  margenPotencialInventario: number;
  productosSinExistencia: number;
  ventasPorFormaPago: VentaFormaPago[];
  topClientes: TopCliente[];
  ventasPorMes: MesResumen[];
  actualizadoUtc: string;
}

export interface VentaFormaPago {
  formaPago: string;
  total: number;
  cantidad: number;
}

export interface TopCliente {
  clienteId?: number | null;
  cliente: string;
  total: number;
  cantidad: number;
}

export interface MesResumen {
  anio: number;
  mes: number;
  etiqueta: string;
  ventas: number;
  compras: number;
}

export interface ResumenPeriodo {
  totalVentas: number;
  cantidadVentas: number;
  totalCompras: number;
  cantidadCompras: number;
  totalNotasCredito: number;
  totalNotasDebito: number;
}

export interface AjusteRespuesta {
  numero: string;
  productoId: number;
  producto: string;
  existenciaNueva: number;
}

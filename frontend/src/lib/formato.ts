export const formatoMoneda = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number(valor ?? 0));

export const formatoNumero = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("es-GT", {
    maximumFractionDigits: 4,
  }).format(Number(valor ?? 0));

// Fechas en formato DD/MM/AAAA; la moneda usa la configuración de Guatemala.
export const formatoFecha = (
  valor: string | null | undefined,
  incluirHora = false,
): string => {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(incluirHora
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  }).format(fecha);
};

export const formatoFechaCorta = (valor: string | null | undefined): string => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(fecha);
};

export const hoyISO = (): string => {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

export const haceDiasISO = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

export const fechaLarga = (): string =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export interface Variacion {
  texto: string;
  positiva: boolean;
}

// Variación porcentual para comparativos del panel. Sin base no se inventa
// un porcentaje: se informa "sin base".
export const variacionPorcentual = (actual: number, anterior: number): Variacion => {
  if (!anterior) {
    return { texto: actual === 0 ? "0.0%" : "sin base", positiva: actual >= 0 };
  }

  const porcentaje = ((actual - anterior) / anterior) * 100;
  return {
    texto: `${porcentaje >= 0 ? "+" : ""}${porcentaje.toFixed(1)}%`,
    positiva: porcentaje >= 0,
  };
};

export const fechaCsv = (valor: string | null | undefined): string =>
  valor ? valor.slice(0, 10) : "";

export function descargarArchivo(nombreArchivo: string, blob: Blob): void {
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

export type ValorCsv = string | number | null | undefined;

// CSV pensado para abrir y sumar en Excel: los números van sin formato ni
// comillas, las fechas en ISO y el texto solo se entrecomilla si lo necesita.
export function descargarCsv(
  nombreArchivo: string,
  columnas: string[],
  filas: ValorCsv[][],
): void {
  const escapar = (valor: ValorCsv) => {
    if (valor === null || valor === undefined) return "";
    if (typeof valor === "number") {
      return Number.isFinite(valor) ? String(valor) : "";
    }

    const texto = String(valor);
    return /["\r\n,;]/.test(texto)
      ? `"${texto.replace(/"/g, '""')}"`
      : texto;
  };

  const contenido = [
    columnas.map(escapar).join(","),
    ...filas.map((fila) => fila.map(escapar).join(",")),
  ].join("\r\n");

  const blob = new Blob([`\uFEFF${contenido}`], {
    type: "text/csv;charset=utf-8;",
  });

  descargarArchivo(nombreArchivo, blob);
}

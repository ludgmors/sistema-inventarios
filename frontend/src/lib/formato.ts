export const formatoMoneda = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor ?? 0));

export const formatoNumero = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("es-PA", {
    maximumFractionDigits: 4,
  }).format(Number(valor ?? 0));

export const formatoFecha = (
  valor: string | null | undefined,
  incluirHora = false,
): string => {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "—";

  return new Intl.DateTimeFormat("es-PA", {
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

  return new Intl.DateTimeFormat("es-PA", {
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
  new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export function descargarCsv(
  nombreArchivo: string,
  columnas: string[],
  filas: (string | number)[][],
): void {
  const escapar = (valor: string | number) => {
    const texto = String(valor ?? "");
    return `"${texto.replace(/"/g, '""')}"`;
  };

  const contenido = [
    columnas.map(escapar).join(","),
    ...filas.map((fila) => fila.map(escapar).join(",")),
  ].join("\r\n");

  const blob = new Blob([`\uFEFF${contenido}`], {
    type: "text/csv;charset=utf-8;",
  });

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

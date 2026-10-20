"use client";

export class ApiError extends Error {
  estado: number;
  errores?: Record<string, string[]>;

  constructor(mensaje: string, estado: number, errores?: Record<string, string[]>) {
    super(mensaje);
    this.name = "ApiError";
    this.estado = estado;
    this.errores = errores;
  }
}

export async function apiFetch<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(ruta, {
    ...opciones,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(opciones.headers ?? {}),
    },
  });

  if (respuesta.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }

    throw new ApiError("La sesión expiró. Inicie sesión nuevamente.", 401);
  }

  const texto = await respuesta.text();
  let datos: Record<string, unknown> | null = null;

  if (texto) {
    try {
      datos = JSON.parse(texto) as Record<string, unknown>;
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const mensaje =
      (datos?.detail as string | undefined) ??
      (datos?.title as string | undefined) ??
      (texto && !datos ? texto : undefined) ??
      "No se pudo completar la operación. Intente nuevamente.";

    throw new ApiError(
      mensaje,
      respuesta.status,
      datos?.errors as Record<string, string[]> | undefined,
    );
  }

  return datos as T;
}

export function construirQuery(
  parametros: Record<string, string | number | boolean | null | undefined>,
): string {
  const query = new URLSearchParams();

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      query.set(clave, String(valor));
    }
  });

  const texto = query.toString();
  return texto ? `?${texto}` : "";
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errores) {
      const primero = Object.values(error.errores).flat()[0];
      if (primero) return primero;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

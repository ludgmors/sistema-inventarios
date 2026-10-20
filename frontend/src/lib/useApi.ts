"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, mensajeDeError } from "./api";

export function useApi<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(Boolean(ruta));
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    if (!ruta) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta = await apiFetch<T>(ruta);
      setDatos(respuesta);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [ruta]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { datos, cargando, error, recargar: cargar, setDatos };
}

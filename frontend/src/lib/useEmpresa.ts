"use client";

import { useApi } from "@/lib/useApi";
import type { Parametro } from "@/lib/tipos";

export function useEmpresa() {
  const { datos } = useApi<Parametro[]>("/api/parametros");
  const mapa = new Map((datos ?? []).map((parametro) => [parametro.clave, parametro.valor]));

  return {
    nombre: mapa.get("Empresa.Nombre") ?? "Sistema de Inventarios",
    documento: mapa.get("Empresa.Documento") ?? "",
    direccion: mapa.get("Empresa.Direccion") ?? "",
    telefono: mapa.get("Empresa.Telefono") ?? "",
    correo: mapa.get("Empresa.Correo") ?? "",
    moneda: mapa.get("Moneda.Simbolo") ?? "Q",
    impuesto: Number(mapa.get("Impuesto.Porcentaje") ?? 12),
  };
}

"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import type { Usuario } from "@/lib/tipos";
import { PantallaCargando } from "@/components/ui/Cargando";

interface ContextoAuth {
  usuario: Usuario | null;
  cerrarSesion: () => Promise<void>;
  tieneRol: (...roles: string[]) => boolean;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let activo = true;

    apiFetch<Usuario>("/api/auth/me")
      .then((respuesta) => {
        if (activo) setUsuario(respuesta);
      })
      .catch(() => {
        if (activo) {
          setUsuario(null);
          router.replace("/login");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [router]);

  const cerrarSesion = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // La cookie se elimina igualmente al redirigir al login.
    }

    setUsuario(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const tieneRol = useCallback(
    (...roles: string[]) => (usuario ? usuario.rol === "Superadmin" || roles.includes(usuario.rol) : false),
    [usuario],
  );

  if (cargando) {
    return <PantallaCargando />;
  }

  if (!usuario) {
    return null;
  }

  return (
    <Contexto.Provider value={{ usuario, cerrarSesion, tieneRol }}>
      {children}
    </Contexto.Provider>
  );
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return contexto;
}

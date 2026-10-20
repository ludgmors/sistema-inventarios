import { AuthProvider } from "@/components/layout/AuthProvider";
import { Shell } from "@/components/layout/Shell";
import type { ReactNode } from "react";

export default function LayoutAplicacion({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}

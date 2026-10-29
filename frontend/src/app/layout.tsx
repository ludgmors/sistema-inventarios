import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { scriptTema } from "@/lib/tema";
import { ProveedorTema } from "@/components/tema/ProveedorTema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sistema de Inventarios",
    template: "%s | Sistema de Inventarios",
  },
  description:
    "Sistema web para la gestión de proveedores, productos, compras, ventas, notas de crédito y débito, movimientos y existencias.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTema }} /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProveedorTema>{children}</ProveedorTema>
      </body>
    </html>
  );
}

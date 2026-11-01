import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--fuente-texto" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3090"),
  title: { default: "Solucionador: resuelve de verdad lo que te tiene dando vueltas", template: "%s · Solucionador" },
  description: "Un método de 10 etapas con copiloto de IA para definir tu problema, decidir qué hacer y seguirlo hasta verificar que no vuelva.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#101216" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { Celebraciones } from "@/components/movimiento/celebracion";
import { exigirSesion } from "@/lib/auth";
import { saldoCreditos } from "@/lib/compras";

export const metadata: Metadata = { robots: { index: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const sesion = await exigirSesion();
  const creditos = await saldoCreditos(sesion.id);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-lienzo/85 backdrop-blur-xl">
        <div className="contenedor h-[60px] flex items-center justify-between gap-3">
          <Logo href="/app" />
          <nav className="flex items-center gap-1" aria-label="Cuenta">
            {creditos > 0 && <Link href="/app/ajustes" className="chip chip-acento mr-1">{creditos === 1 ? "1 crédito" : `${creditos} créditos`}</Link>}
            <Link href="/app" className="btn btn-3 !min-h-11 !font-medium">Mis casos</Link>
            <Link href="/app/ajustes" aria-label="Ajustes" className="btn btn-3 !px-0 w-11 !min-h-11 -mr-2"><Settings size={20} /></Link>
          </nav>
        </div>
      </header>
      <main className="contenedor pb-10">{children}</main>
      <Celebraciones />
    </div>
  );
}

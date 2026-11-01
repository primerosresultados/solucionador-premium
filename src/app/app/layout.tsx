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
    <div className="min-h-dvh bg-[radial-gradient(60%_320px_at_50%_-40px,var(--color-acento-suave),transparent)]">
      <div className="mx-auto max-w-[1160px] px-5">
        <header className="flex items-center justify-between py-3">
          <Logo href="/app" />
          <nav className="flex items-center gap-1">
            {creditos > 0 && <Link href="/app/ajustes" className="chip chip-acento mr-1">{creditos === 1 ? "1 crédito" : `${creditos} créditos`}</Link>}
            <Link href="/app" className="btn btn-3 !min-h-11 hidden sm:inline-flex">Mis casos</Link>
            <Link href="/app/ajustes" aria-label="Ajustes" className="btn btn-3 !px-0 w-11 !min-h-11"><Settings size={20} /></Link>
          </nav>
        </header>
        <main className="pt-2 pb-10">{children}</main>
      </div>
      <Celebraciones />
    </div>
  );
}

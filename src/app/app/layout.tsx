import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { exigirSesion } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await exigirSesion();
  return (
    <div className="mx-auto max-w-[760px] px-5">
      <header className="flex items-center justify-between py-3">
        <Logo href="/app" />
        <Link href="/app/ajustes" aria-label="Ajustes" className="btn btn-3 !px-0 w-11 !min-h-11"><Settings size={20} /></Link>
      </header>
      <main className="pt-2 pb-10">{children}</main>
    </div>
  );
}

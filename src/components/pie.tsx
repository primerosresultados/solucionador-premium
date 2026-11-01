import Link from "next/link";
import { MARCA } from "@/lib/marca";

export function Pie() {
  return (
    <footer className="py-8 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-[14px] text-tinta-3">
      <p>© {new Date().getFullYear()} {MARCA.razonSocial}</p>
      <nav className="flex gap-1 -ml-3 sm:ml-0 sm:-mr-3">
        <Link href="/terminos" className="px-3 min-h-11 inline-flex items-center">Términos</Link>
        <Link href="/privacidad" className="px-3 min-h-11 inline-flex items-center">Privacidad</Link>
      </nav>
    </footer>
  );
}

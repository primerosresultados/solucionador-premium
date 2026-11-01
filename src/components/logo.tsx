import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 min-h-11 font-titulo font-semibold text-[19px] tracking-tight">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
        <rect width="24" height="24" rx="8" fill="var(--color-sol)" />
        <path d="M6.5 12.5 10.3 16.3 17.5 8" stroke="var(--color-sol-tinta)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Solucionador
    </Link>
  );
}

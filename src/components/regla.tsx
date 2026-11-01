import Link from "next/link";
import { ETAPAS, FASES } from "@/lib/metodo";

/** La regla de 10 etapas: el elemento que identifica al producto. */
export function Regla({ actual, alcanzada, casoId }: { actual: number; alcanzada: number; casoId?: string }) {
  return (
    <nav aria-label="Etapas del método" className="grid grid-cols-[3fr_3fr_4fr] gap-2">
      {FASES.map((f) => (
        <div key={f.nombre} className="min-w-0">
          <p className={`etiqueta mb-1.5 ${(f.etapas as readonly number[]).includes(actual) ? "!text-tinta" : ""}`}>{f.nombre}</p>
          <div className="flex gap-[3px]">
            {f.etapas.map((n) => {
              const clase = `block h-2 w-full rounded-full transition-colors ${n === actual ? "bg-acento" : n <= alcanzada ? "bg-tinta-3" : "bg-hundido"}`;
              const accesible = casoId && n <= alcanzada;
              return (
                <span key={n} className="flex-1 min-w-0">
                  {accesible ? (
                    <Link href={`/app/caso/${casoId}/${n === 10 ? "seguimiento" : n}`} aria-label={`Etapa ${n}: ${ETAPAS[n - 1].nombre}`} className="block py-[18px] -my-[18px]">
                      <span className={clase} />
                    </Link>
                  ) : <span className={clase} />}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

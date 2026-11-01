import { diasEntre, fechaCorta } from "@/lib/fechas";
type Punto = { fecha: string; valor: number };

/** Indicador real contra el camino ideal. Una serie en acento, la referencia punteada. */
export function GraficoIndicador({ base, objetivo, inicio, fin, puntos, unidad }: {
  base: number; objetivo: number; inicio: string; fin: string; puntos: Punto[]; unidad: string;
}) {
  const A = 640, H = 220, mX = 8, mY = 30;
  const total = Math.max(1, diasEntre(inicio, fin));
  const valores = [base, objetivo, ...puntos.map((p) => p.valor)];
  const min = Math.min(...valores), max = Math.max(...valores), rango = max - min || 1;
  const x = (f: string) => mX + (Math.min(total, Math.max(0, diasEntre(inicio, f))) / total) * (A - mX * 2);
  const y = (v: number) => mY + (1 - (v - min) / rango) * (H - mY * 2);
  const serie = [{ fecha: inicio, valor: base }, ...puntos];
  const linea = serie.map((p, i) => `${i ? "L" : "M"}${x(p.fecha).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(" ");
  const ultimo = serie.at(-1)!;

  return (
    <figure>
      <svg viewBox={`0 0 ${A} ${H}`} className="w-full h-auto block" role="img" aria-label={`Indicador: de ${base} a ${ultimo.valor} ${unidad}; objetivo ${objetivo} ${unidad}`}>
        <line x1={x(inicio)} y1={y(base)} x2={x(fin)} y2={y(objetivo)} stroke="var(--color-tinta-3)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
        <path d={linea} fill="none" stroke="var(--color-acento)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {serie.map((p) => (
          <circle key={`${p.fecha}${p.valor}`} cx={x(p.fecha)} cy={y(p.valor)} r="5" fill="var(--color-acento)" stroke="var(--color-superficie)" strokeWidth="2">
            <title>{`${fechaCorta(p.fecha)}: ${p.valor.toLocaleString("es-CL")} ${unidad}`}</title>
          </circle>
        ))}
        <text x={x(fin)} y={y(objetivo) + (objetivo >= base ? -12 : 22)} textAnchor="end" fill="var(--color-tinta-2)" fontSize="15" fontWeight="600">Meta {objetivo.toLocaleString("es-CL")} {unidad}</text>
        {puntos.length > 0 && (
          <text x={Math.min(x(ultimo.fecha) + 10, A - 90)} y={y(ultimo.valor) + (ultimo.valor >= base === objetivo >= base ? -12 : 22)} fill="var(--color-tinta)" fontSize="15" fontWeight="700">{ultimo.valor.toLocaleString("es-CL")} {unidad}</text>
        )}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[13px] text-tinta-3 tabular-nums">
        <span>{fechaCorta(inicio)}</span>
        <span>Punteado: ritmo necesario</span>
        <span>{fechaCorta(fin)}</span>
      </figcaption>
      {puntos.length > 0 && (
        <details className="mt-2 text-[14px] text-tinta-2">
          <summary className="cursor-pointer min-h-11 inline-flex items-center">Ver mediciones</summary>
          <table className="w-full mt-1 tabular-nums">
            <tbody>{[...puntos].reverse().map((p) => (
              <tr key={`${p.fecha}${p.valor}`}><td className="py-1">{fechaCorta(p.fecha)}</td><td className="py-1 text-right">{p.valor.toLocaleString("es-CL")} {unidad}</td></tr>
            ))}</tbody>
          </table>
        </details>
      )}
    </figure>
  );
}

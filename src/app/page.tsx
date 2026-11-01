import { Pie } from "@/components/pie";
import { Aparece, PalabrasScroll, Titulo } from "@/components/movimiento/piezas";
import { Citas } from "@/components/portada/citas";
import { Confianza } from "@/components/portada/confianza";
import { Demo } from "@/components/portada/demo";
import { Final } from "@/components/portada/final";
import { Heroe } from "@/components/portada/heroe";
import { Historia } from "@/components/portada/historia";
import { leerSesion } from "@/lib/auth";
import { PLANES, pesos } from "@/lib/planes";

const PREGUNTAS_COPILOTO = [
  "¿Qué parte de esto depende de ti?", "¿Y si el problema fuera otro?", "¿Eso lo sabes o lo supones?", "¿Qué pasa si no haces nada?",
  "¿Cómo lo comprobarías esta semana?", "¿Qué tendría que ser cierto?", "¿Qué harías si no pudieras fallar?", "¿Qué dejarías de hacer?",
];

const INCLUYE = ["Las 9 etapas restantes", "Copiloto en cada etapa", "Revisiones y recordatorios", "Resumen semanal por correo", "Compañero de compromiso", "Verificación a 30 días"];

const PREGUNTAS = [
  ["¿Sirve para problemas personales o de trabajo?", "Para ambos: una deuda, un negocio que no despega, un conflicto con un socio, una decisión de carrera. El método es el mismo y el copiloto trabaja con lo que tú cuentes."],
  ["¿La IA me dice qué hacer?", "No. El copiloto cuestiona tu definición, muestra causas que no viste, agrega ideas y pone a prueba tu decisión. Tú aceptas o descartas cada cosa."],
  ["¿Y si no termino?", "Tu caso no vence. Si desapareces te buscamos con un aviso, y puedes pausarlo cuando lo necesites."],
  ["¿Quién ve lo que escribo?", "Solo tú. Tu texto se procesa para que el copiloto te responda y no se usa para entrenar modelos."],
  ["¿Reemplaza a un profesional?", "No. En temas de salud, legales o financieros grandes te ayuda a preparar la consulta, no a evitarla."],
];

function Marquesina({ items, dur, inversa }: { items: string[]; dur: string; inversa?: boolean }) {
  return (
    <div className={`marquesina ${inversa ? "marquesina-inversa" : ""}`} style={{ "--dur": dur } as React.CSSProperties}>
      {[0, 1].map((n) => (
        <div key={n} aria-hidden={n === 1} className="flex gap-3 pr-3">
          {items.map((t) => <span key={t} className="whitespace-nowrap rounded-full bg-superficie px-6 py-4 text-[20px] sm:text-[28px] font-medium tracking-[-.02em] shadow-suave">{t}</span>)}
        </div>
      ))}
    </div>
  );
}

export default async function Inicio() {
  const sesion = await leerSesion();
  const destino = sesion ? "/app/nuevo" : "/registro";
  return (
    <div className="overflow-x-clip">
      <Heroe destino={destino} conSesion={!!sesion} />
      <main>
        <section className="escena-noche">
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8 pt-16 pb-24 sm:pt-28 sm:pb-40">
            <figure>
              <PalabrasScroll className="font-semibold text-[40px] sm:text-[76px] leading-[1.04] tracking-[-.035em]" texto="«Pensar es el trabajo más duro que existe, y probablemente por eso hay tan pocos que lo hacen.»" />
              <figcaption className="mt-6 text-[17px] text-tinta-3">Henry Ford, <cite className="not-italic">Mi vida y mi obra, 1922</cite></figcaption>
            </figure>
            <Aparece><p className="mt-12 text-[21px] sm:text-[26px] leading-[1.35] text-tinta-2 max-w-[28em]">Si llevas meses con lo mismo, no es falta de ganas. Te ha faltado una forma de pensarlo por escrito y a alguien que te siga hasta el final.</p></Aparece>
          </div>
        </section>

        <Historia />

        <section className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32">
          <Titulo className="text-[40px] sm:text-[72px] leading-[1.02] tracking-[-.04em] max-w-[12em]">El problema rara vez es el que crees.</Titulo>
          <p className="mt-3 mb-12 text-[19px] text-tinta-2">Elige un ejemplo y mira cómo cambia al trabajarlo.</p>
          <Demo />
        </section>

        <section className="pb-20 sm:pb-32 overflow-hidden" aria-label="Lo que pregunta el copiloto">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8 mb-10">
            <Titulo className="text-[40px] sm:text-[72px] leading-[1.02] tracking-[-.04em]">Un copiloto que te exige.</Titulo>
            <p className="mt-3 text-[19px] text-tinta-2 max-w-[30em]">No te llena de consejos. Trabaja sobre lo que escribiste y te hace mejores preguntas.</p>
          </div>
          <div className="space-y-3">
            <Marquesina items={PREGUNTAS_COPILOTO.slice(0, 4)} dur="44s" />
            <Marquesina items={PREGUNTAS_COPILOTO.slice(4)} dur="52s" inversa />
          </div>
        </section>

        <Citas />

        <section className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32">
          <Titulo className="mb-10 text-[40px] sm:text-[72px] leading-[1.02] tracking-[-.04em]">Esto no es un chat más.</Titulo>
          <Confianza />
        </section>

        <section id="precio" className="escena-noche grano relative scroll-mt-6">
          <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Titulo className="text-[40px] sm:text-[72px] leading-[1.02] tracking-[-.04em]">Pagas por problema. Sin mensualidad.</Titulo>
              <p className="mt-5 text-[19px] leading-relaxed text-tinta-2 max-w-[27em]">La primera etapa es gratis. Si sigues, pagas una vez y tienes todo hasta resolverlo.</p>
              <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[16px]">
                {INCLUYE.map((x) => <li key={x} className="flex gap-2.5 items-center"><span aria-hidden className="size-1.5 rounded-full bg-sol" />{x}</li>)}
              </ul>
            </div>
            <div className="borde-luz p-7 sm:p-9">
              {Object.values(PLANES).map((p, i) => (
                <div key={p.id} className={`flex items-end justify-between gap-5 ${i ? "mt-6 pt-6 border-t border-white/10" : ""}`}>
                  <div className="min-w-0">
                    <h3 className="font-sans text-[20px]">{p.nombre}</h3>
                    <p className="text-tinta-2 text-[15px] mt-0.5">{p.detalle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[36px] sm:text-[50px] leading-none tracking-[-.04em] tabular-nums">{pesos(p.monto)}</p>
                    <p className="mt-1.5 text-[13px] text-tinta-3">{p.creditos > 1 ? `${pesos(Math.round(p.monto / p.creditos))} cada uno` : "IVA incluido"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[820px] px-5 sm:px-8 py-20 sm:py-32">
          <Titulo className="text-[32px] sm:text-[44px] tracking-[-.03em]">Preguntas frecuentes</Titulo>
          <div className="mt-6 divide-y divide-hundido">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p} className="group py-2">
                <summary className="text-[18px] font-medium min-h-12 items-center list-none flex justify-between gap-4">
                  {p}<span className="text-tinta-3 text-[22px] group-open:rotate-45 transition-transform duration-150" aria-hidden>+</span>
                </summary>
                <p className="pb-3 text-tinta-2 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </section>

        <Final destino={destino} />
      </main>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <p className="pt-6 text-[14px] text-tinta-3">Citas traducidas de sus textos originales.</p>
        <Pie />
      </div>
    </div>
  );
}

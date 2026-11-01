import Link from "next/link";
import { Logo } from "@/components/logo";
import { Pie } from "@/components/pie";
import { Demo } from "@/components/portada/demo";
import { Entrada } from "@/components/portada/entrada";
import { Hilo } from "@/components/portada/hilo";
import { leerSesion } from "@/lib/auth";
import { ETAPAS, FASES } from "@/lib/metodo";
import { PLANES, pesos } from "@/lib/planes";

const ACTOS = [
  {
    fase: FASES[0], titulo: "Ves lo que de verdad está pasando.",
    texto: "Lo escribes, separas hechos de suposiciones y llegas a la causa. Casi siempre es otra que la que creías.",
    cita: "Lo que estorba el camino se convierte en el camino.", autor: "Marco Aurelio", obra: "Meditaciones, V, 20",
  },
  {
    fase: FASES[1], titulo: "Encuentras salidas que hoy no ves.",
    texto: "Sacas veinte ideas sin juzgarlas, comparas las mejores con criterios claros y eliges una, con plan B incluido.",
    cita: "¿Resultados? ¡Hombre, he obtenido muchísimos resultados! Conozco varios miles de cosas que no funcionan.", autor: "Thomas Edison", obra: "citado en Edison: His Life and Inventions, 1910",
  },
  {
    fase: FASES[2], titulo: "Avanzas hasta que deje de ser un problema.",
    texto: "Una meta con número y fecha, pasos claros y revisiones constantes. Lo das por resuelto cuando pasan 30 días y no volvió.",
    cita: "No es porque las cosas sean difíciles que no nos atrevemos; es porque no nos atrevemos que son difíciles.", autor: "Séneca", obra: "Cartas a Lucilio, 104",
  },
];

const CONFIANZA = [
  ["Tú decides.", "La IA pregunta, cuestiona y propone. Nada entra a tu caso sin que lo aceptes."],
  ["Lo tuyo es tuyo.", "Solo tú lees tu caso. No se usa para entrenar modelos, y lo puedes descargar o borrar cuando quieras."],
  ["Pruebas antes de pagar.", "La primera etapa es gratis y no pide tarjeta. Pagas si quieres seguir, una sola vez, con Flow."],
  ["Sin promesas de milagro.", "No reemplaza a un médico, un abogado ni un terapeuta. Es un método para ordenar y actuar."],
];

const PREGUNTAS = [
  ["¿Sirve para problemas personales o de trabajo?", "Para ambos: una deuda, un negocio que no despega, un conflicto con un socio, una decisión de carrera. El método es el mismo y el copiloto trabaja con lo que tú cuentes."],
  ["¿La IA me dice qué hacer?", "No. El copiloto cuestiona tu definición, muestra causas que no viste, agrega ideas y pone a prueba tu decisión. Tú aceptas o descartas cada cosa."],
  ["¿Y si no termino?", "Tu caso no vence. Si desapareces te buscamos con un aviso, y puedes pausarlo cuando lo necesites."],
  ["¿Quién ve lo que escribo?", "Solo tú. Tu texto se procesa para que el copiloto te responda y no se usa para entrenar modelos."],
  ["¿Reemplaza a un profesional?", "No. En temas de salud, legales o financieros grandes te ayuda a preparar la consulta, no a evitarla."],
];

function Cita({ texto, autor, obra, grande }: { texto: string; autor: string; obra: string; grande?: boolean }) {
  return (
    <figure>
      <blockquote className={`font-titulo font-semibold tracking-[-.02em] ${grande ? "text-[36px] sm:text-[64px] leading-[1.05]" : "text-[22px] sm:text-[26px] leading-[1.2]"}`}>
        «{texto}»
      </blockquote>
      <figcaption className={`${grande ? "mt-6 text-[17px]" : "mt-3 text-[15px]"} opacity-75`}>{autor}, <cite className="not-italic">{obra}</cite></figcaption>
    </figure>
  );
}

export default async function Inicio() {
  const sesion = await leerSesion();
  const destino = sesion ? "/app/nuevo" : "/registro";
  return (
    <div className="overflow-x-clip">
      <section className="bg-cobalto text-papel">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <header className="flex items-center justify-between py-3">
            <Logo />
            <nav className="flex items-center gap-1">
              <a href="#precio" className="hidden sm:inline-flex items-center px-3 min-h-11 font-semibold">Precio</a>
              <Link href={sesion ? "/app" : "/ingresar"} className="inline-flex items-center px-4 min-h-11 font-semibold rounded-full bg-white/15">{sesion ? "Mis casos" : "Entrar"}</Link>
            </nav>
          </header>
          <h1 className="pt-8 sm:pt-8 font-semibold text-[60px] leading-[.98] sm:text-[clamp(64px,8.3vw,118px)] tracking-[-.035em]">
            Deja de darle vueltas. <span className="sm:block">Resuélvelo.</span>
          </h1>
        </div>
        <div className="mt-5 sm:mt-3"><Hilo /></div>
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 pt-6 sm:pt-3 pb-12 sm:pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-7 lg:gap-16 items-start">
          <p className="text-[20px] sm:text-[24px] leading-[1.35] max-w-[27em]">
            Un método paso a paso y un copiloto de IA que te acompañan desde el nudo en la cabeza hasta un resultado que puedes medir.
          </p>
          <div>
            <Entrada destino={destino} id="relato-inicio" />
            <p className="mt-3 text-[15px] text-cobalto-2">Gratis para empezar, sin tarjeta. Solo tú lo lees.</p>
          </div>
        </div>
      </section>

      <main>
        <section className="mx-auto max-w-[1040px] px-5 sm:px-8 py-20 sm:py-32">
          <Cita grande texto="Pensar es el trabajo más duro que existe, y probablemente por eso hay tan pocos que lo hacen." autor="Henry Ford" obra="Mi vida y mi obra, 1922" />
          <p className="mt-10 text-[20px] sm:text-[24px] leading-[1.4] text-tinta-2 max-w-[30em]">
            Si llevas meses con lo mismo, no es falta de ganas. Te ha faltado una forma de pensarlo por escrito y a alguien que te siga hasta el final.
          </p>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 sm:px-8 pb-20 sm:pb-32">
          <h2 className="font-semibold text-[38px] sm:text-[60px] leading-[1.03] max-w-[15em]">El problema rara vez es el que crees.</h2>
          <p className="mt-3 mb-10 text-[18px] text-tinta-2">Elige un ejemplo y mira cómo cambia al trabajarlo.</p>
          <Demo />
        </section>

        <section className="bg-superficie">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32">
            <h2 className="font-semibold text-[38px] sm:text-[60px] leading-[1.03]">Diez etapas, una línea recta.</h2>
            <div className="mt-12 space-y-16 sm:space-y-24">
              {ACTOS.map((a) => (
                <article key={a.fase.nombre} className="grid lg:grid-cols-2 gap-6 lg:gap-16">
                  <div>
                    <h3 className="font-semibold text-[28px] sm:text-[38px] leading-[1.1]">{a.titulo}</h3>
                    <p className="mt-3 text-[18px] leading-relaxed text-tinta-2 max-w-[32em]">{a.texto}</p>
                    <ol className="mt-5 space-y-1.5">
                      {a.fase.etapas.map((n) => (
                        <li key={n} className="flex gap-3 items-baseline">
                          <span className="font-titulo font-semibold text-acento w-6 text-right tabular-nums shrink-0">{n}</span>
                          <span>{ETAPAS[n - 1].pregunta}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="lg:pt-1"><Cita texto={a.cita} autor={a.autor} obra={a.obra} /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-noche text-papel">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-semibold text-[38px] sm:text-[60px] leading-[1.03]">Aquí es donde los planes mueren. El tuyo sigue.</h2>
              <ul className="mt-8 space-y-4 text-[18px] sm:text-[20px] leading-snug max-w-[30em]">
                <li>Cada día sabes una sola cosa: la que sigue.</li>
                <li>Si cumples los pasos y el número no se mueve, te lo dice.</li>
                <li>Mover una fecha no te mejora la nota.</li>
                <li>Si desapareces, te va a buscar.</li>
                <li>Y si quieres, alguien de confianza puede ver tu avance, nunca lo que escribiste.</li>
              </ul>
              <div className="mt-10 text-cobalto-2 max-w-[32em]">
                <Cita texto="No hay deshonra en fracasar con honestidad; la hay en tener miedo de fracasar." autor="Henry Ford" obra="Mi vida y mi obra, 1922" />
              </div>
            </div>
            <Telefono />
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-32">
          <h2 className="font-semibold text-[38px] sm:text-[60px] leading-[1.03]">Esto no es un chat más.</h2>
          <dl className="mt-10 grid sm:grid-cols-2 gap-x-16 gap-y-9 max-w-[1040px]">
            {CONFIANZA.map(([t, d]) => (
              <div key={t}>
                <dt className="font-titulo font-semibold text-[24px] leading-tight">{t}</dt>
                <dd className="mt-1.5 text-[18px] leading-relaxed text-tinta-2">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="precio" className="mx-auto max-w-[1280px] px-5 sm:px-8 pb-20 sm:pb-32 scroll-mt-6 grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="font-semibold text-[38px] sm:text-[60px] leading-[1.03]">Pagas por problema. Sin mensualidad.</h2>
            <p className="mt-4 text-[18px] leading-relaxed text-tinta-2 max-w-[28em]">La primera etapa es gratis. Si sigues, el pago cubre las nueve etapas restantes, el copiloto y el seguimiento hasta el final.</p>
          </div>
          <div className="divide-y divide-hundido">
            {Object.values(PLANES).map((p) => (
              <div key={p.id} className="py-6 first:pt-0 flex items-end justify-between gap-5">
                <div className="min-w-0">
                  <h3 className="font-sans tracking-normal font-semibold text-[19px]">{p.nombre}</h3>
                  <p className="text-tinta-2">{p.detalle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-titulo font-semibold text-[34px] sm:text-[44px] leading-none tabular-nums">{pesos(p.monto)}</p>
                  <p className="mt-1 text-[14px] text-tinta-3">IVA incluido</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[820px] px-5 sm:px-8 pb-20 sm:pb-32">
          <h2 className="font-semibold text-[32px] sm:text-[40px]">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-hundido">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p} className="group py-2">
                <summary className="text-[18px] font-semibold min-h-12 items-center list-none flex justify-between gap-4">
                  {p}<span className="text-tinta-3 text-[22px] group-open:rotate-45 transition-transform duration-150" aria-hidden>+</span>
                </summary>
                <p className="pb-3 text-tinta-2 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-cobalto text-papel">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
            <Cita grande texto="El fracaso es solo la oportunidad de volver a empezar con más inteligencia." autor="Henry Ford" obra="Mi vida y mi obra, 1922" />
            <div>
              <p className="text-[22px] font-semibold mb-3">Empieza hoy. Lo primero es escribirlo.</p>
              <Entrada destino={destino} id="relato-cierre" />
            </div>
          </div>
        </section>
      </main>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <p className="pt-6 text-[14px] text-tinta-3">Citas traducidas de sus textos originales.</p>
        <Pie />
      </div>
    </div>
  );
}

function Telefono() {
  return (
    <div aria-label="Ejemplo de un caso en seguimiento" role="img" className="mx-auto w-full max-w-[340px] rounded-[38px] bg-noche-2 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]">
      <div className="rounded-[28px] bg-papel text-[#15171c] p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold rounded-full bg-[#dff0e8] text-[#1d7a55] px-3 h-7 inline-flex items-center">En ruta</span>
          <span className="text-[13px] text-[#6f737c]">Día 34 de 90</span>
        </div>
        <p className="mt-3 font-titulo font-semibold text-[21px] leading-[1.12] tracking-[-.02em]">Mi negocio vende, pero no me queda plata</p>
        <div className="mt-4 rounded-2xl bg-cobalto text-papel p-4">
          <p className="text-[13px] font-semibold text-cobalto-2">Ahora</p>
          <p className="mt-0.5 font-semibold leading-snug">Subir precios en los 4 productos bajo el margen mínimo</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] text-[#6f737c]">Margen mensual</p>
            <p className="font-titulo font-semibold text-[40px] leading-none tabular-nums">11%</p>
          </div>
          <p className="text-[14px] text-[#6f737c] pb-1">Meta: 18%</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#eae9e3] overflow-hidden"><div className="h-full w-[42%] rounded-full bg-cobalto" /></div>
      </div>
    </div>
  );
}

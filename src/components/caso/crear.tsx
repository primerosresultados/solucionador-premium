"use client";

import { Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  IDEA_NO_HACER_NADA, MIN_IDEAS, MIN_IDEAS_PROPIAS_PARA_COPILOTO, ideasPropias, puntajeOpcion, type Opcion, type Riesgo, type Trabajo,
} from "@/lib/metodo";
import { Marco, type PropsMarco } from "./marco";
import { Campo, Copiloto, Sugerencia } from "./piezas";
import { usarTrabajo } from "./usar-trabajo";

type Props = PropsMarco & { inicial: Trabajo };

export function Etapa4({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  const [nueva, setNueva] = useState("");
  const agregar = (texto: string, origen: "persona" | "copiloto" = "persona") => {
    if (!texto.trim()) return;
    cambiar({ ideas: [...t.ideas, { id: crypto.randomUUID(), texto: texto.trim(), origen }] });
    setNueva("");
  };
  const propias = ideasPropias(t);
  const pct = Math.min(100, (t.ideas.length / MIN_IDEAS) * 100);
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="etiqueta">Llevas</p>
            <p className="font-titulo font-semibold text-[42px] leading-none tabular-nums">{t.ideas.length}<span className="text-tinta-3 text-[22px]"> de {MIN_IDEAS}</span></p>
          </div>
          <p className="text-[15px] text-tinta-2 text-right max-w-[15em]">{t.ideas.length < 10 ? "Sin juzgar. Lo absurdo también cuenta." : "Las mejores suelen llegar ahora."}</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-hundido overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-acento to-sol" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); agregar(nueva); }}>
          <input className="campo" aria-label="Nueva idea" placeholder="Podría…" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <button aria-label="Agregar idea" className="btn btn-1 !px-0 w-12 shrink-0"><Plus size={20} /></button>
        </form>
        <ol className="mt-3">
          {t.ideas.map((i, n) => (
            <motion.li key={i.id} layout="position" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-2 border-b border-hundido last:border-0">
              <span className="w-6 text-right text-[14px] text-tinta-3 tabular-nums shrink-0">{n + 1}</span>
              <span className="flex-1 min-w-0 leading-snug">{i.texto}</span>
              {i.origen !== "base" && <button type="button" aria-label="Quitar idea" className="btn btn-3 !min-h-9 !px-2" onClick={() => cambiar({ ideas: t.ideas.filter((x) => x.id !== i.id) })}><X size={16} /></button>}
            </motion.li>
          ))}
        </ol>
      </section>
      <section className="tarjeta">
        <Campo etiqueta="Sabiendo lo que hoy sabes, ¿volverías a empezar esto?" ayuda="Si la respuesta es no, salir también es una opción. Agrégala a la lista.">
          <textarea className="campo" rows={2} value={t.empezarDeCero} onChange={(e) => cambiar({ empezarDeCero: e.target.value })} />
        </Campo>
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="ideas" titulo="Ideas desde otros ángulos" boton={propias < MIN_IDEAS_PROPIAS_PARA_COPILOTO ? `Escribe ${MIN_IDEAS_PROPIAS_PARA_COPILOTO - propias} más para usar el copiloto` : "Agrega ideas nuevas"}
        inicial={t.copiloto.ideas} descripcion="Se suma después de tus primeras cinco: tus ideas abren el camino.">
        {(r) => <div className="space-y-2">{r.ideas.map((i) => (
          <Sugerencia key={i.texto} texto={i.texto} detalle={i.angulo} agregada={t.ideas.some((x) => x.texto === i.texto)} alAgregar={() => agregar(i.texto, "copiloto")} />
        ))}</div>}
      </Copiloto>
    </Marco>
  );
}

export function Etapa5({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  const elegidas = new Set(t.opciones.map((o) => o.ideaId));
  const alternar = (ideaId: string) => {
    if (elegidas.has(ideaId)) cambiar({ opciones: t.opciones.filter((o) => o.ideaId !== ideaId), decisionIdeaId: t.decisionIdeaId === ideaId ? null : t.decisionIdeaId });
    else if (t.opciones.length < 5) cambiar({ opciones: [...t.opciones, { ideaId, notas: {}, favor: "", contra: "" }] });
  };
  const nota = (o: Opcion, criterio: string, v: number) =>
    cambiar({ opciones: t.opciones.map((x) => (x.ideaId === o.ideaId ? { ...x, notas: { ...x.notas, [criterio]: v } } : x)) });
  const orden = [...t.opciones].sort((a, b) => puntajeOpcion(b, t.criterios) - puntajeOpcion(a, t.criterios));
  const texto = (id: string) => t.ideas.find((i) => i.id === id)?.texto ?? "";

  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta">
        <h2 className="font-titulo font-semibold text-[20px]">Elige entre 3 y 5 finalistas</h2>
        <p className="text-[15px] text-tinta-2 mt-0.5">Compáralas también contra no hacer nada.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {t.ideas.map((i) => (
            <li key={i.id} className="max-w-full">
              <button type="button" aria-pressed={elegidas.has(i.id)} onClick={() => alternar(i.id)}
                className={`text-left rounded-2xl px-3 py-2.5 min-h-11 max-w-full text-[15px] leading-snug ${elegidas.has(i.id) ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>{i.texto}</button>
            </li>
          ))}
        </ul>
      </section>

      {orden.map((o) => (
        <motion.section layout="position" key={o.ideaId} className={`tarjeta ${t.decisionIdeaId === o.ideaId ? "outline-2 outline-acento" : ""}`}>
          <div className="flex items-start gap-3">
            <h3 className="flex-1 min-w-0 font-sans tracking-normal font-semibold text-[17px] leading-snug">{texto(o.ideaId)}</h3>
            <p className="font-titulo font-semibold text-[34px] leading-none tracking-[-.03em] tabular-nums" aria-label={`Puntaje ${puntajeOpcion(o, t.criterios)} de 100`}>{puntajeOpcion(o, t.criterios)}</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-hundido overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-acento to-luz" animate={{ width: `${puntajeOpcion(o, t.criterios)}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
          </div>
          <div className="mt-4 space-y-3">
            {t.criterios.map((c) => (
              <fieldset key={c.id}>
                <legend className="text-[15px] text-tinta-2 mb-1">{c.nombre}</legend>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button type="button" key={v} aria-label={`${c.nombre}: ${v} de 5`} aria-pressed={o.notas[c.id] === v} onClick={() => nota(o, c.id, v)}
                      className={`h-11 rounded-xl font-semibold tabular-nums ${o.notas[c.id] === v ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>{v}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <button type="button" onClick={() => cambiar({ decisionIdeaId: o.ideaId })} className={`btn w-full mt-4 ${t.decisionIdeaId === o.ideaId ? "btn-1" : "btn-2"}`}>
            {t.decisionIdeaId === o.ideaId ? "Esta es mi decisión" : "Elegir esta"}
          </button>
        </motion.section>
      ))}

      {t.decisionIdeaId && (
        <>
          <section className="tarjeta">
            <Campo etiqueta="¿Por qué esta?" ayuda="Decidir con información incompleta es normal. No decidir también tiene costo.">
              <textarea className="campo" rows={3} value={t.razonDecision} onChange={(e) => cambiar({ razonDecision: e.target.value })} />
            </Campo>
          </section>
          <Copiloto casoId={m.casoId} antes={vaciar} tarea="desafiar" titulo="Abogado del diablo" boton="Pon a prueba mi decisión" inicial={t.copiloto.desafiar}
            descripcion="Busca el supuesto que podría tumbarla, antes de que te cueste caro.">
            {(r) => (
              <>
                <ul className="list-disc pl-5 space-y-1">{r.debilidades.map((d) => <li key={d}>{d}</li>)}</ul>
                <div><p className="etiqueta">Supuesto crítico</p><p className="mt-1 font-semibold">{r.supuesto_critico}</p></div>
                <div><p className="etiqueta">Pruébalo barato</p><p className="mt-1">{r.como_probarlo}</p></div>
                <div><p className="etiqueta">Cómo fortalecerla</p><p className="mt-1">{r.mejora}</p></div>
              </>
            )}
          </Copiloto>
        </>
      )}
    </Marco>
  );
}

export function Etapa6({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  const riesgo = (id: string, c: Partial<Riesgo>) => cambiar({ riesgos: t.riesgos.map((r) => (r.id === id ? { ...r, ...c } : r)) });
  const decision = t.ideas.find((i) => i.id === t.decisionIdeaId)?.texto;
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      {decision && <section className="rounded-[var(--radius-tarjeta)] bg-acento-suave p-5"><p className="etiqueta !text-acento">Tu decisión</p><p className="mt-1 font-semibold text-[18px] leading-snug">{decision}</p></section>}
      <section className="tarjeta space-y-4">
        <h2 className="font-titulo font-semibold text-[20px]">¿Qué podría salir mal?</h2>
        {t.riesgos.map((r) => (
          <article key={r.id} className="rounded-2xl bg-hundido p-3 space-y-2">
            <div className="flex gap-2">
              <input className="campo !bg-superficie" aria-label="Riesgo" placeholder="Lo que podría salir mal" value={r.texto} onChange={(e) => riesgo(r.id, { texto: e.target.value })} />
              <button type="button" aria-label="Quitar riesgo" className="btn btn-3 !px-2 shrink-0" onClick={() => cambiar({ riesgos: t.riesgos.filter((x) => x.id !== r.id) })}><X size={18} /></button>
            </div>
            <input className="campo !bg-superficie" aria-label="Señal temprana" placeholder="La primera señal sería…" value={r.senal} onChange={(e) => riesgo(r.id, { senal: e.target.value })} />
            <input className="campo !bg-superficie" aria-label="Respuesta" placeholder="Si pasa, voy a…" value={r.respuesta} onChange={(e) => riesgo(r.id, { respuesta: e.target.value })} />
          </article>
        ))}
        <button type="button" className="btn btn-2 btn-chico" onClick={() => cambiar({ riesgos: [...t.riesgos, { id: crypto.randomUUID(), texto: "", senal: "", respuesta: "" }] })}><Plus size={18} /> Agregar riesgo</button>
      </section>
      <section className="tarjeta space-y-4">
        <Campo etiqueta="Tu plan B" ayuda="Lo que harás si esto no funciona.">
          <textarea className="campo" rows={3} value={t.planB} onChange={(e) => cambiar({ planB: e.target.value })} />
        </Campo>
        <Campo etiqueta="¿Qué señal objetiva lo activa?" ayuda="Con número y fecha. Así no decides con la emoción del momento.">
          <input className="campo" value={t.disparadorPlanB} onChange={(e) => cambiar({ disparadorPlanB: e.target.value })} />
        </Campo>
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="premortem" titulo="Imagina que ya falló" boton="Hazme el análisis" inicial={t.copiloto.premortem}
        descripcion="Se para seis meses adelante, con la solución fracasada, y cuenta qué pasó.">
        {(r) => (
          <>
            <div className="space-y-2">{r.riesgos.map((x) => (
              <Sugerencia key={x.texto} texto={x.texto} detalle={`Señal: ${x.senal}. Respuesta: ${x.respuesta}`} agregada={t.riesgos.some((y) => y.texto === x.texto)}
                alAgregar={() => cambiar({ riesgos: [...t.riesgos, { id: crypto.randomUUID(), ...x }] })} />
            ))}</div>
            <Sugerencia texto={r.plan_b} detalle="Plan B propuesto" agregada={t.planB === r.plan_b} alAgregar={() => cambiar({ planB: r.plan_b })} />
            <Sugerencia texto={r.disparador} detalle="Señal que lo activa" agregada={t.disparadorPlanB === r.disparador} alAgregar={() => cambiar({ disparadorPlanB: r.disparador })} />
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

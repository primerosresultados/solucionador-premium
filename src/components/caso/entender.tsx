"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { Causa, Trabajo } from "@/lib/metodo";
import { MIN_DEFINICIONES } from "@/lib/metodo";
import { Marco, type PropsMarco } from "./marco";
import { Campo, Copiloto, Dictar, ListaTextos, Sugerencia } from "./piezas";
import { usarTrabajo } from "./usar-trabajo";

type Props = PropsMarco & { inicial: Trabajo };

export function Etapa1({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta space-y-5">
        <Campo etiqueta="Cuéntalo como te salga" ayuda="Sácalo de la cabeza y déjalo por escrito. Eso ya es parte de resolverlo.">
          <textarea className="campo" rows={6} value={t.relato} onChange={(e) => cambiar({ relato: e.target.value })} />
        </Campo>
        <Dictar alTexto={(x) => cambiar({ relato: `${t.relato} ${x}`.trim() })} />
        <Campo etiqueta="Dilo como una situación" ayuda="Una frase neutra, sin culpables. No es «un desastre»: es algo que está pasando y tiene salida.">
          <textarea className="campo" rows={2} value={t.situacion} onChange={(e) => cambiar({ situacion: e.target.value })} />
        </Campo>
        <Campo etiqueta="¿Qué pierdes si esto sigue igual un año más?">
          <textarea className="campo" rows={3} value={t.importancia} onChange={(e) => cambiar({ importancia: e.target.value })} />
        </Campo>
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="encuadrar" titulo="Encuadre del copiloto" boton="Ayúdame a encuadrarlo" inicial={t.copiloto.encuadrar}
        descripcion="Lee tu relato y te devuelve la situación en limpio, con otras formas de verla.">
        {(r) => (
          <>
            <Sugerencia texto={r.situacion_neutra} alAgregar={() => cambiar({ situacion: r.situacion_neutra })} agregada={t.situacion === r.situacion_neutra} />
            <div><p className="etiqueta mb-2">Otras formas de leerlo</p><ul className="list-disc pl-5 space-y-1 text-tinta-2">{r.lecturas.map((l) => <li key={l}>{l}</li>)}</ul></div>
            <div><p className="etiqueta mb-2">Preguntas para ti</p><ul className="list-disc pl-5 space-y-1 text-tinta-2">{r.preguntas.map((l) => <li key={l}>{l}</li>)}</ul></div>
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

export function Etapa2({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  const defs = t.definiciones.length ? t.definiciones : t.situacion ? [t.situacion] : [""];
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta space-y-5">
        <Campo etiqueta="¿Qué es exactamente? ¿Y qué más podría ser?" ayuda={`Escribe al menos ${MIN_DEFINICIONES} definiciones distintas. Desconfía de la primera: rara vez es la correcta.`}>
          <span className="block" />
        </Campo>
        <ListaTextos valores={defs} alCambiar={(v) => cambiar({ definiciones: v })} placeholder="El problema es…" agregar="Otra definición" />
        <div>
          <p className="font-semibold">¿Con cuál vas a trabajar?</p>
          <div className="mt-2 space-y-2">
            {defs.filter((d) => d.trim()).map((d) => (
              <label key={d} className={`flex gap-3 items-start rounded-2xl p-3 cursor-pointer ${t.definicionFinal === d ? "bg-acento-suave" : "bg-hundido"}`}>
                <input type="radio" name="definicion" className="mt-1 size-5 shrink-0 accent-[var(--color-acento)]" checked={t.definicionFinal === d} onChange={() => cambiar({ definicionFinal: d })} />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>
        <Campo etiqueta="Si mañana estuviera resuelto, ¿qué verías distinto?">
          <textarea className="campo" rows={3} value={t.comoSabre} onChange={(e) => cambiar({ comoSabre: e.target.value })} />
        </Campo>
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="definir" titulo="Pon a prueba tu definición" boton="Cuestiona mi definición" inicial={t.copiloto.definir}
        descripcion="Busca soluciones escondidas, culpables y síntomas disfrazados de problema.">
        {(r) => (
          <>
            <p className="leading-relaxed">{r.critica}</p>
            <div className="space-y-2">{r.definiciones.map((d) => (
              <Sugerencia key={d} texto={d} agregada={defs.includes(d)} alAgregar={() => cambiar({ definiciones: [...defs.filter((x) => x.trim()), d] })} />
            ))}</div>
            <Sugerencia texto={r.como_se_veria} detalle="Cómo se vería resuelto" agregada={t.comoSabre === r.como_se_veria} alAgregar={() => cambiar({ comoSabre: r.como_se_veria })} />
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

export function Etapa3({ inicial, ...m }: Props) {
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, inicial);
  const [nueva, setNueva] = useState("");
  const actualizar = (id: string, c: Partial<Causa>) => cambiar({ causas: t.causas.map((x) => (x.id === id ? { ...x, ...c } : x)) });
  const agregar = (texto: string, evidencia: Causa["evidencia"] = "suposicion") => {
    if (!texto.trim()) return;
    cambiar({ causas: [...t.causas, { id: crypto.randomUUID(), texto: texto.trim(), evidencia, porQue: [], esRaiz: false }] });
    setNueva("");
  };
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta space-y-4">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); agregar(nueva); }}>
          <input className="campo" aria-label="Nueva causa" placeholder="Esto ocurre porque…" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <button aria-label="Agregar causa" className="btn btn-1 !px-0 w-12 shrink-0"><Plus size={20} /></button>
        </form>
        {!t.causas.length && <p className="text-tinta-2">Empieza por lo evidente. Después pregúntate qué parte de esto depende de ti.</p>}
        {t.causas.map((c) => (
          <article key={c.id} className={`rounded-2xl p-4 ${c.esRaiz ? "bg-acento-suave" : "bg-hundido"}`}>
            <div className="flex gap-2 items-start">
              <p className="flex-1 min-w-0 font-semibold leading-snug">{c.texto}</p>
              <button type="button" aria-label="Quitar causa" className="btn btn-3 !min-h-9 !px-2 -mt-1 -mr-1" onClick={() => cambiar({ causas: t.causas.filter((x) => x.id !== c.id) })}><X size={18} /></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => actualizar(c.id, { evidencia: c.evidencia === "hecho" ? "suposicion" : "hecho" })} className="btn btn-chico bg-superficie">
                {c.evidencia === "hecho" ? "Es un hecho" : "Es una suposición"}
              </button>
              <button type="button" aria-pressed={c.esRaiz} onClick={() => cambiar({ causas: t.causas.map((x) => ({ ...x, esRaiz: x.id === c.id ? !x.esRaiz : x.esRaiz })) })}
                className={`btn btn-chico ${c.esRaiz ? "btn-1" : "bg-superficie"}`}>{c.esRaiz ? "Causa raíz" : "Marcar causa raíz"}</button>
            </div>
            {c.esRaiz && (
              <div className="mt-4">
                <p className="font-semibold mb-2">¿Y por qué pasa eso?</p>
                <ListaTextos valores={c.porQue.length ? c.porQue : [""]} alCambiar={(v) => actualizar(c.id, { porQue: v })} placeholder="Porque…" agregar="Otro «por qué»" />
              </div>
            )}
          </article>
        ))}
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="causas" titulo="Busca lo que no estás viendo" boton="Muéstrame otras causas" inicial={t.copiloto.causas}
        descripcion="Propone causas que no anotaste y cómo comprobar cada una esta semana.">
        {(r) => (
          <>
            <div className="space-y-2">{r.causas.map((c) => (
              <Sugerencia key={c.texto} texto={c.texto} detalle={`Para comprobarlo: ${c.como_verificar}`} agregada={t.causas.some((x) => x.texto === c.texto)} alAgregar={() => agregar(c.texto, c.tipo)} />
            ))}</div>
            <p className="font-semibold leading-relaxed">{r.pregunta_clave}</p>
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

"use client";

import { ArrowLeft, ArrowRight, ChevronDown, Pencil, Plus, Rocket, Sparkles, X } from "lucide-react";
import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { elegirCausa, elegirProblema, elegirSalida, empezarPlan, generar } from "@/app/app/acciones";
import { celebrar } from "@/components/movimiento/celebracion";
import { HiloLienzo } from "@/components/movimiento/hilo-lienzo";
import { CURVA } from "@/components/movimiento/piezas";
import { hoyChile, sumarDias } from "@/lib/fechas";
import type { Resultado } from "@/lib/ia/tareas";
import { PASOS, puntajeSalida, URGENCIAS, type Trabajo, type Urgencia } from "@/lib/metodo";
import { Alerta, ApoyoCuidado } from "./piezas";

type Propuesta = "diagnostico" | "salidas" | "ejecucion";

const MENSAJES: Record<Propuesta, string[]> = {
  diagnostico: ["Leyendo lo que contaste", "Separando hechos de suposiciones", "Buscando el problema de fondo", "Rastreando las causas probables", "Preparando tus opciones"],
  salidas: ["Pensando veinte salidas", "Atacando la causa desde otros ángulos", "Evaluando impacto y riesgo", "Quedándome con las mejores"],
  ejecucion: ["Definiendo cómo medir el resultado", "Ordenando los pasos", "Imaginando qué podría salir mal", "Preparando tu plan B", "Armando tu plan"],
};

function Generando({ tarea }: { tarea: Propuesta }) {
  const p = useMotionValue(0);
  const [i, setI] = useState(0);
  useEffect(() => {
    const c = animate(p, .82, { duration: 32, ease: "easeOut" });
    const t = setInterval(() => setI((x) => Math.min(x + 1, MENSAJES[tarea].length - 1)), 4200);
    return () => { c.stop(); clearInterval(t); };
  }, [p, tarea]);
  return (
    <section aria-busy="true" aria-live="polite" className="escena-noche relative overflow-hidden rounded-[var(--radius-tarjeta)] min-h-[420px] flex items-end p-6 sm:p-9">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[62%]"><HiloLienzo progreso={p} centro={.5} compacto /></div>
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}
            className="text-[24px] sm:text-[30px] font-semibold tracking-[-.025em] leading-tight">{MENSAJES[tarea][i]}…</motion.p>
        </AnimatePresence>
        <p className="mt-2 text-tinta-2">Puede tardar unos segundos. Tú no tienes que hacer nada.</p>
      </div>
    </section>
  );
}

/** Trae la propuesta de la IA al entrar: nadie tiene que apretar un botón para que trabaje. */
function usarPropuesta<T extends Propuesta>(casoId: string, tarea: T, inicial: unknown) {
  const [r, setR] = useState<Resultado<T> | null>((inicial as Resultado<T>) ?? null);
  const [cargando, setCargando] = useState(!inicial);
  const [error, setError] = useState("");
  const pedido = useRef(false);

  const pedir = useCallback(async (ajuste?: string) => {
    setCargando(true); setError("");
    const x = await generar(casoId, tarea, ajuste).catch(() => ({ ok: false as const, error: "No pudimos conectar. Tu caso quedó guardado." }));
    if (x.ok) setR(x.resultado as Resultado<T>); else setError(x.error);
    setCargando(false);
  }, [casoId, tarea]);

  useEffect(() => {
    if (inicial || pedido.current) return;
    pedido.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void pedir();
  }, [inicial, pedir]);

  return { r, cargando, error, pedir };
}

export type Marcos = { casoId: string; alcanzado: number; trabajo: Trabajo; relato: string };

function Encabezado({ paso }: { paso: number }) {
  const p = PASOS[paso - 1];
  return (
    <header>
      <h1 className="text-[32px] sm:text-[46px] leading-[1.06] tracking-[-.035em]">{p.pregunta}</h1>
      <p className="mt-2 text-[17px] sm:text-[19px] text-tinta-2">{p.ayuda}</p>
    </header>
  );
}

/** Lo que va quedando del caso. Da contexto y confirma que se está avanzando. */
function Resumen({ t }: { t: Trabajo }) {
  const causa = t.causas.find((c) => c.esRaiz)?.texto;
  const salida = t.ideas.find((i) => i.id === t.decisionIdeaId)?.texto;
  const filas: [string, string | undefined][] = [["Lo que contaste", t.relato], ["Problema", t.definicionFinal], ["Causa", causa], ["Salida", salida]];
  const contenido = (
    <dl className="space-y-3">
      {filas.filter(([, v]) => v).map(([e, v]) => (
        <div key={e}><dt className="text-[13px] font-medium text-tinta-3">{e}</dt><dd className="mt-0.5 text-[15px] leading-snug line-clamp-4">{v}</dd></div>
      ))}
    </dl>
  );
  return (
    <>
      <aside className="hidden lg:block sticky top-[132px] tarjeta !p-5" aria-label="Tu caso hasta ahora"><p className="font-semibold mb-3">Tu caso</p>{contenido}</aside>
      <details className="lg:hidden tarjeta !py-1 group">
        <summary className="min-h-11 flex items-center justify-between font-medium list-none">Tu caso hasta ahora<ChevronDown size={18} className="text-tinta-3 transition-transform group-open:rotate-180" /></summary>
        <div className="pb-3">{contenido}</div>
      </details>
    </>
  );
}

function Barra({ atras, children, nota }: { atras?: string; children: ReactNode; nota?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-lienzo/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="contenedor py-3 flex items-center gap-3">
        {atras && <Link href={atras} aria-label="Paso anterior" className="btn btn-2 !px-0 w-12 shrink-0"><ArrowLeft size={18} /></Link>}
        <div className="flex-1 min-w-0 text-[14px] text-tinta-2 truncate">{nota}</div>
        {children}
      </div>
    </div>
  );
}

function Marco({ paso, m, tarea, estado, atras, accion, nota, ajustable = true, children }: {
  paso: number; m: Marcos; tarea: Propuesta; estado: ReturnType<typeof usarPropuesta<Propuesta>>;
  atras?: string; accion: ReactNode | null; nota?: ReactNode; ajustable?: boolean; children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [ajuste, setAjuste] = useState("");
  const pedirAjuste = () => { void estado.pedir(ajuste.trim()); setAbierto(false); setAjuste(""); };
  return (
    <div className="pb-28 pt-5">
      <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0 space-y-5">
          <Encabezado paso={paso} />
          {estado.error && !estado.cargando && (
            <div className="space-y-3">
              <Alerta>{estado.error}</Alerta>
              {!estado.r && <button className="btn btn-1" onClick={() => void estado.pedir()}>Intentar de nuevo</button>}
            </div>
          )}
          {estado.cargando ? <Generando tarea={tarea} /> : estado.r && (
            <motion.div className="space-y-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, ease: CURVA }}>
              {(estado.r as { alerta_cuidado?: boolean }).alerta_cuidado && <ApoyoCuidado />}
              {children}
              {ajustable && (abierto ? (
                <div className="tarjeta !p-4 space-y-3">
                  <label className="block"><span className="font-medium">¿Qué me faltó?</span>
                    <textarea autoFocus rows={2} className="campo mt-2" value={ajuste} onChange={(e) => setAjuste(e.target.value)} placeholder="Cuéntame lo que no consideré y vuelvo a proponer" /></label>
                  <div className="flex gap-2"><button className="btn btn-1 btn-chico" disabled={ajuste.trim().length < 3} onClick={pedirAjuste}>Volver a proponer</button><button className="btn btn-3 btn-chico" onClick={() => setAbierto(false)}>Cancelar</button></div>
                </div>
              ) : <button className="btn btn-3 btn-chico !px-1" onClick={() => setAbierto(true)}><Sparkles size={16} /> Ninguna me calza</button>)}
            </motion.div>
          )}
        </div>
        <Resumen t={m.trabajo} />
      </div>
      {!estado.cargando && estado.r && accion && <Barra atras={atras} nota={nota}>{accion}</Barra>}
    </div>
  );
}

function Opcion({ activa, alElegir, titulo, detalle, marca, derecha, children }: {
  activa: boolean; alElegir: () => void; titulo: string; detalle?: string; marca?: string; derecha?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className={`rounded-[20px] transition-[box-shadow,background-color] duration-200 ${activa ? "bg-superficie shadow-[0_0_0_2px_var(--color-acento),0_18px_40px_-22px_var(--color-acento)]" : "bg-superficie shadow-suave hover:shadow-[0_0_0_1px_var(--color-acento),0_14px_34px_-20px_rgba(21,23,28,.3)]"}`}>
      <button type="button" role="radio" aria-checked={activa} onClick={alElegir} className="w-full text-left flex items-start gap-3.5 p-4 sm:p-5">
        <span aria-hidden className={`mt-0.5 size-[22px] flex-none rounded-full grid place-items-center transition-colors duration-150 ${activa ? "bg-acento" : "ring-2 ring-inset ring-tinta-3/40"}`}>
          {activa && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} className="size-2 rounded-full bg-acento-tinta" />}
        </span>
        <span className="flex-1 min-w-0">
          {marca && <span className="chip chip-acento !h-6 !px-2.5 !text-[12px] mb-1.5">{marca}</span>}
          <span className="block text-[17px] sm:text-[18px] font-semibold leading-snug tracking-[-.01em]">{titulo}</span>
          {detalle && <span className="block mt-1 text-[15px] leading-snug text-tinta-2">{detalle}</span>}
        </span>
        {derecha}
      </button>
      {children}
    </div>
  );
}

function OpcionPropia({ activa, alElegir, valor, alCambiar, texto }: { activa: boolean; alElegir: () => void; valor: string; alCambiar: (v: string) => void; texto: string }) {
  return (
    <div className={`rounded-[20px] transition-shadow duration-200 ${activa ? "bg-superficie shadow-[0_0_0_2px_var(--color-acento)]" : "ring-1 ring-inset ring-tinta-3/25"}`}>
      <button type="button" role="radio" aria-checked={activa} onClick={alElegir} className="w-full text-left flex items-center gap-3 p-4 sm:px-5 min-h-14 font-medium text-tinta-2"><Pencil size={17} aria-hidden /> {texto}</button>
      {activa && <div className="px-4 sm:px-5 pb-4"><textarea autoFocus rows={2} aria-label={texto} className="campo" value={valor} onChange={(e) => alCambiar(e.target.value)} /></div>}
    </div>
  );
}

function usarAvanzar(fn: () => Promise<{ ok: true; requierePago?: boolean } | { ok: false; error: string }>, m: Marcos, siguiente: string) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const avanzar = () => iniciar(async () => {
    setError("");
    const r = await fn().catch(() => ({ ok: false as const, error: "No pudimos guardar. Revisa tu conexión." }));
    if (!r.ok) { setError(r.error); return; }
    router.push(r.requierePago ? `/app/comprar?caso=${m.casoId}` : siguiente);
  });
  return { avanzar, pendiente, error };
}

const BotonSeguir = ({ alClic, pendiente, listo = true, children = "Continuar" }: { alClic: () => void; pendiente: boolean; listo?: boolean; children?: ReactNode }) => (
  <button className="btn btn-1 shrink-0" disabled={pendiente || !listo} onClick={alClic}>{pendiente ? "Un momento…" : <>{children} <ArrowRight size={18} /></>}</button>
);

export function PasoProblema(m: Marcos) {
  const estado = usarPropuesta(m.casoId, "diagnostico", m.trabajo.copiloto.diagnostico);
  const d = estado.r;
  const [eleccion, setEleccion] = useState<number | "propia" | null>(null);
  const [propia, setPropia] = useState("");
  const previa = m.trabajo.definicionFinal;
  const indice = eleccion ?? (d ? (previa ? (d.definiciones.findIndex((x) => x.texto === previa) + 1 || 1) - 1 : 0) : null);
  const texto = indice === "propia" ? propia : d && indice !== null ? d.definiciones[indice]?.texto ?? "" : "";
  const { avanzar, pendiente, error } = usarAvanzar(() => elegirProblema(m.casoId, texto), m, `/app/caso/${m.casoId}/2`);
  return (
    <Marco paso={1} m={m} tarea="diagnostico" estado={estado} nota={error ? <span className="text-mal">{error}</span> : undefined}
      accion={<BotonSeguir alClic={avanzar} pendiente={pendiente} listo={texto.trim().length >= 8} />}>
      {d && (
        <>
          {d.aclaracion && (
            <div className="tarjeta !p-4">
              <p className="font-medium">{d.aclaracion.pregunta}</p>
              <div className="mt-2 flex flex-wrap gap-2">{d.aclaracion.opciones.map((o) => <button key={o} className="btn btn-2 btn-chico" onClick={() => void estado.pedir(`${d.aclaracion!.pregunta} ${o}`)}>{o}</button>)}</div>
            </div>
          )}
          <div role="radiogroup" aria-label="Lecturas del problema" className="space-y-2.5">
            {d.definiciones.map((x, i) => <Opcion key={x.texto} activa={indice === i} alElegir={() => setEleccion(i)} titulo={x.texto} detalle={x.por_que} marca={i === 0 ? "La que más calza" : undefined} />)}
            <OpcionPropia activa={indice === "propia"} alElegir={() => setEleccion("propia")} valor={propia} alCambiar={setPropia} texto="Prefiero decirlo con mis palabras" />
          </div>
        </>
      )}
    </Marco>
  );
}

export function PasoCausa(m: Marcos) {
  const estado = usarPropuesta(m.casoId, "diagnostico", m.trabajo.copiloto.diagnostico);
  const d = estado.r;
  const previa = m.trabajo.causas.find((c) => c.esRaiz)?.texto;
  const [eleccion, setEleccion] = useState<number | "propia" | null>(null);
  const [propia, setPropia] = useState("");
  const indice = eleccion ?? (d ? Math.max(0, d.causas.findIndex((c) => c.texto === previa)) : null);
  const c = d && typeof indice === "number" ? d.causas[indice] : null;
  const { avanzar, pendiente, error } = usarAvanzar(
    () => elegirCausa(m.casoId, indice === "propia" ? { texto: propia, tipo: "suposicion", porQue: [] } : { texto: c!.texto, tipo: c!.tipo, porQue: c!.por_que }),
    m, `/app/caso/${m.casoId}/3`);
  return (
    <Marco paso={2} m={m} tarea="diagnostico" estado={estado} atras={`/app/caso/${m.casoId}/1`} nota={error ? <span className="text-mal">{error}</span> : undefined}
      accion={<BotonSeguir alClic={avanzar} pendiente={pendiente} listo={indice === "propia" ? propia.trim().length >= 5 : !!c}>Ver mis salidas</BotonSeguir>}>
      {d && (
        <div role="radiogroup" aria-label="Causas posibles" className="space-y-2.5">
          {d.causas.map((x, i) => (
            <Opcion key={x.texto} activa={indice === i} alElegir={() => setEleccion(i)} titulo={x.texto} marca={i === 0 ? "La más probable" : undefined}
              derecha={<span className="chip chip-neutro !h-6 !px-2.5 !text-[12px] shrink-0">{x.tipo === "hecho" ? "Lo dijiste" : "Por comprobar"}</span>}>
              <AnimatePresence initial={false}>
                {indice === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} className="overflow-hidden">
                    <div className="px-4 sm:px-5 pb-4 pl-[50px] sm:pl-[56px] text-[15px] text-tinta-2 space-y-1">
                      {x.por_que.map((p) => <p key={p}>¿Por qué? {p}</p>)}
                      <p className="pt-1 text-tinta"><strong className="font-medium">Compruébalo:</strong> {x.como_verificar}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Opcion>
          ))}
          <OpcionPropia activa={indice === "propia"} alElegir={() => setEleccion("propia")} valor={propia} alCambiar={setPropia} texto="Creo que es otra cosa" />
        </div>
      )}
    </Marco>
  );
}

export function PasoSalida(m: Marcos) {
  const estado = usarPropuesta(m.casoId, "salidas", m.trabajo.copiloto.salidas);
  const d = estado.r;
  const previa = m.trabajo.ideas.find((i) => i.id === m.trabajo.decisionIdeaId)?.texto;
  const finalistas = useMemo(() => d?.finalistas.map((f) => ({ ...f, texto: d.ideas[f.idea - 1]?.texto ?? "", puntaje: puntajeSalida(f) })).filter((f) => f.texto) ?? [], [d]);
  const [eleccion, setEleccion] = useState<string | null>(null);
  const [propia, setPropia] = useState("");
  const [todas, setTodas] = useState(false);
  const elegida = eleccion ?? previa ?? finalistas[0]?.texto ?? null;
  const esPropia = elegida === "__propia";
  const f = finalistas.find((x) => x.texto === elegida);
  const texto = esPropia ? propia : elegida ?? "";
  const { avanzar, pendiente, error } = usarAvanzar(
    () => elegirSalida(m.casoId, { texto, razon: f ? f.por_que : "La elegí yo.", ideas: d?.ideas.map((i) => i.texto) ?? [] }), m, `/app/caso/${m.casoId}/4`);
  return (
    <Marco paso={3} m={m} tarea="salidas" estado={estado} atras={`/app/caso/${m.casoId}/2`} nota={error ? <span className="text-mal">{error}</span> : undefined}
      accion={<BotonSeguir alClic={avanzar} pendiente={pendiente} listo={texto.trim().length >= 5}>Armar mi plan</BotonSeguir>}>
      {d && (
        <>
          <div role="radiogroup" aria-label="Salidas" className="space-y-2.5">
            {finalistas.map((x, i) => (
              <Opcion key={x.texto} activa={elegida === x.texto} alElegir={() => setEleccion(x.texto)} titulo={x.texto} detalle={x.por_que} marca={i === 0 ? "La mejor para tu caso" : undefined}
                derecha={<span className="shrink-0 text-right"><span className="block text-[26px] font-semibold leading-none tracking-[-.03em] tabular-nums">{x.puntaje}</span><span className="block text-[12px] text-tinta-3">de 100</span></span>}>
                {elegida === x.texto && <p className="px-4 sm:px-5 pb-4 pl-[50px] sm:pl-[56px] text-[15px] text-tinta-2"><strong className="font-medium text-tinta">Lo malo:</strong> {x.contra}</p>}
              </Opcion>
            ))}
            {todas && d.ideas.filter((i) => !finalistas.some((x) => x.texto === i.texto)).map((i) => (
              <Opcion key={i.texto} activa={elegida === i.texto} alElegir={() => setEleccion(i.texto)} titulo={i.texto} detalle={i.angulo} />
            ))}
            <OpcionPropia activa={esPropia} alElegir={() => setEleccion("__propia")} valor={propia} alCambiar={setPropia} texto="Tengo otra idea" />
          </div>
          {!todas && <button className="btn btn-2 btn-chico" onClick={() => setTodas(true)}>Ver las {d.ideas.length} ideas</button>}
          <p className="text-[15px] text-tinta-2 leading-relaxed"><strong className="font-medium text-tinta">Antes de jugártela:</strong> {d.supuesto_critico} {d.como_probarlo}</p>
        </>
      )}
    </Marco>
  );
}

type PasoEdit = { titulo: string; criterioHecho: string; prioridad: "A" | "B" | "C" | "D"; venceEn: string; depende: number | null; activo: boolean };

export function PasoPlan({ urgencia, ...m }: Marcos & { urgencia: string }) {
  const estado = usarPropuesta(m.casoId, "ejecucion", m.trabajo.copiloto.ejecucion);
  return (
    <Marco paso={4} m={m} tarea="ejecucion" estado={estado} ajustable={false} accion={null}>
      {estado.r && <Plan key={JSON.stringify(estado.r).length} m={m} e={estado.r} urgencia={urgencia} />}
    </Marco>
  );
}

function Plan({ m, e, urgencia }: { m: Marcos; e: Resultado<"ejecucion">; urgencia: string }) {
  const router = useRouter();
  const hoy = hoyChile();
  const [meta, setMeta] = useState({ indicador: e.indicador, unidad: e.unidad, hoy: e.hoy?.toString() ?? "", objetivo: e.objetivo?.toString() ?? "", fecha: sumarDias(hoy, Math.max(7, Math.round(e.plazo_dias))) });
  const [lista, setLista] = useState<PasoEdit[]>(e.pasos.map((p) => ({ titulo: p.titulo, criterioHecho: p.criterio_hecho, prioridad: p.prioridad, venceEn: sumarDias(hoy, Math.max(1, Math.round(p.dias_desde_hoy))), depende: p.depende_del_paso, activo: true })));
  const [compromiso, setCompromiso] = useState(e.compromiso);
  const [ritmo, setRitmo] = useState<number>(URGENCIAS[urgencia as Urgencia]?.ritmoDias ?? 7);
  const [comp, setComp] = useState({ nombre: "", email: "" });
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const set = (c: Partial<typeof meta>) => setMeta((x) => ({ ...x, ...c }));
  const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));
  const faltaHoy = meta.hoy.trim() === "";

  const empezar = () => iniciar(async () => {
    setError("");
    const activos = lista.map((p, i) => ({ p, i })).filter((x) => x.p.activo);
    const nuevoIndice = new Map(activos.map((x, n) => [x.i + 1, n + 1]));
    const r = await empezarPlan(m.casoId, {
      indicador: meta.indicador, unidad: meta.unidad, lineaBase: num(meta.hoy), objetivo: num(meta.objetivo), fechaObjetivo: meta.fecha,
      pasos: activos.map(({ p }) => ({ titulo: p.titulo, criterioHecho: p.criterioHecho, prioridad: p.prioridad, venceEn: p.venceEn, depende: p.depende ? nuevoIndice.get(p.depende) ?? null : null })),
      compromiso, ritmoDias: ritmo, companeroNombre: comp.nombre, companeroEmail: comp.email,
    }).catch(() => ({ ok: false as const, error: "No pudimos guardar. Revisa tu conexión." }));
    if (!r.ok) { setError(r.error); return; }
    celebrar("Tu plan está en marcha", "Vamos paso a paso");
    router.push(`/app/caso/${m.casoId}/seguimiento`);
  });

  return (
    <>
      <section className="tarjeta" aria-label="Tu meta">
        <h2 className="text-[20px]">Tu meta</h2>
        <label className="mt-3 block"><span className="text-[14px] font-medium text-tinta-2">Lo que vamos a medir</span>
          <input className="campo mt-1" value={meta.indicador} onChange={(x) => set({ indicador: x.target.value })} /></label>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block"><span className={`text-[14px] font-medium ${faltaHoy ? "text-acento" : "text-tinta-2"}`}>{faltaHoy ? "¿Cuánto es hoy?" : "Hoy"}</span>
            <input className={`campo mt-1 ${faltaHoy ? "!outline-acento" : ""}`} inputMode="decimal" value={meta.hoy} onChange={(x) => set({ hoy: x.target.value })} /></label>
          <label className="block"><span className="text-[14px] font-medium text-tinta-2">Objetivo</span>
            <input className="campo mt-1" inputMode="decimal" value={meta.objetivo} onChange={(x) => set({ objetivo: x.target.value })} /></label>
          <label className="block"><span className="text-[14px] font-medium text-tinta-2">Unidad</span>
            <input className="campo mt-1" value={meta.unidad} onChange={(x) => set({ unidad: x.target.value })} /></label>
          <label className="block"><span className="text-[14px] font-medium text-tinta-2">Fecha</span>
            <input className="campo mt-1" type="date" min={sumarDias(hoy, 1)} value={meta.fecha} onChange={(x) => set({ fecha: x.target.value })} /></label>
        </div>
      </section>

      <section className="tarjeta" aria-label="Tus pasos">
        <h2 className="text-[20px]">Tus pasos</h2>
        <p className="mt-0.5 text-[15px] text-tinta-2">{e.estrategia}</p>
        <ol className="mt-3">
          {lista.map((p, i) => (
            <li key={i} className={`flex items-start gap-3 py-2.5 border-b border-hundido last:border-0 transition-opacity ${p.activo ? "" : "opacity-45"}`}>
              <span className={`prioridad prioridad-${p.prioridad} mt-2`}>{p.prioridad}</span>
              <div className="flex-1 min-w-0">
                <textarea aria-label={`Paso ${i + 1}`} rows={1} className="block w-full resize-none [field-sizing:content] bg-transparent py-2 font-semibold leading-snug outline-none focus:underline decoration-acento underline-offset-4" value={p.titulo}
                  onChange={(x) => setLista((l) => l.map((y, j) => (j === i ? { ...y, titulo: x.target.value } : y)))} />
                <p className="text-[14px] text-tinta-2 leading-snug">{p.criterioHecho}</p>
              </div>
              <span className="text-[14px] text-tinta-3 tabular-nums shrink-0 pt-2.5">{new Date(`${p.venceEn}T12:00:00Z`).toLocaleDateString("es-CL", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "")}</span>
              <button type="button" aria-label={p.activo ? `Quitar: ${p.titulo}` : `Recuperar: ${p.titulo}`} className="size-11 -mr-2 grid place-items-center text-tinta-3" onClick={() => setLista((l) => l.map((y, j) => (j === i ? { ...y, activo: !y.activo } : y)))}>{p.activo ? <X size={17} /> : <Plus size={17} />}</button>
            </li>
          ))}
        </ol>
      </section>

      <details className="tarjeta !py-1 group">
        <summary className="min-h-12 flex items-center justify-between list-none"><span><span className="font-semibold">Si algo sale mal</span><span className="block text-[14px] text-tinta-2">Plan B y riesgos, ya preparados</span></span><ChevronDown size={18} className="text-tinta-3 transition-transform group-open:rotate-180" /></summary>
        <div className="pb-4 pt-1 space-y-3 text-[15px]">
          <p><strong className="font-medium">Plan B:</strong> {e.plan_b}</p>
          <p className="text-tinta-2"><strong className="font-medium text-tinta">Se activa si:</strong> {e.disparador}</p>
          <ul className="space-y-2">{e.riesgos.map((r) => <li key={r.texto}><strong className="font-medium">{r.texto}.</strong> <span className="text-tinta-2">Señal: {r.senal}. Respuesta: {r.respuesta}.</span></li>)}</ul>
        </div>
      </details>

      <section className="tarjeta" aria-label="Tu compromiso">
        <label className="block"><span className="font-semibold">Tu compromiso</span>
          <textarea rows={2} className="campo mt-2" value={compromiso} onChange={(x) => setCompromiso(x.target.value)} /></label>
        <fieldset className="mt-4">
          <legend className="font-medium">¿Cada cuánto revisamos?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([[3, "3 días"], [7, "Semanal"], [14, "Quincenal"]] as const).map(([v, x]) => (
              <button key={v} type="button" aria-pressed={ritmo === v} onClick={() => setRitmo(v)} className={`min-h-12 rounded-2xl font-medium transition-colors ${ritmo === v ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>{x}</button>
            ))}
          </div>
        </fieldset>
        <details className="mt-3 group/c">
          <summary className="min-h-11 flex items-center gap-2 list-none font-medium text-tinta-2"><Plus size={16} className="group-open/c:rotate-45 transition-transform" /> Sumar un compañero que vea mi avance (opcional)</summary>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <label className="block"><span className="text-[14px] font-medium text-tinta-2">Nombre</span><input className="campo mt-1" value={comp.nombre} onChange={(x) => setComp((c) => ({ ...c, nombre: x.target.value }))} /></label>
            <label className="block"><span className="text-[14px] font-medium text-tinta-2">Correo</span><input className="campo mt-1" type="email" value={comp.email} onChange={(x) => setComp((c) => ({ ...c, email: x.target.value }))} /></label>
          </div>
        </details>
      </section>

      {error && <Alerta tipo="ojo">{error}</Alerta>}
      <Barra atras={`/app/caso/${m.casoId}/3`} nota={<span className="hidden sm:inline">{lista.filter((p) => p.activo).length} pasos</span>}>
        <button className="btn btn-1 shrink-0" disabled={pendiente} onClick={empezar}><Rocket size={18} /> {pendiente ? "Empezando…" : "Empezar mi plan"}</button>
      </Barra>
    </>
  );
}

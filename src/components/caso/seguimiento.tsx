"use client";

import { ArrowRight, Ban, CalendarClock, CalendarPlus, Check, CircleCheck, Pause, Play, Plus, ShieldAlert, Trash2, Undo2, X } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  activarPlanB, agregarPaso, analizarRevision, cambiarPaso, marcarLogrado, pausar, registrarRevision, verificar, type Respuesta,
} from "@/app/app/acciones";
import type { Caso, Paso, Revision } from "@/lib/casos";
import { diasEntre, fechaCorta, fechaLarga, hoyChile, sumarDias } from "@/lib/fechas";
import type { Resultado } from "@/lib/ia/tareas";
import { ETIQUETA_SALUD, type Salud } from "@/lib/salud";
import { celebrar } from "@/components/movimiento/celebracion";
import { PanelHilo } from "@/components/movimiento/panel-hilo";
import { Contador, Medidor } from "@/components/movimiento/piezas";
import { FormPaso } from "./ejecutar";
import { GraficoIndicador } from "./grafico";
import { Alerta, ApoyoCuidado, Campo, Copiloto, Dictar } from "./piezas";

type Evento = { id: string; detalle: string; creadoEn: Date; tipo: string };

function Hoja({ titulo, alCerrar, children }: { titulo: string; alCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    document.addEventListener("keydown", esc);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = o; };
  }, [alCerrar]);
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/40 cursor-default" onClick={alCerrar} />
      <div className="hoja-subir relative w-full sm:max-w-[520px] max-h-[88dvh] overflow-y-auto bg-superficie rounded-t-[24px] sm:rounded-[24px] shadow-hoja p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-[22px] font-semibold leading-tight min-w-0">{titulo}</h2>
          <button aria-label="Cerrar" className="btn btn-2 !px-0 w-11 !min-h-11 shrink-0" onClick={alCerrar}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function usarAccion(alListo?: () => void, festejo?: { texto: string; detalle?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const correr = (f: () => Promise<Respuesta>) => iniciar(async () => {
    setError("");
    const r = await f().catch(() => ({ ok: false as const, error: "No pudimos guardar. Revisa tu conexión." }));
    if (!r.ok) { setError(r.error); return; }
    router.refresh();
    alListo?.();
    if (festejo) celebrar(festejo.texto, festejo.detalle);
  });
  return { error, pendiente, correr };
}

function HojaPaso({ casoId, paso, alCerrar }: { casoId: string; paso: Paso; alCerrar: () => void }) {
  const [modo, setModo] = useState<null | "hecho" | "bloquear" | "reprogramar" | "descartar">(null);
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState(paso.venceEn);
  const { error, pendiente, correr } = usarAccion(alCerrar, modo === "hecho" ? { texto: "Paso hecho", detalle: paso.titulo } : undefined);
  const accion = (c: Record<string, unknown>) => correr(() => cambiarPaso(casoId, paso.id, c));
  const hecho = paso.estado === "hecho";

  return (
    <Hoja titulo={paso.titulo} alCerrar={alCerrar}>
      <p className="etiqueta">Quedará hecho cuando</p>
      <p className="mt-1 mb-4">{paso.criterioHecho}</p>
      {paso.bloqueo && <div className="mb-4"><Alerta tipo="ojo"><strong>Bloqueado:</strong> {paso.bloqueo}</Alerta></div>}

      {!modo && !hecho && (
        <div className="space-y-2">
          <button className="btn btn-1 w-full" onClick={() => setModo("hecho")}><CircleCheck size={18} /> Marcar hecho</button>
          {paso.estado === "pendiente" && <button className="btn btn-2 w-full" disabled={pendiente} onClick={() => accion({ accion: "empezar" })}><Play size={18} /> Empezar</button>}
          {paso.estado === "bloqueado"
            ? <button className="btn btn-2 w-full" disabled={pendiente} onClick={() => accion({ accion: "desbloquear" })}><Undo2 size={18} /> Ya se destrabó</button>
            : <button className="btn btn-2 w-full" onClick={() => setModo("bloquear")}><Ban size={18} /> Estoy bloqueado</button>}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-2" onClick={() => setModo("reprogramar")}><CalendarClock size={18} /> Mover</button>
            <button className="btn btn-2" onClick={() => setModo("descartar")}><Trash2 size={18} /> Descartar</button>
          </div>
        </div>
      )}
      {!modo && hecho && <button className="btn btn-2 w-full" disabled={pendiente} onClick={() => accion({ accion: "reabrir" })}><Undo2 size={18} /> Reabrir</button>}

      {modo === "hecho" && <FormNota etiqueta="¿Qué quedó hecho? (opcional)" valor={nota} alCambiar={setNota} boton="Confirmar" pendiente={pendiente} alEnviar={() => accion({ accion: "hecho", evidencia: nota })} />}
      {modo === "bloquear" && <FormNota etiqueta="¿Qué lo está trabando?" valor={nota} alCambiar={setNota} boton="Guardar bloqueo" pendiente={pendiente} alEnviar={() => accion({ accion: "bloquear", motivo: nota })} />}
      {modo === "descartar" && <FormNota etiqueta="¿Por qué ya no hace falta?" valor={nota} alCambiar={setNota} boton="Descartar paso" pendiente={pendiente} alEnviar={() => accion({ accion: "descartar", motivo: nota })} />}
      {modo === "reprogramar" && (
        <div className="space-y-3">
          <Campo etiqueta="Nueva fecha"><input className="campo" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
          <FormNota etiqueta="¿Por qué cambia?" valor={nota} alCambiar={setNota} boton="Mover paso" pendiente={pendiente} alEnviar={() => accion({ accion: "reprogramar", fecha, motivo: nota })} />
          <p className="text-[14px] text-tinta-3">Tu calendario original no cambia: el atraso se sigue midiendo contra él.</p>
        </div>
      )}
      {error && <div className="mt-3"><Alerta tipo="ojo">{error}</Alerta></div>}

      {paso.estado === "bloqueado" && !modo && (
        <div className="mt-4 -mx-1">
          <Copiloto casoId={casoId} tarea="destrabar" titulo="Destrabar" boton="Ayúdame a destrabarlo" descripcion="Busca qué lo traba de verdad y lo más chico que puedes hacer hoy."
            extra={`Paso bloqueado: ${paso.titulo}. Motivo: ${paso.bloqueo ?? ""}`}>
            {(r) => (
              <>
                <p>{r.diagnostico}</p>
                <ul className="list-disc pl-5 space-y-1">{r.opciones.map((o) => <li key={o}>{o}</li>)}</ul>
                <div><p className="etiqueta">Hoy, en 15 minutos</p><p className="mt-1 font-semibold">{r.paso_minimo}</p></div>
              </>
            )}
          </Copiloto>
        </div>
      )}
    </Hoja>
  );
}

function FormNota({ etiqueta, valor, alCambiar, boton, pendiente, alEnviar }: {
  etiqueta: string; valor: string; alCambiar: (v: string) => void; boton: string; pendiente: boolean; alEnviar: () => void;
}) {
  return (
    <div className="space-y-3">
      <Campo etiqueta={etiqueta}><textarea className="campo" rows={3} value={valor} onChange={(e) => alCambiar(e.target.value)} /></Campo>
      <button className="btn btn-1 w-full" disabled={pendiente} onClick={alEnviar}>{pendiente ? "Guardando…" : boton}</button>
    </div>
  );
}

function HojaRevision({ caso, ultimo, alCerrar }: { caso: Caso; ultimo: number | null; alCerrar: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ valor: ultimo?.toString() ?? "", confianza: 0, avances: "", trabas: "", compromiso: "" });
  const [analisis, setAnalisis] = useState<Resultado<"revision"> | null>(null);
  const [aviso, setAviso] = useState("");
  const [fase, setFase] = useState<"form" | "pensando" | "listo">("form");
  const [error, setError] = useState("");
  const set = (c: Partial<typeof f>) => setF((x) => ({ ...x, ...c }));

  const enviar = async () => {
    setError("");
    if (!f.confianza) { setError("Marca tu nivel de confianza."); return; }
    const valor = f.valor.trim() === "" ? null : Number(f.valor.replace(",", "."));
    const r = await registrarRevision(caso.id, { ...f, valor });
    if (!r.ok) { setError(r.error); return; }
    setFase("pensando");
    const a = await analizarRevision(caso.id, r.revisionId).catch(() => null);
    if (a?.ok) setAnalisis(a.resultado); else setAviso(a?.error ?? "Tu revisión quedó guardada. El análisis no estuvo disponible.");
    setFase("listo");
    router.refresh();
  };

  return (
    <Hoja titulo={fase === "form" ? "Revisión" : "Tu revisión"} alCerrar={alCerrar}>
      {fase === "form" && (
        <div className="space-y-4">
          {caso.indicador && (
            <Campo etiqueta={caso.indicador} ayuda={`Medido hoy, en ${caso.unidad}`}>
              <input className="campo" inputMode="decimal" value={f.valor} onChange={(e) => set({ valor: e.target.value })} />
            </Campo>
          )}
          <fieldset>
            <legend className="font-semibold">¿Cuánta confianza tienes en lograrlo?</legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} type="button" aria-pressed={f.confianza === v} aria-label={`Confianza ${v} de 5`} onClick={() => set({ confianza: v })}
                  className={`h-12 rounded-xl font-semibold tabular-nums ${f.confianza === v ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>{v}</button>
              ))}
            </div>
          </fieldset>
          <Campo etiqueta="¿Qué pasó desde la última vez?"><textarea className="campo" rows={3} value={f.avances} onChange={(e) => set({ avances: e.target.value })} /></Campo>
          <Dictar alTexto={(t) => setF((x) => ({ ...x, avances: `${x.avances} ${t}`.trim() }))} />
          <Campo etiqueta="¿Qué te frenó?"><textarea className="campo" rows={2} value={f.trabas} onChange={(e) => set({ trabas: e.target.value })} /></Campo>
          <Campo etiqueta="¿A qué te comprometes de aquí a la próxima?"><input className="campo" value={f.compromiso} onChange={(e) => set({ compromiso: e.target.value })} /></Campo>
          {error && <Alerta tipo="ojo">{error}</Alerta>}
          <button className="btn btn-1 w-full" onClick={enviar}>Guardar y analizar</button>
        </div>
      )}
      {fase === "pensando" && (
        <div className="space-y-2" aria-busy="true"><p className="text-tinta-2 mb-3">Guardada. El copiloto está leyendo tus números…</p><div className="esqueleto h-5 w-3/4" /><div className="esqueleto h-5 w-full" /><div className="esqueleto h-5 w-2/3" /></div>
      )}
      {fase === "listo" && (
        <div className="space-y-4 aparecer">
          {aviso && <Alerta tipo="ojo">{aviso}</Alerta>}
          {analisis && <Analisis casoId={caso.id} r={analisis} />}
          <button className="btn btn-2 w-full" onClick={alCerrar}>Volver</button>
        </div>
      )}
    </Hoja>
  );
}

function Analisis({ casoId, r, existentes = [] }: { casoId: string; r: Resultado<"revision">; existentes?: string[] }) {
  const [agregados, setAgregados] = useState<string[]>(existentes);
  const router = useRouter();
  return (
    <>
      {r.alerta_cuidado && <ApoyoCuidado />}
      <p className="leading-relaxed">{r.lectura}</p>
      {r.patron && <div><p className="etiqueta">Lo que se repite</p><p className="mt-1">{r.patron}</p></div>}
      <div className="rounded-2xl bg-acento-suave p-4"><p className="etiqueta !text-acento">El ajuste</p><p className="mt-1 font-semibold">{r.ajuste}</p></div>
      <div><p className="etiqueta">Lo siguiente</p><p className="mt-1">{r.proximo_paso}</p></div>
      {r.pasos_sugeridos.map((p) => (
        <div key={p.titulo} className="flex items-start gap-3 rounded-2xl bg-hundido p-3">
          <div className="flex-1 min-w-0"><p className="leading-snug font-semibold">{p.titulo}</p><p className="text-[14px] text-tinta-2">{p.criterio_hecho}</p></div>
          <button className="btn btn-chico btn-1 !px-3 shrink-0" disabled={agregados.includes(p.titulo)} aria-label={`Agregar: ${p.titulo}`}
            onClick={async () => {
              const x = await agregarPaso(casoId, { titulo: p.titulo, criterioHecho: p.criterio_hecho, prioridad: p.prioridad, venceEn: sumarDias(hoyChile(), Math.max(1, Math.round(p.dias_desde_hoy))) });
              if (x.ok) { setAgregados((a) => [...a, p.titulo]); router.refresh(); }
            }}>{agregados.includes(p.titulo) ? <Check size={18} /> : <Plus size={18} />}</button>
        </div>
      ))}
    </>
  );
}

function FilaPaso({ paso, hoy, siguienteId, alAbrir }: { paso: Paso; hoy: string; siguienteId?: string; alAbrir: () => void }) {
  const hecho = paso.estado === "hecho";
  const descartado = paso.estado === "descartado";
  const vencido = !hecho && !descartado && paso.venceEn < hoy;
  return (
    <button onClick={alAbrir} className="group w-full text-left flex items-center gap-3 py-3 min-h-14 border-b border-hundido last:border-0 transition-transform duration-200 hover:translate-x-0.5">
      <span className={`marca transition-colors duration-200 ${hecho ? "bg-bien text-superficie" : "bg-hundido group-hover:bg-acento-suave"}`}>
        {hecho && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 16 }}><Check size={15} strokeWidth={3} /></motion.span>}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block leading-snug ${hecho || descartado ? "text-tinta-3 line-through" : "font-semibold"}`}>{paso.titulo}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-[14px] text-tinta-3 mt-0.5">
          <span className={vencido ? "text-mal font-semibold" : ""}>{vencido ? `Venció el ${fechaCorta(paso.venceEn)}` : fechaCorta(paso.venceEn)}</span>
          {paso.estado === "bloqueado" && <span className="text-ojo font-semibold">Bloqueado</span>}
          {paso.estado === "en_curso" && <span>En curso</span>}
          {paso.id === siguienteId && <span className="text-acento font-semibold">Lo siguiente</span>}
        </span>
      </span>
      <span className={`prioridad prioridad-${paso.prioridad}`}>{paso.prioridad}</span>
    </button>
  );
}

/** Fechas originales como inicio de cada barra: se ve de un vistazo qué se corrió. */
function LineaTiempo({ pasos, inicio, fin, hoy }: { pasos: Paso[]; inicio: string; fin: string; hoy: string }) {
  const ultima = pasos.reduce((m, p) => (p.venceEn > m ? p.venceEn : m), fin);
  const total = Math.max(1, diasEntre(inicio, ultima));
  const pos = (f: string) => Math.min(100, Math.max(0, (diasEntre(inicio, f) / total) * 100));
  return (
    <div className="relative pt-5">
      <div className="absolute top-0 bottom-0 w-px bg-acento" style={{ left: `${pos(hoy)}%` }} aria-hidden />
      <span className="absolute top-0 text-[12px] font-semibold text-acento -translate-x-1/2" style={{ left: `clamp(16px, ${pos(hoy)}%, calc(100% - 16px))` }}>Hoy</span>
      <ol className="space-y-3">
        {pasos.filter((p) => p.estado !== "descartado").map((p, i, l) => {
          const desde = i === 0 ? inicio : l[i - 1].venceOriginal < p.venceEn ? l[i - 1].venceOriginal : inicio;
          const izq = pos(desde), ancho = Math.max(2.5, pos(p.venceEn) - izq);
          return (
            <li key={p.id}>
              <p className="text-[14px] truncate">{p.titulo}</p>
              <div className="mt-1 h-3 rounded-full bg-hundido relative overflow-hidden">
                <div className={`absolute inset-y-0 rounded-full ${p.estado === "hecho" ? "bg-bien" : p.estado === "bloqueado" ? "bg-ojo" : p.venceEn < hoy ? "bg-mal" : "bg-acento"}`} style={{ left: `${izq}%`, width: `${ancho}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const unidadCorta = (v: number, u: string) => `${v.toLocaleString("es-CL")}${u === "%" ? "%" : ""}`;

export function Seguimiento({ caso, pasos, revisiones, eventos, salud, hoy, siguienteId }: {
  caso: Caso; pasos: Paso[]; revisiones: Revision[]; eventos: Evento[]; salud: Salud; hoy: string; siguienteId?: string;
}) {
  const [pasoAbierto, setPasoAbierto] = useState<string | null>(null);
  const [hoja, setHoja] = useState<null | "revision" | "paso">(null);
  const [vista, setVista] = useState<"lista" | "tiempo">("lista");
  const accion = usarAccion();

  const medidas = [...revisiones].filter((r) => r.valor !== null).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.creadoEn.getTime() - b.creadoEn.getTime());
  const actual = medidas.at(-1)?.valor ?? null;
  const enMarcha = caso.estado === "ejecucion";
  const abierto = pasos.find((p) => p.id === pasoAbierto);
  const cierre = caso.trabajo.copiloto.cierre as Resultado<"cierre"> | undefined;
  const ultimoAnalisis = revisiones.find((r) => r.analisis);

  const hacerAccion = () => {
    const a = salud.accion;
    if (a.tipo === "paso" || a.tipo === "destrabar") setPasoAbierto(a.pasoId);
    else if (a.tipo === "revision") setHoja("revision");
    else if (a.tipo === "plan_b") document.getElementById("plan-b")?.scrollIntoView({ behavior: "smooth" });
    else if (a.tipo === "cerrar") accion.correr(() => marcarLogrado(caso.id));
    else setHoja("paso");
  };

  return (
    <div className="pb-24 space-y-4">
      <header>
        <div className="flex items-center gap-2 flex-wrap">
          {enMarcha && <span className={`chip chip-${salud.estado}`}>{ETIQUETA_SALUD[salud.estado]}</span>}
          {caso.estado === "pausado" && <span className="chip chip-neutro">En pausa</span>}
          {caso.estado === "verificacion" && <span className="chip chip-acento">En verificación</span>}
          {caso.estado === "resuelto" && <span className="chip chip-en_ruta">Resuelto</span>}
          {caso.planBActivoEn && <span className="chip chip-atencion">Plan B activo</span>}
        </div>
        <h1 className="mt-3 text-[28px] sm:text-[36px] leading-[1.1] font-semibold">{caso.titulo}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {enMarcha ? (
          <section className="escena-noche relative overflow-hidden rounded-[var(--radius-tarjeta)] p-6 sm:p-8 min-h-[300px] flex flex-col justify-end shadow-[0_30px_70px_-34px_rgba(16,30,160,.9)]">
            <div aria-hidden className="absolute inset-x-0 top-0 h-[44%] opacity-90"><PanelHilo avance={Math.min(.92, .12 + salud.avancePasos / 100)} centro={.55} /></div>
            <div className="relative z-10">
              <p className="text-[14px] font-medium text-sol">Ahora</p>
              <p className="mt-1 font-semibold text-[25px] sm:text-[30px] leading-[1.12] tracking-[-.025em] max-w-[22em]">{salud.accion.texto}</p>
              <button onClick={hacerAccion} disabled={accion.pendiente} className="btn mt-4 w-full sm:w-auto bg-sol text-sol-tinta hover:-translate-y-px">
                {{ paso: "Abrir paso", destrabar: "Destrabar", revision: "Revisar ahora", plan_b: "Ver plan B", cerrar: "Marcar meta lograda", replanificar: "Agregar paso" }[salud.accion.tipo]} <ArrowRight size={18} />
              </button>
            </div>
          </section>
        ) : <div className="hidden" />}
        <section className={`tarjeta flex flex-col items-center justify-center ${enMarcha ? "" : "lg:col-span-2"}`}>
          <Medidor valor={salud.puntaje} etiqueta={enMarcha ? ETIQUETA_SALUD[salud.estado] : "Salud"} />
        </section>
      </div>
      {accion.error && <Alerta tipo="ojo">{accion.error}</Alerta>}

      {caso.estado === "pausado" && (
        <section className="tarjeta">
          <p>Este caso está en pausa. No recibirás recordatorios hasta retomarlo.</p>
          <button className="btn btn-1 mt-4" disabled={accion.pendiente} onClick={() => accion.correr(() => pausar(caso.id, false))}><Play size={18} /> Retomar</button>
        </section>
      )}

      {caso.estado === "verificacion" && caso.verificarEn && (
        <section className="tarjeta">
          <h2 className="text-[22px] font-semibold">Un problema está resuelto cuando no vuelve.</h2>
          <p className="mt-2 text-tinta-2">Lo verificamos el {fechaLarga(caso.verificarEn)}. Si antes vuelve a aparecer, avísalo y seguimos trabajando.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button className="btn btn-1" disabled={accion.pendiente || hoy < caso.verificarEn} onClick={() => accion.correr(() => verificar(caso.id, true))}>Sigue resuelto</button>
            <button className="btn btn-2" disabled={accion.pendiente} onClick={() => accion.correr(() => verificar(caso.id, false))}>Volvió a pasar</button>
          </div>
        </section>
      )}

      {caso.estado === "resuelto" && cierre && (
        <section className="tarjeta space-y-4">
          <h2 className="text-[22px] font-semibold">Lo que te llevas de este caso</h2>
          <p className="leading-relaxed">{cierre.resumen}</p>
          <div className="rounded-2xl bg-acento-suave p-4"><p className="etiqueta !text-acento">Tu regla</p><p className="mt-1 font-semibold">{cierre.regla}</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="etiqueta mb-1">Funcionó</p><ul className="list-disc pl-5 space-y-1">{cierre.funciono.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><p className="etiqueta mb-1">Señales de recaída</p><ul className="list-disc pl-5 space-y-1">{cierre.senales_recaida.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Dato etiqueta="Pasos" valor={<Contador valor={salud.avancePasos} sufijo="%" />} nota={`Debería ir en ${salud.avanceEsperado}%`} />
        <Dato etiqueta="Indicador" valor={actual !== null ? unidadCorta(actual, caso.unidad ?? "") : "Sin medir"} chico={actual === null}
          nota={caso.objetivo !== null ? `Meta: ${unidadCorta(caso.objetivo, caso.unidad ?? "")}${caso.unidad && caso.unidad !== "%" ? ` ${caso.unidad}` : ""}` : ""} />
        <div className="col-span-2 lg:col-span-1"><Dato etiqueta="Fecha límite" valor={caso.fechaObjetivo ? fechaCorta(caso.fechaObjetivo) : "—"} chico
          nota={salud.proyeccion ? `A tu ritmo: ${fechaCorta(salud.proyeccion)}` : "Aún sin ritmo"} /></div>
      </section>

      <div className="grid gap-4 items-start lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-4 min-w-0">

      <section className="tarjeta">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-semibold">Plan</h2>
          <div className="flex rounded-full bg-hundido p-1">
            {([["lista", "Lista"], ["tiempo", "Tiempo"]] as const).map(([v, t]) => (
              <button key={v} aria-pressed={vista === v} onClick={() => setVista(v)} className={`h-9 px-3 rounded-full text-[14px] font-semibold ${vista === v ? "bg-superficie shadow-suave" : "text-tinta-2"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          {vista === "lista"
            ? pasos.map((p) => <FilaPaso key={p.id} paso={p} hoy={hoy} siguienteId={siguienteId} alAbrir={() => setPasoAbierto(p.id)} />)
            : <LineaTiempo pasos={pasos} inicio={caso.fechaInicio ?? hoy} fin={caso.fechaObjetivo ?? hoy} hoy={hoy} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {enMarcha && <button className="btn btn-2 btn-chico" onClick={() => setHoja("paso")}><Plus size={18} /> Agregar paso</button>}
          {enMarcha && <a className="btn btn-2 btn-chico" href={`/api/caso/${caso.id}/calendario`}><CalendarPlus size={18} /> A mi calendario</a>}
        </div>
      </section>

      {ultimoAnalisis?.analisis && (
        <section className="tarjeta space-y-3">
          <div><h2 className="text-[20px] font-semibold">Última lectura del copiloto</h2><p className="text-[14px] text-tinta-3">{fechaLarga(ultimoAnalisis.fecha)}</p></div>
          <Analisis casoId={caso.id} r={ultimoAnalisis.analisis as unknown as Resultado<"revision">} existentes={pasos.map((p) => p.titulo)} />
        </section>
      )}

      <section className="tarjeta">
        <h2 className="text-[20px] font-semibold">Bitácora</h2>
        <ol className="mt-3 relative">
          <span aria-hidden className="absolute left-[4px] top-2 bottom-2 w-px bg-hundido" />
          {eventos.map((e) => (
            <li key={e.id} className="relative flex gap-3 pl-5 pb-3 last:pb-0">
              <span aria-hidden className="absolute left-0 top-[7px] size-[9px] rounded-full bg-acento ring-[3px] ring-superficie" />
              <time className="text-[14px] text-tinta-3 w-14 shrink-0 tabular-nums pt-px">{new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "America/Santiago" }).format(new Date(e.creadoEn)).replace(".", "")}</time>
              <span className="leading-snug">{e.detalle}</span>
            </li>
          ))}
        </ol>
      </section>

      </div>
      <div className="space-y-4 min-w-0 order-first lg:order-none lg:sticky lg:top-5">
      {caso.lineaBase !== null && caso.objetivo !== null && caso.fechaInicio && caso.fechaObjetivo && (
        <section className="tarjeta">
          <h2 className="text-[20px] font-semibold">{caso.indicador}</h2>
          <div className="mt-3">
            <GraficoIndicador base={caso.lineaBase} objetivo={caso.objetivo} inicio={caso.fechaInicio} fin={caso.fechaObjetivo} unidad={caso.unidad ?? ""}
              puntos={medidas.map((r) => ({ fecha: r.fecha, valor: r.valor! }))} />
          </div>
        </section>
      )}

      {salud.motivos.length > 0 && enMarcha && (
        <section className="tarjeta">
          <h2 className="text-[20px] font-semibold">Por qué vas así</h2>
          <ul className="mt-3 space-y-2">
            {salud.motivos.map((m) => (
              <li key={m.texto} className="flex gap-2.5 items-start">
                <span aria-hidden className={`mt-[7px] size-2.5 flex-none rounded-full ${{ bien: "bg-bien", ojo: "bg-ojo", mal: "bg-mal" }[m.peso]}`} />
                <span className="leading-snug">{m.texto}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {caso.trabajo.planB && (
        <section id="plan-b" className="tarjeta scroll-mt-4">
          <h2 className="text-[20px] font-semibold flex items-center gap-2"><ShieldAlert size={19} aria-hidden /> Plan B</h2>
          <p className="mt-2 leading-relaxed">{caso.trabajo.planB}</p>
          <p className="mt-2 text-[15px] text-tinta-2"><strong>Se activa si:</strong> {caso.trabajo.disparadorPlanB}</p>
          {salud.sugerirPlanB && <div className="mt-3"><Alerta tipo="ojo">Las señales indican que es momento de evaluarlo.</Alerta></div>}
          {enMarcha && !caso.planBActivoEn && <button className="btn btn-2 mt-4" disabled={accion.pendiente} onClick={() => accion.correr(() => activarPlanB(caso.id))}>Activar plan B</button>}
        </section>
      )}

      </div>
      </div>

      {enMarcha && (
        <>
          <button className="btn btn-3" disabled={accion.pendiente} onClick={() => accion.correr(() => pausar(caso.id, true))}><Pause size={16} /> Pausar este caso</button>
          <div className="fixed inset-x-0 bottom-0 z-20 bg-lienzo/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto max-w-[1160px] px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[14px] text-tinta-2 min-w-0 truncate">{caso.proximaRevision ? `Próxima revisión: ${fechaCorta(caso.proximaRevision)}` : ""}</p>
              <button className="btn btn-1" onClick={() => setHoja("revision")}>Hacer revisión</button>
            </div>
          </div>
        </>
      )}

      {abierto && <HojaPaso key={abierto.id} casoId={caso.id} paso={abierto} alCerrar={() => setPasoAbierto(null)} />}
      {hoja === "revision" && <HojaRevision caso={caso} ultimo={actual} alCerrar={() => setHoja(null)} />}
      {hoja === "paso" && <Hoja titulo="Nuevo paso" alCerrar={() => setHoja(null)}><FormPaso casoId={caso.id} pasos={pasos} alListo={() => setHoja(null)} /></Hoja>}
    </div>
  );
}

function Dato({ etiqueta, valor, nota, chico }: { etiqueta: string; valor: ReactNode; nota: string; chico?: boolean }) {
  return (
    <div className="tarjeta !p-5 h-full">
      <p className="text-[14px] font-medium text-tinta-3">{etiqueta}</p>
      <p className={`mt-1.5 font-semibold leading-none tracking-[-.03em] tabular-nums ${chico ? "text-[26px] py-1" : "text-[38px]"}`}>{valor}</p>
      <p className="mt-1 text-[14px] text-tinta-3 leading-snug">{nota}</p>
    </div>
  );
}

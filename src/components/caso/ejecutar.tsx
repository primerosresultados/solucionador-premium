"use client";

import { Plus, Rocket } from "lucide-react";
import { celebrar } from "@/components/movimiento/celebracion";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { agregarPaso, aplicarPlanCopiloto, firmarCompromiso, guardarMeta } from "@/app/app/acciones";
import type { Paso } from "@/lib/casos";
import { fechaCorta, hoyChile, sumarDias } from "@/lib/fechas";
import type { Trabajo } from "@/lib/metodo";
import { Marco, type PropsMarco } from "./marco";
import { Alerta, Campo, Copiloto, Sugerencia } from "./piezas";
import { usarTrabajo } from "./usar-trabajo";

export type MetaCaso = { indicador: string | null; unidad: string | null; lineaBase: number | null; objetivo: number | null; fechaObjetivo: string | null };
const aNumero = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));

export function Etapa7({ trabajo, meta, ...m }: PropsMarco & { trabajo: Trabajo; meta: MetaCaso }) {
  const router = useRouter();
  const [f, setF] = useState({
    indicador: meta.indicador ?? "", unidad: meta.unidad ?? "", lineaBase: meta.lineaBase?.toString() ?? "",
    objetivo: meta.objetivo?.toString() ?? "", fechaObjetivo: meta.fechaObjetivo ?? sumarDias(hoyChile(), 60),
  });
  const [error, setError] = useState("");
  const set = (c: Partial<typeof f>) => setF((x) => ({ ...x, ...c }));

  const guardar = async () => {
    setError("");
    const r = await guardarMeta(m.casoId, { ...f, lineaBase: aNumero(f.lineaBase), objetivo: aNumero(f.objetivo) });
    if (!r.ok) setError(r.error);
    else router.refresh();
    return r.ok;
  };

  return (
    <Marco {...m} antesDeAvanzar={guardar}>
      <section className="tarjeta space-y-4">
        <Campo etiqueta="¿Qué número te va a decir la verdad?" ayuda="Mide el resultado, no el esfuerzo. Si no hay número natural, usa una nota de 0 a 10 con un criterio fijo.">
          <input className="campo" placeholder="Ej: margen mensual del negocio" value={f.indicador} onChange={(e) => set({ indicador: e.target.value })} />
        </Campo>
        <Campo etiqueta="Unidad"><input className="campo" placeholder="%, pesos, horas…" value={f.unidad} onChange={(e) => set({ unidad: e.target.value })} /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Hoy"><input className="campo" inputMode="decimal" value={f.lineaBase} onChange={(e) => set({ lineaBase: e.target.value })} /></Campo>
          <Campo etiqueta="Objetivo"><input className="campo" inputMode="decimal" value={f.objetivo} onChange={(e) => set({ objetivo: e.target.value })} /></Campo>
        </div>
        <Campo etiqueta="Fecha límite"><input className="campo" type="date" min={sumarDias(hoyChile(), 1)} value={f.fechaObjetivo} onChange={(e) => set({ fechaObjetivo: e.target.value })} /></Campo>
        {error && <Alerta tipo="ojo">{error}</Alerta>}
      </section>
      <Copiloto casoId={m.casoId} tarea="meta" titulo="Encuentra tu indicador" boton="Propón un indicador" inicial={trabajo.copiloto.meta}
        descripcion="Busca el número que muestra si esto se está resolviendo de verdad.">
        {(r) => (
          <>
            <Sugerencia texto={`${r.indicador} (${r.unidad})`} detalle={`${r.razon} Cómo medirlo: ${r.como_medir}`}
              agregada={f.indicador === r.indicador}
              alAgregar={() => set({ indicador: r.indicador, unidad: r.unidad, fechaObjetivo: sumarDias(hoyChile(), Math.max(1, Math.round(r.plazo_dias))) })} />
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

export function FormPaso({ casoId, alListo, pasos = [] }: { casoId: string; alListo: () => void; pasos?: Paso[] }) {
  const [f, setF] = useState({ titulo: "", criterioHecho: "", prioridad: "B", venceEn: sumarDias(hoyChile(), 7), dependeDe: "" });
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const set = (c: Partial<typeof f>) => setF((x) => ({ ...x, ...c }));
  const enviar = () => iniciar(async () => {
    setError("");
    const r = await agregarPaso(casoId, { ...f, dependeDe: f.dependeDe || null });
    if (!r.ok) { setError(r.error); return; }
    setF({ titulo: "", criterioHecho: "", prioridad: "B", venceEn: f.venceEn, dependeDe: "" });
    alListo();
  });
  return (
    <div className="space-y-3">
      <Campo etiqueta="Paso"><input className="campo" placeholder="Empieza con un verbo" value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} /></Campo>
      <Campo etiqueta="¿Cómo sabrás que quedó hecho?"><input className="campo" value={f.criterioHecho} onChange={(e) => set({ criterioHecho: e.target.value })} /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Prioridad">
          <select className="campo" value={f.prioridad} onChange={(e) => set({ prioridad: e.target.value })}>
            <option value="A">A · Clave</option><option value="B">B · Importante</option><option value="C">C · Bueno tenerlo</option><option value="D">D · Delegar</option><option value="E">E · Eliminar</option>
          </select>
        </Campo>
        <Campo etiqueta="Vence"><input className="campo" type="date" value={f.venceEn} onChange={(e) => set({ venceEn: e.target.value })} /></Campo>
      </div>
      {pasos.length > 0 && (
        <Campo etiqueta="Depende de">
          <select className="campo" value={f.dependeDe} onChange={(e) => set({ dependeDe: e.target.value })}>
            <option value="">Ningún paso</option>
            {pasos.filter((p) => p.estado !== "descartado").map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </Campo>
      )}
      {error && <Alerta tipo="ojo">{error}</Alerta>}
      <button type="button" className="btn btn-1 w-full" disabled={pendiente} onClick={enviar}>{pendiente ? "Agregando…" : "Agregar paso"}</button>
    </div>
  );
}

export function Etapa8({ trabajo, pasos, ...m }: PropsMarco & { trabajo: Trabajo; pasos: Paso[] }) {
  const router = useRouter();
  const { trabajo: t, cambiar, guardado, vaciar } = usarTrabajo(m.casoId, trabajo);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  return (
    <Marco {...m} guardado={guardado} antesDeAvanzar={vaciar}>
      <section className="tarjeta">
        <Campo etiqueta="Tu estrategia, en un párrafo" ayuda="Antes de listar pasos: cómo vas a abordarlo y qué vas a dejar de hacer.">
          <textarea className="campo" rows={3} value={t.estrategia} onChange={(e) => cambiar({ estrategia: e.target.value })} />
        </Campo>
      </section>
      <section className="tarjeta">
        <h2 className="font-titulo font-semibold text-[20px]">Tus pasos</h2>
        <p className="text-[15px] text-tinta-2 mt-0.5">A es lo que tiene consecuencias serias si no se hace. El primero debe poder partir en 48 horas.</p>
        {pasos.length === 0 && <p className="mt-4 text-tinta-2">Aún no tienes pasos. Escríbelos tú o pide un borrador al copiloto.</p>}
        <ol className="mt-3">
          {pasos.map((p) => (
            <li key={p.id} className="flex gap-3 py-3 border-b border-hundido last:border-0">
              <span className={`prioridad prioridad-${p.prioridad}`}>{p.prioridad}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-snug">{p.titulo}</p>
                <p className="text-[14px] text-tinta-2 mt-0.5">{p.criterioHecho}</p>
              </div>
              <span className="text-[14px] text-tinta-3 tabular-nums shrink-0">{fechaCorta(p.venceEn)}</span>
            </li>
          ))}
        </ol>
        {abierto
          ? <div className="mt-4"><FormPaso casoId={m.casoId} pasos={pasos} alListo={() => router.refresh()} /></div>
          : <button type="button" className="btn btn-2 btn-chico mt-3" onClick={() => setAbierto(true)}><Plus size={18} /> Agregar paso</button>}
      </section>
      <Copiloto casoId={m.casoId} antes={vaciar} tarea="plan" titulo="Borrador del plan" boton="Arma un borrador" inicial={t.copiloto.plan}
        descripcion="Propone los pasos para llegar a tu meta, con prioridad y fechas.">
        {(r) => (
          <>
            <ol className="space-y-2">
              {r.pasos.map((p) => (
                <li key={p.titulo} className="flex gap-3 rounded-2xl bg-hundido p-3">
                  <span className={`prioridad prioridad-${p.prioridad} ${p.prioridad === "A" ? "" : "!bg-superficie"}`}>{p.prioridad}</span>
                  <div className="min-w-0"><p className="font-semibold leading-snug">{p.titulo}</p><p className="text-[14px] text-tinta-2">{p.criterio_hecho}</p></div>
                </li>
              ))}
            </ol>
            <div><p className="etiqueta">En las próximas 24 horas</p><p className="mt-1 font-semibold">{r.primer_movimiento}</p></div>
            {error && <Alerta tipo="ojo">{error}</Alerta>}
            {pasos.length === 0 && (
              <button type="button" className="btn btn-1 w-full" disabled={pendiente} onClick={() => iniciar(async () => {
                const x = await aplicarPlanCopiloto(m.casoId);
                if (!x.ok) setError(x.error); else router.refresh();
              })}>Usar este plan</button>
            )}
          </>
        )}
      </Copiloto>
    </Marco>
  );
}

export function Etapa9({ nombre, ritmoSugerido, ...m }: PropsMarco & { nombre: string; ritmoSugerido: number }) {
  const router = useRouter();
  const [f, setF] = useState({ responsable: nombre, compromiso: "", ritmoDias: ritmoSugerido, companeroNombre: "", companeroEmail: "" });
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const set = (c: Partial<typeof f>) => setF((x) => ({ ...x, ...c }));
  const firmar = () => iniciar(async () => {
    setError("");
    const r = await firmarCompromiso(m.casoId, f);
    if (!r.ok) { setError(r.error); return; }
    celebrar("Compromiso firmado", "Ahora empieza lo bueno");
    router.push(`/app/caso/${m.casoId}/seguimiento`);
  });
  return (
    <Marco {...m} accion={<button type="button" className="btn btn-1" disabled={pendiente} onClick={firmar}><Rocket size={18} /> {pendiente ? "Firmando…" : "Firmar y empezar"}</button>}>
      <section className="tarjeta space-y-4">
        <Campo etiqueta="¿Quién responde por esto?" ayuda="Si nadie responde, nadie lo hace."><input className="campo" value={f.responsable} onChange={(e) => set({ responsable: e.target.value })} /></Campo>
        <Campo etiqueta="Tu compromiso, con tus palabras">
          <textarea className="campo" rows={3} placeholder="Me hago cargo de…" value={f.compromiso} onChange={(e) => set({ compromiso: e.target.value })} />
        </Campo>
        <fieldset>
          <legend className="font-semibold">¿Cada cuánto revisas?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[[3, "3 días"], [7, "Semanal"], [14, "Quincenal"]].map(([v, t]) => (
              <button key={v} type="button" aria-pressed={f.ritmoDias === v} onClick={() => set({ ritmoDias: v as number })}
                className={`min-h-12 rounded-2xl font-semibold ${f.ritmoDias === v ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>{t}</button>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="tarjeta space-y-4">
        <div>
          <h2 className="font-titulo font-semibold text-[20px]">Compañero de compromiso</h2>
          <p className="text-[15px] text-tinta-2 mt-0.5">Opcional. Alguien de confianza verá el título del caso y tu avance general, nunca lo que escribiste, y recibirá un resumen los lunes.</p>
        </div>
        <Campo etiqueta="Nombre"><input className="campo" value={f.companeroNombre} onChange={(e) => set({ companeroNombre: e.target.value })} /></Campo>
        <Campo etiqueta="Correo"><input className="campo" type="email" value={f.companeroEmail} onChange={(e) => set({ companeroEmail: e.target.value })} /></Campo>
      </section>
      {error && <Alerta tipo="ojo">{error}</Alerta>}
    </Marco>
  );
}

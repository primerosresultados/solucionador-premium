import { NextResponse } from "next/server";
import { leerSesion } from "@/lib/auth";
import { casoDe, pasosDe } from "@/lib/casos";
import { calendarioIcs } from "@/lib/calendario";
import { appUrl } from "@/lib/marca";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await leerSesion();
  if (!s) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const { id } = await params;
  const caso = await casoDe(s.id, id);
  if (!caso) return NextResponse.json({ error: "no encontrado" }, { status: 404 });

  const url = `${appUrl()}/app/caso/${id}/seguimiento`;
  const pendientes = (await pasosDe(id)).filter((p) => p.estado !== "hecho" && p.estado !== "descartado" && p.prioridad !== "E");
  const ics = calendarioIcs([
    ...pendientes.map((p) => ({ id: p.id, fecha: p.venceEn, titulo: p.titulo, detalle: `Hecho cuando: ${p.criterioHecho}`, url })),
    ...(caso.proximaRevision ? [{ id: `revision-${id}`, fecha: caso.proximaRevision, titulo: `Revisión: ${caso.titulo}`, detalle: "Mide tu indicador y comprométete con lo siguiente.", url }] : []),
  ]);
  return new NextResponse(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="mi-plan.ics"' },
  });
}

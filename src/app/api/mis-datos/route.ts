import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { casos, eventos, ordenes, pasos, revisiones } from "@/db/schema";
import { leerSesion } from "@/lib/auth";

export async function GET() {
  const s = await leerSesion();
  if (!s) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const propios = await db.select().from(casos).where(eq(casos.usuarioId, s.id));
  const ids = propios.map((c) => c.id);
  const de = async <T,>(q: () => Promise<T[]>) => (ids.length ? q() : []);
  const datos = {
    cuenta: s,
    casos: propios.map(({ companeroToken: _token, ...c }) => c),
    pasos: await de(() => db.select().from(pasos).where(inArray(pasos.casoId, ids))),
    revisiones: await de(() => db.select().from(revisiones).where(inArray(revisiones.casoId, ids))),
    bitacora: await de(() => db.select().from(eventos).where(inArray(eventos.casoId, ids))),
    compras: (await db.select().from(ordenes).where(eq(ordenes.usuarioId, s.id))).map(({ flowToken: _f, ...o }) => o),
  };
  return new NextResponse(JSON.stringify(datos, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="mis-datos.json"' },
  });
}

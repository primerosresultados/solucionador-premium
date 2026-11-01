import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { correrSeguimiento } from "@/lib/casos";

function autorizado(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${secreto}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  // ?fecha= permite reprocesar un día que el cron no corrió.
  const fecha = new URL(req.url).searchParams.get("fecha");
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return NextResponse.json({ error: "fecha inválida" }, { status: 400 });
  return NextResponse.json(await correrSeguimiento(fecha ?? undefined));
}

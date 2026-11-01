import "server-only";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { envios } from "@/db/schema";
import { MARCA, appUrl } from "./marca";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function plantilla(titulo: string, texto: string, boton?: { texto: string; url: string }) {
  return `<div style="background:#f4f3ef;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16181d">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">
<p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#2b45d4">${esc(MARCA.nombre)}</p>
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.25">${esc(titulo)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#464a52">${esc(texto)}</p>
${boton ? `<a href="${esc(boton.url)}" style="display:inline-block;background:#2b45d4;color:#fff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:999px">${esc(boton.texto)}</a>` : ""}
</div>
<p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#7b7f87;text-align:center">Puedes apagar estos avisos en <a href="${appUrl()}/app/ajustes" style="color:#7b7f87">Ajustes</a>.</p>
</div>`;
}

type Encolar = {
  clave: string; para: string; asunto: string; html: string; usuarioId?: string; casoId?: string;
};

/** La clave hace idempotente el envío: encolar dos veces lo mismo no duplica. */
export async function encolar(e: Encolar): Promise<boolean> {
  const filas = await db.insert(envios).values(e).onConflictDoNothing({ target: envios.clave }).returning({ id: envios.id });
  return filas.length > 0;
}

export async function enviarPendientes(limite = 100) {
  const clave = process.env.RESEND_API_KEY?.trim();
  const filas = await db.select().from(envios)
    .where(and(inArray(envios.estado, ["pendiente", "error"]), lt(envios.intentos, 4)))
    .limit(limite);
  if (!filas.length) return { enviados: 0, fallidos: 0 };

  if (!clave) {
    await db.update(envios).set({ estado: "sin_proveedor" }).where(inArray(envios.id, filas.map((f) => f.id)));
    return { enviados: 0, fallidos: 0 };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(clave);
  const from = process.env.EMAIL_FROM ?? `${MARCA.nombre} <hola@woob.cl>`;
  let enviados = 0, fallidos = 0;
  for (const f of filas) {
    const { error } = await resend.emails.send({ from, to: f.para, subject: f.asunto, html: f.html });
    await db.update(envios).set(error
      ? { estado: "error", intentos: f.intentos + 1, error: error.message.slice(0, 300) }
      : { estado: "enviado", intentos: f.intentos + 1, enviadoEn: new Date(), error: null })
      .where(eq(envios.id, f.id));
    if (error) fallidos++; else enviados++;
  }
  return { enviados, fallidos };
}

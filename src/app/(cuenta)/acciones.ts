"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import {
  cifrarClave, consumirTokenRecuperacion, crearTokenRecuperacion, iniciarSesion, limpiarIntentos, normalizarEmail, permitirIntento,
} from "@/lib/auth";
import { encolar, enviarPendientes, plantilla } from "@/lib/correo";
import { appUrl } from "@/lib/marca";

export type Estado = { error?: string; aviso?: string };

const clave = z.string().min(10, "La clave debe tener al menos 10 caracteres.").max(72, "La clave es demasiado larga.");

const registro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  email: z.email("Ese correo no es válido."),
  clave,
  acepto: z.literal("on", { error: "Debes aceptar los términos para continuar." }),
});

export async function registrar(_: Estado, form: FormData): Promise<Estado> {
  const r = registro.safeParse(Object.fromEntries(form));
  if (!r.success) return { error: r.error.issues[0].message };
  const email = normalizarEmail(r.data.email);

  const [nuevo] = await db.insert(usuarios).values({
    email, nombre: r.data.nombre, claveHash: await cifrarClave(r.data.clave), aceptoTerminosEn: new Date(),
  }).onConflictDoNothing({ target: usuarios.email }).returning({ id: usuarios.id });

  if (!nuevo) return { error: "Ese correo ya tiene cuenta. Entra o recupera tu clave." };
  await iniciarSesion({ id: nuevo.id, email, nombre: r.data.nombre });
  redirect("/app/nuevo");
}

export async function ingresar(_: Estado, form: FormData): Promise<Estado> {
  const email = normalizarEmail(String(form.get("email") ?? ""));
  const claveDada = String(form.get("clave") ?? "");
  if (!(await permitirIntento(`ingreso:${email}`))) return { error: "Demasiados intentos. Prueba en 15 minutos." };

  const [u] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  // Se compara siempre, para que el tiempo de respuesta no revele si el correo existe.
  const valida = await bcrypt.compare(claveDada, u?.claveHash ?? "$2b$11$C6UzMDM.H6dfI/f/IKcEeO5w1pMpAcWZpxQfXPT2bqeQkhqXGOKIm");
  if (!u || !valida) return { error: "Correo o clave incorrectos." };

  await limpiarIntentos(`ingreso:${email}`);
  await iniciarSesion(u);
  redirect("/app");
}

export async function pedirRecuperacion(_: Estado, form: FormData): Promise<Estado> {
  const email = normalizarEmail(String(form.get("email") ?? ""));
  const aviso = "Si ese correo tiene cuenta, te enviamos un enlace. Vence en una hora.";
  if (!(await permitirIntento(`recuperar:${email}`))) return { aviso };
  const [u] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (u) {
    const token = await crearTokenRecuperacion(u.id);
    await encolar({
      clave: `recuperar:${token.slice(0, 16)}`, para: email, usuarioId: u.id, asunto: "Recupera tu clave",
      html: plantilla("Recupera tu clave", "Usa este enlace para elegir una clave nueva. Vence en una hora.", { texto: "Elegir clave nueva", url: `${appUrl()}/recuperar/${token}` }),
    });
    await enviarPendientes(5).catch((e) => console.error("[correo]", e));
  }
  return { aviso };
}

export async function cambiarClave(_: Estado, form: FormData): Promise<Estado> {
  const r = clave.safeParse(form.get("clave"));
  if (!r.success) return { error: r.error.issues[0].message };
  const usuarioId = await consumirTokenRecuperacion(String(form.get("token") ?? ""));
  if (!usuarioId) return { error: "Este enlace ya no sirve. Pide uno nuevo." };
  const [u] = await db.update(usuarios).set({ claveHash: await cifrarClave(r.data) }).where(eq(usuarios.id, usuarioId)).returning();
  await iniciarSesion(u);
  redirect("/app");
}

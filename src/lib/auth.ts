import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, count, eq, gt, isNull, lt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accesos, intentosIngreso, usuarios } from "@/db/schema";

const COOKIE = "solucionador_sesion";
const DURACION = 60 * 60 * 24 * 30;
const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;

export type Sesion = { id: string; email: string; nombre: string };

function secreto() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export const normalizarEmail = (e: string) => e.trim().toLowerCase();
export const cifrarClave = (clave: string) => bcrypt.hash(clave, 11);

export async function iniciarSesion(u: Sesion) {
  const token = await new SignJWT({ email: u.email, nombre: u.nombre })
    .setSubject(u.id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION}s`)
    .sign(secreto());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && (process.env.APP_URL ?? "").startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: DURACION,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function leerSesion(): Promise<Sesion | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto());
    return { id: String(payload.sub), email: String(payload.email), nombre: String(payload.nombre) };
  } catch {
    return null;
  }
}

/** La sesión vale solo si la cuenta sigue existiendo (se puede eliminar). */
export async function exigirSesion(): Promise<Sesion> {
  const s = await leerSesion();
  if (!s) redirect("/ingresar");
  const [u] = await db.select({ id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre })
    .from(usuarios).where(eq(usuarios.id, s.id)).limit(1);
  if (!u || u.email !== s.email) redirect("/ingresar");
  return u;
}

export function esAdmin(s: Sesion) {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && s.email === admin;
}

/** Frena fuerza bruta. Cuenta intentos por clave (correo) en una ventana móvil. */
export async function permitirIntento(clave: string): Promise<boolean> {
  const desde = new Date(Date.now() - VENTANA_MS);
  await db.delete(intentosIngreso).where(lt(intentosIngreso.creadoEn, desde));
  const [{ n }] = await db.select({ n: count() }).from(intentosIngreso)
    .where(and(eq(intentosIngreso.clave, clave), gt(intentosIngreso.creadoEn, desde)));
  if (n >= MAX_INTENTOS) return false;
  await db.insert(intentosIngreso).values({ clave });
  return true;
}

export const limpiarIntentos = (clave: string) =>
  db.delete(intentosIngreso).where(eq(intentosIngreso.clave, clave));

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function crearTokenRecuperacion(usuarioId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(accesos).values({
    tokenHash: hash(token), usuarioId, venceEn: new Date(Date.now() + 60 * 60 * 1000),
  });
  return token;
}

/** Consume el token una sola vez: el update es la verificación. */
export async function consumirTokenRecuperacion(token: string): Promise<string | null> {
  const [fila] = await db.update(accesos).set({ usadoEn: new Date() })
    .where(and(eq(accesos.tokenHash, hash(token)), isNull(accesos.usadoEn), gt(accesos.venceEn, new Date())))
    .returning({ usuarioId: accesos.usuarioId });
  return fila?.usuarioId ?? null;
}

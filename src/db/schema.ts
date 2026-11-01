import { sql } from "drizzle-orm";
import {
  boolean, date, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import type { Trabajo } from "@/lib/metodo";

const ahora = () => timestamp("creado_en", { withTimezone: true }).notNull().defaultNow();

export const usuarios = pgTable("usuarios", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  nombre: text().notNull(),
  claveHash: text("clave_hash").notNull(),
  aceptoTerminosEn: timestamp("acepto_terminos_en", { withTimezone: true }).notNull(),
  recibirCorreos: boolean("recibir_correos").notNull().default(true),
  creadoEn: ahora(),
});

export const accesos = pgTable("accesos", {
  tokenHash: text("token_hash").primaryKey(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  venceEn: timestamp("vence_en", { withTimezone: true }).notNull(),
  usadoEn: timestamp("usado_en", { withTimezone: true }),
});

/** Intentos de ingreso, para frenar fuerza bruta aunque haya varias réplicas. */
export const intentosIngreso = pgTable("intentos_ingreso", {
  id: uuid().primaryKey().defaultRandom(),
  clave: text().notNull(),
  creadoEn: ahora(),
}, (t) => [index("intentos_clave_idx").on(t.clave, t.creadoEn)]);

export const ordenes = pgTable("ordenes", {
  id: uuid().primaryKey().defaultRandom(),
  numero: text().notNull().unique(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id),
  plan: text().notNull(),
  monto: integer().notNull(),
  creditos: integer().notNull(),
  estado: text().notNull().default("pendiente"),
  flowToken: text("flow_token").unique(),
  casoId: uuid("caso_id"),
  creadoEn: ahora(),
  pagadoEn: timestamp("pagado_en", { withTimezone: true }),
});

/** Libro de créditos: el saldo es la suma; nunca se edita una fila. */
export const creditos = pgTable("creditos", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id),
  delta: integer().notNull(),
  motivo: text().notNull(),
  ordenId: uuid("orden_id").references(() => ordenes.id),
  casoId: uuid("caso_id"),
  creadoEn: ahora(),
}, (t) => [
  uniqueIndex("creditos_una_vez_por_orden").on(t.ordenId).where(sql`orden_id is not null`),
  uniqueIndex("creditos_una_vez_por_caso").on(t.casoId).where(sql`caso_id is not null`),
]);

export const casos = pgTable("casos", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  titulo: text().notNull(),
  estado: text().notNull().default("metodo"), // metodo | ejecucion | verificacion | resuelto | pausado | archivado
  etapa: integer().notNull().default(1),
  categoria: text().notNull().default("personal"), // personal | trabajo | proyecto
  urgencia: text().notNull().default("media"), // baja | media | alta
  trabajo: jsonb().$type<Trabajo>().notNull(),
  desbloqueadoEn: timestamp("desbloqueado_en", { withTimezone: true }),

  // Meta medible: lo que permite decir si se logró sin discutir.
  indicador: text(),
  unidad: text(),
  lineaBase: doublePrecision("linea_base"),
  objetivo: doublePrecision(),
  fechaInicio: date("fecha_inicio"),
  fechaObjetivo: date("fecha_objetivo"),

  // Ritmo y plan B
  ritmoDias: integer("ritmo_dias").notNull().default(7),
  proximaRevision: date("proxima_revision"),
  planBActivoEn: timestamp("plan_b_activo_en", { withTimezone: true }),

  // Compañero que da fe del avance
  companeroNombre: text("companero_nombre"),
  companeroEmail: text("companero_email"),
  companeroToken: text("companero_token").unique(),

  // Salud cacheada por el motor, para listar sin recalcular
  salud: integer(),
  saludEstado: text("salud_estado"),

  ultimaActividad: timestamp("ultima_actividad", { withTimezone: true }).notNull().defaultNow(),
  iniciadoEn: timestamp("iniciado_en", { withTimezone: true }),
  verificarEn: date("verificar_en"),
  resueltoEn: timestamp("resuelto_en", { withTimezone: true }),
  creadoEn: ahora(),
}, (t) => [index("casos_usuario_idx").on(t.usuarioId, t.estado)]);

export const pasos = pgTable("pasos", {
  id: uuid().primaryKey().defaultRandom(),
  casoId: uuid("caso_id").notNull().references(() => casos.id, { onDelete: "cascade" }),
  titulo: text().notNull(),
  criterioHecho: text("criterio_hecho").notNull(),
  prioridad: text().notNull().default("B"), // A | B | C | D | E
  orden: integer().notNull(),
  dependeDe: uuid("depende_de"),
  responsable: text().notNull(),
  venceEn: date("vence_en").notNull(),
  venceOriginal: date("vence_original").notNull(),
  reprogramaciones: integer().notNull().default(0),
  estado: text().notNull().default("pendiente"), // pendiente | en_curso | bloqueado | hecho | descartado
  bloqueo: text(),
  evidencia: text(),
  completadoEn: timestamp("completado_en", { withTimezone: true }),
  creadoEn: ahora(),
}, (t) => [index("pasos_caso_idx").on(t.casoId, t.orden)]);

/** Revisión periódica: la medición real del indicador y cómo va la persona. */
export const revisiones = pgTable("revisiones", {
  id: uuid().primaryKey().defaultRandom(),
  casoId: uuid("caso_id").notNull().references(() => casos.id, { onDelete: "cascade" }),
  fecha: date().notNull(),
  valor: doublePrecision(),
  confianza: integer().notNull(),
  avances: text().notNull(),
  trabas: text().notNull().default(""),
  compromiso: text().notNull(),
  analisis: jsonb().$type<Record<string, unknown>>(),
  creadoEn: ahora(),
}, (t) => [index("revisiones_caso_idx").on(t.casoId, t.fecha)]);

/** Bitácora solo-agregar: todo lo que pasó en el caso. */
export const eventos = pgTable("eventos", {
  id: uuid().primaryKey().defaultRandom(),
  casoId: uuid("caso_id").notNull().references(() => casos.id, { onDelete: "cascade" }),
  tipo: text().notNull(),
  detalle: text().notNull(),
  datos: jsonb().$type<Record<string, unknown>>(),
  creadoEn: ahora(),
}, (t) => [index("eventos_caso_idx").on(t.casoId, t.creadoEn)]);

/** Salida de correos con clave única: un recordatorio nunca se manda dos veces. */
export const envios = pgTable("envios", {
  id: uuid().primaryKey().defaultRandom(),
  clave: text().notNull().unique(),
  usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "cascade" }),
  casoId: uuid("caso_id").references(() => casos.id, { onDelete: "cascade" }),
  para: text().notNull(),
  asunto: text().notNull(),
  html: text().notNull(),
  estado: text().notNull().default("pendiente"), // pendiente | enviado | sin_proveedor | error
  intentos: integer().notNull().default(0),
  error: text(),
  creadoEn: ahora(),
  enviadoEn: timestamp("enviado_en", { withTimezone: true }),
});

export const usosIa = pgTable("usos_ia", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  casoId: uuid("caso_id").references(() => casos.id, { onDelete: "cascade" }),
  tarea: text().notNull(),
  modelo: text().notNull(),
  tokensEntrada: integer("tokens_entrada").notNull().default(0),
  tokensSalida: integer("tokens_salida").notNull().default(0),
  milisegundos: integer().notNull().default(0),
  ok: boolean().notNull(),
  creadoEn: ahora(),
}, (t) => [index("usos_ia_caso_idx").on(t.casoId), index("usos_ia_usuario_idx").on(t.usuarioId, t.creadoEn)]);

CREATE TABLE "accesos" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"vence_en" timestamp with time zone NOT NULL,
	"usado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "casos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"estado" text DEFAULT 'metodo' NOT NULL,
	"etapa" integer DEFAULT 1 NOT NULL,
	"trabajo" jsonb NOT NULL,
	"desbloqueado_en" timestamp with time zone,
	"indicador" text,
	"unidad" text,
	"linea_base" double precision,
	"objetivo" double precision,
	"fecha_inicio" date,
	"fecha_objetivo" date,
	"ritmo_dias" integer DEFAULT 7 NOT NULL,
	"proxima_revision" date,
	"plan_b_activo_en" timestamp with time zone,
	"companero_nombre" text,
	"companero_email" text,
	"companero_token" text,
	"salud" integer,
	"salud_estado" text,
	"ultima_actividad" timestamp with time zone DEFAULT now() NOT NULL,
	"iniciado_en" timestamp with time zone,
	"verificar_en" date,
	"resuelto_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "casos_companero_token_unique" UNIQUE("companero_token")
);
--> statement-breakpoint
CREATE TABLE "creditos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"motivo" text NOT NULL,
	"orden_id" uuid,
	"caso_id" uuid,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"usuario_id" uuid,
	"caso_id" uuid,
	"para" text NOT NULL,
	"asunto" text NOT NULL,
	"html" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"error" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"enviado_en" timestamp with time zone,
	CONSTRAINT "envios_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"detalle" text NOT NULL,
	"datos" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intentos_ingreso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ordenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" text NOT NULL,
	"usuario_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"monto" integer NOT NULL,
	"creditos" integer NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"flow_token" text,
	"caso_id" uuid,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"pagado_en" timestamp with time zone,
	CONSTRAINT "ordenes_numero_unique" UNIQUE("numero"),
	CONSTRAINT "ordenes_flow_token_unique" UNIQUE("flow_token")
);
--> statement-breakpoint
CREATE TABLE "pasos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"criterio_hecho" text NOT NULL,
	"prioridad" text DEFAULT 'B' NOT NULL,
	"orden" integer NOT NULL,
	"depende_de" uuid,
	"responsable" text NOT NULL,
	"vence_en" date NOT NULL,
	"vence_original" date NOT NULL,
	"reprogramaciones" integer DEFAULT 0 NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"bloqueo" text,
	"evidencia" text,
	"completado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"valor" double precision,
	"confianza" integer NOT NULL,
	"avances" text NOT NULL,
	"trabas" text DEFAULT '' NOT NULL,
	"compromiso" text NOT NULL,
	"analisis" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usos_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"caso_id" uuid,
	"tarea" text NOT NULL,
	"modelo" text NOT NULL,
	"tokens_entrada" integer DEFAULT 0 NOT NULL,
	"tokens_salida" integer DEFAULT 0 NOT NULL,
	"milisegundos" integer DEFAULT 0 NOT NULL,
	"ok" boolean NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nombre" text NOT NULL,
	"clave_hash" text NOT NULL,
	"acepto_terminos_en" timestamp with time zone NOT NULL,
	"recibir_correos" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accesos" ADD CONSTRAINT "accesos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "casos" ADD CONSTRAINT "casos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pasos" ADD CONSTRAINT "pasos_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usos_ia" ADD CONSTRAINT "usos_ia_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usos_ia" ADD CONSTRAINT "usos_ia_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "casos_usuario_idx" ON "casos" USING btree ("usuario_id","estado");--> statement-breakpoint
CREATE UNIQUE INDEX "creditos_una_vez_por_orden" ON "creditos" USING btree ("orden_id") WHERE orden_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "creditos_una_vez_por_caso" ON "creditos" USING btree ("caso_id") WHERE caso_id is not null;--> statement-breakpoint
CREATE INDEX "eventos_caso_idx" ON "eventos" USING btree ("caso_id","creado_en");--> statement-breakpoint
CREATE INDEX "intentos_clave_idx" ON "intentos_ingreso" USING btree ("clave","creado_en");--> statement-breakpoint
CREATE INDEX "pasos_caso_idx" ON "pasos" USING btree ("caso_id","orden");--> statement-breakpoint
CREATE INDEX "revisiones_caso_idx" ON "revisiones" USING btree ("caso_id","fecha");--> statement-breakpoint
CREATE INDEX "usos_ia_caso_idx" ON "usos_ia" USING btree ("caso_id");--> statement-breakpoint
CREATE INDEX "usos_ia_usuario_idx" ON "usos_ia" USING btree ("usuario_id","creado_en");
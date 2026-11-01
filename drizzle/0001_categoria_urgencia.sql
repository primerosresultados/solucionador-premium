ALTER TABLE "casos" ADD COLUMN "categoria" text DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "casos" ADD COLUMN "urgencia" text DEFAULT 'media' NOT NULL;
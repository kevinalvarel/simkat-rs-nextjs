ALTER TABLE "kelas" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "kelas" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_nama_kelas_unique" UNIQUE("nama_kelas");
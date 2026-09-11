ALTER TABLE "snapshot_detail_pasien" ADD COLUMN "is_printed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshot_detail_pasien" ADD COLUMN "printed_at" timestamp;--> statement-breakpoint
ALTER TABLE "snapshot_detail_pasien" ADD COLUMN "printed_by" text;--> statement-breakpoint
ALTER TABLE "master_siklus" ADD COLUMN "tanggal" text;
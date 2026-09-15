CREATE TABLE "riwayat_diet_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"pasien_id" integer,
	"snapshot_anchor_id" integer,
	"waktu_makan" text NOT NULL,
	"jenis_perubahan" text NOT NULL,
	"data_lama" text,
	"data_baru" text,
	"alasan" text,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"requested_by" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"nama_pasien" text,
	"no_rm" text,
	"gedung" text,
	"ruangan" text,
	"bed" text,
	"kelas" text
);
--> statement-breakpoint
ALTER TABLE "riwayat_diet_history" ADD CONSTRAINT "riwayat_diet_history_pasien_id_pasien_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."pasien"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_diet_history" ADD CONSTRAINT "riwayat_diet_history_snapshot_anchor_id_snapshot_batch_id_fk" FOREIGN KEY ("snapshot_anchor_id") REFERENCES "public"."snapshot_batch"("id") ON DELETE set null ON UPDATE no action;
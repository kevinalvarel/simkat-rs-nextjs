CREATE TABLE "gedung" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_gedung" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruangan" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_ruangan" text NOT NULL,
	"gedung_id" integer,
	"kelas" text,
	"jumlah_bed" integer DEFAULT 10
);
--> statement-breakpoint
CREATE TABLE "kamar" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_kamar" text NOT NULL,
	"ruangan_id" integer,
	"kelas" text,
	"jumlah_bed" integer DEFAULT 2
);
--> statement-breakpoint
CREATE TABLE "kelas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kelas" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kategori_menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kategori" text NOT NULL,
	"kode_item" text NOT NULL,
	"label_item" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_diet_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"diet_rs_raw" text NOT NULL,
	"bentuk_makanan" text,
	"kategori_diet" text,
	"extra" text,
	"buah" text,
	"snack" text,
	"status_mapping" text DEFAULT 'UNMAPPED' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "master_diet_mapping_diet_rs_raw_unique" UNIQUE("diet_rs_raw")
);
--> statement-breakpoint
CREATE TABLE "pasien" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_pasien" text NOT NULL,
	"no_rm" text NOT NULL,
	"diet" text NOT NULL,
	"kelas" text NOT NULL,
	"gedung" text DEFAULT '' NOT NULL,
	"ruangan" text NOT NULL,
	"bed" text NOT NULL,
	"status_pasien" text DEFAULT 'AKTIF' NOT NULL,
	"is_npo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "waktu_makan" (
	"id" serial PRIMARY KEY NOT NULL,
	"jenis_makan" text NOT NULL,
	"waktu" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshot_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_code" text NOT NULL,
	"tanggal_produksi" date NOT NULL,
	"waktu_makan" text NOT NULL,
	"timestamp_snapshot" timestamp DEFAULT now() NOT NULL,
	"total_pasien" integer DEFAULT 0 NOT NULL,
	"status_batch" text DEFAULT 'LOCKED' NOT NULL,
	"created_by" text,
	"cutoff_time" text,
	CONSTRAINT "snapshot_batch_batch_code_unique" UNIQUE("batch_code")
);
--> statement-breakpoint
CREATE TABLE "snapshot_detail_pasien" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"no_rm" text NOT NULL,
	"nama_pasien" text NOT NULL,
	"gedung" text NOT NULL,
	"ruangan" text NOT NULL,
	"no_bed" text NOT NULL,
	"kelas" text NOT NULL,
	"diet_rs_raw" text NOT NULL,
	"bentuk_makanan" text,
	"kategori_diet" text,
	"extra" text,
	"buah" text,
	"snack" text,
	"status_saat_snapshot" text,
	"is_emergent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otorisasi_perubahan_diet" (
	"id" serial PRIMARY KEY NOT NULL,
	"pasien_id" integer NOT NULL,
	"batch_id" integer,
	"waktu_makan" text NOT NULL,
	"jenis_perubahan" text NOT NULL,
	"data_lama" text,
	"data_baru" text,
	"alasan" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"requested_by" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text
);
--> statement-breakpoint
ALTER TABLE "ruangan" ADD CONSTRAINT "ruangan_gedung_id_gedung_id_fk" FOREIGN KEY ("gedung_id") REFERENCES "public"."gedung"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kamar" ADD CONSTRAINT "kamar_ruangan_id_ruangan_id_fk" FOREIGN KEY ("ruangan_id") REFERENCES "public"."ruangan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_detail_pasien" ADD CONSTRAINT "snapshot_detail_pasien_batch_id_snapshot_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."snapshot_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otorisasi_perubahan_diet" ADD CONSTRAINT "otorisasi_perubahan_diet_pasien_id_pasien_id_fk" FOREIGN KEY ("pasien_id") REFERENCES "public"."pasien"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otorisasi_perubahan_diet" ADD CONSTRAINT "otorisasi_perubahan_diet_batch_id_snapshot_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."snapshot_batch"("id") ON DELETE set null ON UPDATE no action;
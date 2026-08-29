CREATE TABLE "master_siklus_menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"siklus_ke" integer DEFAULT 1 NOT NULL,
	"kelas" text DEFAULT 'Semua Kelas' NOT NULL,
	"jenis_makanan" text NOT NULL,
	"waktu_makan" text NOT NULL,
	"nama_makanan" text NOT NULL,
	"kategori_menu" text,
	"catatan" text,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_siklus" (
	"id" serial PRIMARY KEY NOT NULL,
	"nomor_siklus" integer NOT NULL,
	"nama_siklus" text NOT NULL,
	"deskripsi" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_siklus_nomor_siklus_unique" UNIQUE("nomor_siklus")
);
--> statement-breakpoint
ALTER TABLE "master_siklus_menu" ADD CONSTRAINT "master_siklus_menu_siklus_ke_master_siklus_nomor_siklus_fk" FOREIGN KEY ("siklus_ke") REFERENCES "public"."master_siklus"("nomor_siklus") ON DELETE cascade ON UPDATE no action;
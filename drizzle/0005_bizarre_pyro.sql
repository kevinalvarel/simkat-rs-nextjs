CREATE TABLE IF NOT EXISTS "revisi_etiket_print" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"no_rm" text NOT NULL,
	"revision_signature" text NOT NULL,
	"printed_at" timestamp DEFAULT now() NOT NULL,
	"printed_by" text,
	CONSTRAINT "revisi_etiket_print_batch_rm_unique" UNIQUE("batch_id","no_rm"),
	CONSTRAINT "revisi_etiket_print_batch_id_snapshot_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."snapshot_batch"("id") ON DELETE cascade ON UPDATE no action
);

ALTER TABLE "kategori_menu" ADD COLUMN IF NOT EXISTS "is_tugas_ag_katering" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "master_diet_mapping" ADD COLUMN IF NOT EXISTS "nabati" text;--> statement-breakpoint
ALTER TABLE "master_diet_mapping" ADD COLUMN IF NOT EXISTS "sayur" text;--> statement-breakpoint
ALTER TABLE "snapshot_detail_pasien" ADD COLUMN IF NOT EXISTS "nabati" text;--> statement-breakpoint
ALTER TABLE "snapshot_detail_pasien" ADD COLUMN IF NOT EXISTS "sayur" text;--> statement-breakpoint
-- Normalisasi data PARTIAL lama (dipindah ke sini karena kolom nabati/sayur
-- baru tersedia setelah ADD COLUMN di atas; idempotent, aman di-run ulang).
UPDATE "master_diet_mapping"
SET "nabati" = NULLIF(trim(split_part("extra", ',', 1)), ''),
    "sayur" = CASE WHEN position(',' in "extra") > 0
      THEN NULLIF(trim(split_part("extra", ',', 2)), '') ELSE NULL END
WHERE "is_active" = true
  AND "status_mapping" = 'PARTIAL'
  AND NULLIF(trim(coalesce("nabati", '')), '') IS NULL
  AND NULLIF(trim(coalesce("sayur", '')), '') IS NULL
  AND NULLIF(trim(coalesce("extra", '')), '') IS NOT NULL;
--> statement-breakpoint
UPDATE "master_diet_mapping"
SET "status_mapping" = 'MAPPED', "updated_at" = now()
WHERE "is_active" = true
  AND "status_mapping" = 'PARTIAL'
  AND (
    NULLIF(trim(coalesce("bentuk_makanan", '')), '') IS NOT NULL OR
    NULLIF(trim(coalesce("kategori_diet", '')), '') IS NOT NULL OR
    NULLIF(trim(coalesce("nabati", '')), '') IS NOT NULL OR
    NULLIF(trim(coalesce("sayur", '')), '') IS NOT NULL OR
    NULLIF(trim(coalesce("buah", '')), '') IS NOT NULL OR
    NULLIF(trim(coalesce("snack", '')), '') IS NOT NULL
  );

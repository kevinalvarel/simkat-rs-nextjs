-- Mapping dengan satu jenis makanan kini sah dan harus tersedia bagi produksi.
-- Pecah nilai lama `extra` hanya jika kolom nabati dan sayur belum terisi.
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

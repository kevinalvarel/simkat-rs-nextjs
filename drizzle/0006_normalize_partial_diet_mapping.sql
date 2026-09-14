-- Data migration: pecah nilai lama `extra` ke kolom `nabati`/`sayur`.
-- Dijalankan SEBELUM 0007 (yang menambahkan kolomnya), jadi file ini
-- sengaja jadi no-op bila kolom belum ada. Normalisasi yang sebenarnya
-- dijalankan di 0007 setelah ADD COLUMN (idempotent, aman di-run ulang).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_diet_mapping' AND column_name = 'nabati')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_diet_mapping' AND column_name = 'sayur') THEN
    UPDATE "master_diet_mapping"
    SET "nabati" = NULLIF(trim(split_part("extra", ',', 1)), ''),
        "sayur" = CASE WHEN position(',' in "extra") > 0
          THEN NULLIF(trim(split_part("extra", ',', 2)), '') ELSE NULL END
    WHERE "is_active" = true
      AND "status_mapping" = 'PARTIAL'
      AND NULLIF(trim(coalesce("nabati", '')), '') IS NULL
      AND NULLIF(trim(coalesce("sayur", '')), '') IS NULL
      AND NULLIF(trim(coalesce("extra", '')), '') IS NOT NULL;

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
  ELSE
    RAISE NOTICE '0006 skipped: columns nabati/sayur not present yet, normalization runs in 0007';
  END IF;
END $$;

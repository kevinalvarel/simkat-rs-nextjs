import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';

export const kategoriMenuTable = pgTable('kategori_menu', {
  id: serial('id').primaryKey(),

  /** Nama kelompok: BENTUK_MAKANAN | DIIT | EXTRA | BUAH | SNACK */
  nama_kategori: text('nama_kategori').notNull(),

  /** Kode singkat item, mis. "BN", "TKTP", "PUTEL" */
  kode_item: text('kode_item').notNull(),

  /** Label tampilan, mis. "Biasa Nasi", "Tinggi Kalori Tinggi Protein" */
  label_item: text('label_item').notNull(),

  /** Urutan tampil dalam tabulasi (ascending). */
  urutan: integer('urutan').notNull().default(0),

  is_active: boolean('is_active').notNull().default(true),
});

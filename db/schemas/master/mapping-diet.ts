import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Master Mapping Diet — kamus permanen free text → standar diet.
 *
 * Aturan bisnis: JANGAN PERNAH hard-delete record. Gunakan `is_active = false`
 * untuk soft-deactivate. Tujuannya agar free-text yang sama persis tidak perlu
 * di-mapping ulang di kemudian hari.
 */
export const dietMappingTable = pgTable('master_diet_mapping', {
  id: serial('id').primaryKey(),
  diet_rs_raw: text('diet_rs_raw').notNull().unique(),
  bentuk_makanan: text('bentuk_makanan'),
  karbohidrat: text('karbohidrat'),
  kategori_diet: text('kategori_diet'),
  nabati: text('nabati'),
  sayur: text('sayur'),
  extra: text('extra'),
  buah: text('buah'),
  snack: text('snack'),
  status_mapping: text('status_mapping').notNull().default('UNMAPPED'),

  created_by: text('created_by'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_by: text('updated_by'),
  updated_at: timestamp('updated_at').notNull().defaultNow(),

  is_active: boolean('is_active').notNull().default(true),
});

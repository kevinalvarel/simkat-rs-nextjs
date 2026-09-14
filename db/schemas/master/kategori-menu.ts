import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';

export const kategoriMenuTable = pgTable('kategori_menu', {
  id: serial('id').primaryKey(),
  nama_kategori: text('nama_kategori').notNull(),
  kode_item: text('kode_item').notNull(),
  label_item: text('label_item').notNull(),
  urutan: integer('urutan').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  is_tugas_ag_katering: boolean('is_tugas_ag_katering').notNull().default(false),
});

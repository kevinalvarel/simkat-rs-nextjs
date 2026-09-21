import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const kelasTable = pgTable('kelas', {
  id: serial('id').primaryKey(),
  /** Nama kanonis kelas, misal "KELAS I", "KELAS II", "KELAS III" */
  nama_kelas: text('nama_kelas').notNull().unique(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

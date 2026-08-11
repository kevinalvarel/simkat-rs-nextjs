import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const kelasTable = pgTable('kelas', {
  id: serial('id').primaryKey(),
  nama_kelas: text('nama_kelas').notNull(),
});

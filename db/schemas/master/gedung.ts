import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const gedungTable = pgTable('gedung', {
  id: serial('id').primaryKey(),
  nama_gedung: text('nama_gedung').notNull(),
});

import { serial, text, time } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const waktuMakanTable = pgTable('waktu_makan', {
  id: serial('id').primaryKey(),
  jenis_makan: text('jenis_makan').notNull(),
  waktu: time('waktu').notNull(),
});

import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { gedungTable } from './gedung';

export const ruanganTable = pgTable('ruangan', {
  id: serial('id').primaryKey(),
  nama_ruangan: text('nama_ruangan').notNull(),
  gedung_id: integer('gedung_id').references(() => gedungTable.id, {
    onDelete: 'set null',
  }),
});

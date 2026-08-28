import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { gedungTable } from './gedung';
import { kamarTable } from './kamar';

export const ruanganTable = pgTable('ruangan', {
  id: serial('id').primaryKey(),
  nama_ruangan: text('nama_ruangan').notNull(),
  gedung_id: integer('gedung_id').references(() => gedungTable.id, {
    onDelete: 'set null',
  }),
  kelas: text('kelas'),
  jumlah_bed: integer('jumlah_bed').default(10),
});

export const ruanganRelations = relations(ruanganTable, ({ one, many }) => ({
  gedung: one(gedungTable, {
    fields: [ruanganTable.gedung_id],
    references: [gedungTable.id],
  }),
  kamarList: many(kamarTable),
}));



import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ruanganTable } from './ruangan';

export const kamarTable = pgTable('kamar', {
  id: serial('id').primaryKey(),
  nomor_kamar: text('nomor_kamar').notNull(),
  ruangan_id: integer('ruangan_id').references(() => ruanganTable.id, {
    onDelete: 'cascade',
  }),
  kelas: text('kelas'),
  jumlah_bed: integer('jumlah_bed').default(2),
});

export const kamarRelations = relations(kamarTable, ({ one }) => ({
  ruangan: one(ruanganTable, {
    fields: [kamarTable.ruangan_id],
    references: [ruanganTable.id],
  }),
}));


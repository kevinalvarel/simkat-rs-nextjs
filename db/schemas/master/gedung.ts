import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ruanganTable } from './ruangan';

export const gedungTable = pgTable('gedung', {
  id: serial('id').primaryKey(),
  nama_gedung: text('nama_gedung').notNull(),
});

export const gedungRelations = relations(gedungTable, ({ many }) => ({
  ruanganList: many(ruanganTable),
}));


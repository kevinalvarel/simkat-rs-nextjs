import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { pasienTable } from '../patient/pasien';
import { snapshotBatchTable } from './snapshot-batch';

export const otorisasiPerubahanDietTable = pgTable('otorisasi_perubahan_diet', {
  id: serial('id').primaryKey(),

  pasien_id: integer('pasien_id')
    .notNull()
    .references(() => pasienTable.id, { onDelete: 'cascade' }),

  /** Batch yang terpengaruh (nullable jika belum ada batch). */
  batch_id: integer('batch_id').references(() => snapshotBatchTable.id, {
    onDelete: 'set null',
  }),

  /** Siklus makan yang terpengaruh: PAGI | SIANG | MALAM */
  waktu_makan: text('waktu_makan').notNull(),

  /** DIET_CHANGE | ROOM_TRANSFER | NEW_PATIENT | DISCHARGE */
  jenis_perubahan: text('jenis_perubahan').notNull(),

  /** JSON string data sebelum perubahan. */
  data_lama: text('data_lama'),
  /** JSON string data baru yang diajukan. */
  data_baru: text('data_baru'),
  /** Alasan / keterangan klinis. */
  alasan: text('alasan'),

  /** PENDING | APPROVED | REJECTED */
  status: text('status').notNull().default('PENDING'),

  requested_by: text('requested_by'),
  requested_at: timestamp('requested_at').notNull().defaultNow(),

  reviewed_by: text('reviewed_by'),
  reviewed_at: timestamp('reviewed_at'),
  review_notes: text('review_notes'),
});

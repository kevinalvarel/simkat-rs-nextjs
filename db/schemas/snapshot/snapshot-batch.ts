import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';

export const snapshotBatchTable = pgTable('snapshot_batch', {
  id: serial('id').primaryKey(),

  /** Format: BATCH-YYYYMMDD-PAGI/SIANG/MALAM */
  batch_code: text('batch_code').notNull().unique(),

  tanggal_produksi: date('tanggal_produksi').notNull(),
  waktu_makan: text('waktu_makan').notNull(), // PAGI | SIANG | MALAM
  timestamp_snapshot: timestamp('timestamp_snapshot').notNull().defaultNow(),
  total_pasien: integer('total_pasien').notNull().default(0),

  /** LOCKED — snapshot sudah permanen, tidak bisa diubah. */
  status_batch: text('status_batch').notNull().default('LOCKED'),

  created_by: text('created_by'),

  /** Waktu cut-off (HH:mm) yang berlaku saat snapshot dibuat. */
  cutoff_time: text('cutoff_time'),
});

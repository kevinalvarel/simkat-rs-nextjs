import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { snapshotBatchTable } from './snapshot-batch';

export const snapshotDetailTable = pgTable('snapshot_detail_pasien', {
  id: serial('id').primaryKey(),

  batch_id: integer('batch_id')
    .notNull()
    .references(() => snapshotBatchTable.id, { onDelete: 'cascade' }),

  no_rm: text('no_rm').notNull(),
  nama_pasien: text('nama_pasien').notNull(),
  gedung: text('gedung').notNull(),
  ruangan: text('ruangan').notNull(),
  no_bed: text('no_bed').notNull(),
  kelas: text('kelas').notNull(),
  diet_rs_raw: text('diet_rs_raw').notNull(),

  /** Hasil auto-mapping dari master_diet_mapping (nullable jika UNMAPPED). */
  bentuk_makanan: text('bentuk_makanan'),
  karbohidrat: text('karbohidrat'),
  kategori_diet: text('kategori_diet'),
  nabati: text('nabati'),
  sayur: text('sayur'),
  extra: text('extra'),
  buah: text('buah'),
  snack: text('snack'),

  /** Status pasien saat snapshot diambil. */
  status_saat_snapshot: text('status_saat_snapshot'),

  /** Flag: true jika record ini berasal dari emergent request yang di-approve. */
  is_emergent: boolean('is_emergent').notNull().default(false),

  /** Status cetak etiket pasien khusus untuk batch snapshot ini */
  is_printed: boolean('is_printed').notNull().default(false),
  printed_at: timestamp('printed_at'),
  printed_by: text('printed_by'),
});


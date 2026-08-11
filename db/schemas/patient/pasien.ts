import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Tabel pasien aktif — data real-time pasien yang saat ini berada
 * di ruang perawatan rumah sakit.
 */
export const pasienTable = pgTable('pasien', {
  id: serial('id').primaryKey(),
  nama_pasien: text('nama_pasien').notNull(),
  no_rm: text('no_rm').notNull(),
  diet: text('diet').notNull(),
  kelas: text('kelas').notNull(),
  gedung: text('gedung').notNull().default(''),
  ruangan: text('ruangan').notNull(),
  bed: text('bed').notNull(),

  /** AKTIF | PASIEN_BARU | PERUBAHAN_DIET | PINDAH_RUANGAN | NPO | PULANG */
  status_pasien: text('status_pasien').notNull().default('AKTIF'),

  is_npo: boolean('is_npo').notNull().default(false),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  updated_by: text('updated_by'),
});

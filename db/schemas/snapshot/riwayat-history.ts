import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { pasienTable } from '../patient/pasien';
import { snapshotBatchTable } from './snapshot-batch';

/**
 * History khusus perubahan diet (terpisah dari `otorisasi_perubahan_diet`).
 *
 * Retensi: hard-delete otomatis setelah melewati 2 snapshot batch global.
 * `snapshot_anchor_id` = batch terbaru saat log dibuat (NULL bila belum ada batch).
 * Prune dijalankan via `pruneExpiredRiwayatHistory()` yang di-hook ke
 * `triggerManualSnapshot()` + lazy prune saat halaman riwayat dibaca.
 */
export const riwayatDietHistoryTable = pgTable('riwayat_diet_history', {
  id: serial('id').primaryKey(),

  /** Nullable + set null agar history tetap ada walau pasien dihapus. */
  pasien_id: integer('pasien_id').references(() => pasienTable.id, {
    onDelete: 'set null',
  }),

  /** Anchor retensi. Nullable + set null bila batch anchor dihapus manual. */
  snapshot_anchor_id: integer('snapshot_anchor_id').references(
    () => snapshotBatchTable.id,
    { onDelete: 'set null' },
  ),

  /** Siklus makan yang terpengaruh: PAGI | SIANG | MALAM */
  waktu_makan: text('waktu_makan').notNull(),

  /** DIET_CHANGE | ROOM_TRANSFER | NEW_PATIENT | DISCHARGE | NPO | KOREKSI_* */
  jenis_perubahan: text('jenis_perubahan').notNull(),

  /** JSON string data sebelum / sesudah perubahan. */
  data_lama: text('data_lama'),
  data_baru: text('data_baru'),
  /** Alasan / keterangan klinis. */
  alasan: text('alasan'),

  /** History selalu tercatat final — default APPROVED agar kompatibel dengan filter UI. */
  status: text('status').notNull().default('APPROVED'),

  /** Format: "Nama Staf (email)" agar parser nama/email di client tetap jalan. */
  requested_by: text('requested_by'),
  requested_at: timestamp('requested_at').notNull().defaultNow(),

  reviewed_by: text('reviewed_by'),
  reviewed_at: timestamp('reviewed_at'),
  review_notes: text('review_notes'),

  /** Denormalisasi agar tampilan tahan terhadap hapus/update pasien. */
  nama_pasien: text('nama_pasien'),
  no_rm: text('no_rm'),
  gedung: text('gedung'),
  ruangan: text('ruangan'),
  bed: text('bed'),
  kelas: text('kelas'),
});

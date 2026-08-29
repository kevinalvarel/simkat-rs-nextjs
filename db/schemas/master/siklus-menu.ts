import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Master Siklus Menu — Tabel penyimpan hidangan dan menu per siklus, kelas,
 * jenis lauk (hewani/nabati/sayur/saring), dan jam makan (pagi/siang/sore/saring siang).
 */
export const masterSiklusMenuTable = pgTable('master_siklus_menu', {
  id: serial('id').primaryKey(),

  /** Nomor urut siklus, contoh: 1 untuk Siklus 1, 2 untuk Siklus 2, dst. (standar siklus 1-10 / 1-31) */
  siklus_ke: integer('siklus_ke').notNull().default(1),

  /** Kategori kelas: "Kelas 1", "Kelas 2 - 3", "VIP", "Semua Kelas" */
  kelas: text('kelas').notNull().default('Semua Kelas'),

  /** Jenis makanan: "HEWANI" | "NABATI" | "SAYUR" | "SARING" | "BUAH" | "SNACK" | "EXTRA" */
  jenis_makanan: text('jenis_makanan').notNull(),

  /** Waktu makan: "PAGI" | "SIANG" | "SORE" | "SARING_SIANG" */
  waktu_makan: text('waktu_makan').notNull(),

  /** Nama hidangan / menu makanan, contoh: "Telur Puyuh BB Kecap" */
  nama_makanan: text('nama_makanan').notNull(),

  /** Tag kategori menu / kode diet terkait, contoh: "B", "Diit, DM", "RG", "DJ, RKol, RL", "RP, RS" */
  kategori_menu: text('kategori_menu'),

  /** Catatan khusus persiapan/pemotongan, contoh: "*ptg dadu", "cetak D", "fillet" */
  catatan: text('catatan'),

  /** Urutan tampil hidangan di dalam sel waktu makan (ascending) */
  urutan: integer('urutan').notNull().default(0),

  /** Status aktif */
  is_active: boolean('is_active').notNull().default(true),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

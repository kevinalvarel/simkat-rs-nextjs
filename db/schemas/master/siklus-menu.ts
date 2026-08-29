import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Master Siklus — Tabel header/master definisi nomor siklus menu makanan rumah sakit.
 * Menyimpan nomor siklus, label nama siklus, deskripsi, dan status aktif.
 */
export const masterSiklusTable = pgTable('master_siklus', {
  id: serial('id').primaryKey(),

  /** Nomor urut siklus unik (1, 2, 3 ... 10, 11, 31) */
  nomor_siklus: integer('nomor_siklus').notNull().unique(),

  /** Nama tampilan siklus, misal "Siklus 1", "Siklus 2", "Siklus Tgl 31", "Siklus Khusus" */
  nama_siklus: text('nama_siklus').notNull(),

  /** Hari penugasan rotasi siklus (misal "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU") */
  hari: text('hari'),

  /** Keterangan / catatan rotasi siklus */
  deskripsi: text('deskripsi'),

  /** Status aktif */
  is_active: boolean('is_active').notNull().default(true),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});


/**
 * Master Siklus Menu — Tabel penyimpan hidangan dan menu per siklus, kelas,
 * jenis lauk (hewani/nabati/sayur/saring), dan jam makan (pagi/siang/sore/saring siang).
 */
export const masterSiklusMenuTable = pgTable('master_siklus_menu', {
  id: serial('id').primaryKey(),

  /** Nomor urut siklus, berelasi dengan master_siklus.nomor_siklus */
  siklus_ke: integer('siklus_ke')
    .notNull()
    .default(1)
    .references(() => masterSiklusTable.nomor_siklus, { onDelete: 'cascade' }),

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

export const masterSiklusRelations = relations(masterSiklusTable, ({ many }) => ({
  menuItems: many(masterSiklusMenuTable),
}));

export const masterSiklusMenuRelations = relations(masterSiklusMenuTable, ({ one }) => ({
  siklus: one(masterSiklusTable, {
    fields: [masterSiklusMenuTable.siklus_ke],
    references: [masterSiklusTable.nomor_siklus],
  }),
}));


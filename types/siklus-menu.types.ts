export const HARI_ROTASI_LIST = [
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
  'MINGGU',
] as const;

export type HariRotasi = (typeof HARI_ROTASI_LIST)[number];

export const SIKLUS_DIET_JENIS = [
  'HEWANI',
  'NABATI',
  'SAYUR',
  'BUAH',
  'SNACK',
] as const;

export type SiklusDietJenis = (typeof SIKLUS_DIET_JENIS)[number];

export interface MasterSiklusItem {
  id: number;
  nomor_siklus: number;
  nama_siklus: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CreateMasterSiklusPayload = {
  nomor_siklus: number;
  nama_siklus: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi?: string | null;
  copyFromSiklus?: number | null;
};

export type UpdateMasterSiklusPayload = {
  nama_siklus?: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi?: string | null;
  is_active?: boolean;
};

export interface SiklusMenuItem {
  id: number;
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  nama_makanan: string;
  kategori_menu: string | null;
  catatan: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MutationResult {
  success: boolean;
  message: string;
  insertedId?: number;
}

export type CreateSiklusItemPayload = {
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  nama_makanan: string;
  kategori_menu?: string | null;
  catatan?: string | null;
  is_active?: boolean;
};

export type UpdateSiklusItemPayload = Partial<CreateSiklusItemPayload>;

export type SlotItemInput = {
  id?: number;
  nama_makanan: string;
  kategori_menu?: string | null;
  catatan?: string | null;
};

export interface SiklusMatrixRow {
  id: string; // Unique key e.g. "KELAS-I-HEWANI" atau "ALL-NABATI"
  kelas: string; // "KELAS I" | "KELAS II" | "KELAS III" | "Semua Kelas" (nilai dari sistem)
  jenis_makanan: string; // "HEWANI" | "NABATI" | "SAYUR" | "SARING"
  label: string;
  pagi: SiklusMenuItem[];
  siang: SiklusMenuItem[];
  sore: SiklusMenuItem[];
  saring_siang: SiklusMenuItem[];
}

export interface SiklusStatsData {
  totalItems: number;
  pagiCount: number;
  siangCount: number;
  soreCount: number;
  saringCount: number;
  hewaniCount: number;
  nabatiCount: number;
  sayurCount: number;
  kelasCount: number;
}

/**
 * Opsi diet per jenis makanan yang bersumber dari data siklus menu
 * (master_siklus_menu) untuk dropdown mapping diet pasien.
 *
 * Setiap tag unik (termasuk tag penyusun hidangan multi-tag) disajikan
 * sebagai opsi satuan. Diet gabungan bersifat implisit dari kombinasi
 * tag pada hidangan, tanpa nama gabungan terpisah.
 */
export interface SiklusDietOption {
  id: string;
  /** HEWANI | NABATI | SAYUR | BUAH | SNACK */
  jenisMakanan: string;
  /** Nilai yang disimpan ke mapping: kode tag */
  kode: string;
  /** Label tampilan dropdown */
  label: string;
  isGabungan: boolean;
  /** Selalu kosong — dipertahankan agar konsumen lama tidak rusak */
  memberTags: string[];
}

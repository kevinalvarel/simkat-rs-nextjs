export type MenuCategoryGroup =
  | 'POKOK'
  | 'HEWANI'
  | 'NABATI'
  | 'SAYUR'
  | 'HEWANI & NABATI'
  | 'NABATI & SAYUR'
  | 'HEWANI & SAYUR'
  | 'SARING'
  | 'EXTRA'
  | 'BUAH'
  | 'SNACK'
  | 'NPO'
  | 'LAINNYA';

export interface MonitoringCardData {
  code: string; // Unique dish key or identifier
  name: string; // Display name (e.g. "Ayam Bumbu Kecap", "Nasi Putih", "Sayur Bayam")
  category?: MenuCategoryGroup | string; // e.g. "HEWANI", "NABATI", "SAYUR", "POKOK", "EXTRA", "BUAH", "SNACK", "NPO"
  kelas?: string; // e.g. "Semua Kelas", "KELAS I", "KELAS II", "KELAS III"
  dietTag?: string; // e.g. "Biasa", "RG", "DM", "TKTP"
  catatan?: string;
  /** True bila kartu penampung DIIT (nama = hidangan DIIT, dietTag = kode diet mapping). */
  isDiit?: boolean;
  baseline: number; // Count before revision
  active: number; // Current count (baseline + change)
  change: number; // Net change (+1, -1, 0, etc.)
}

export interface MonitoringSummary {
  success: boolean;
  batchId: number | null;
  batchCode: string;
  waktuMakan: string;
  tanggalProduksi: string;
  statusBatch: string;
  cutoffTime: string;

  // Cycle & Day Info
  siklusKe: number;
  namaSiklus: string;
  hari: string;
  tanggalFormatted: string;
  deskripsiSiklus?: string;
  totalPasien: number;
  totalPorsi: number;

  cards: MonitoringCardData[];
  lastUpdated: string;
}

export interface OverviewProductionClientProps {
  initialData: MonitoringSummary;
}

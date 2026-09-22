import type { masterSiklusMenuTable } from '@/db/schemas/master/siklus-menu';

/**
 * Normalized internal representation of a patient for tabulation processing.
 * Used by all tabulasi service layers (makan, snack, buah).
 */
export interface TabulasiPatientRecord {
  id: number | string;
  no_rm: string;
  nama_pasien: string;
  gedung: string;
  ruangan: string;
  kelas: string;
  diet_rs_raw: string;
  bentuk_makanan: string | null;
  kategori_diet: string | null;
  status_pasien?: string | null;
  status_saat_snapshot?: string | null;
  is_npo?: boolean | null;
}

/**
 * Strongly-typed JSON payload for post-snapshot approved revisions (NEW_PATIENT).
 */
export interface ParsedPatientRevisionPayload {
  no_rm?: string;
  nama_pasien?: string;
  gedung?: string;
  ruangan?: string;
  bed?: string;
  kelas?: string;
  diet?: string;
  bentuk_makanan?: string;
  kategori_diet?: string;
}

/**
 * Pre-analyzed patient flags for efficient and accurate dish matching.
 * Computed once per patient in the main aggregation loop.
 */
export interface AnalyzedPatient {
  patient: TabulasiPatientRecord;
  gedungType: 'GEDUNG LAMA' | 'GEDUNG BARU';
  kelasType: 'KELAS_1' | 'KELAS_2' | 'KELAS_3';
  isNpo: boolean;
  isDm: boolean;
  isRg: boolean;
  isRs: boolean;
  isRp: boolean;
  isDj: boolean;
  isRl: boolean;
  isRkol: boolean;
  isTktp: boolean;
  isSaring: boolean;
  isBiasa: boolean;
}

/** Drizzle inferred type alias for master siklus menu row */
export type MasterMenuItemRow = typeof masterSiklusMenuTable.$inferSelect;


export type ProductionStatus = 'READY' | 'PENDING' | 'CHECK';

export interface TabulasiDietBreakdown {
  diet: string;
  count: number;
  label?: string;
}

export interface TabulasiFloorDistribution {
  floor: string;
  count: number;
  percentage: number;
}

export interface TabulasiLocationBreakdown {
  gedung: string;
  count: number;
  percentage: number;
  floors?: TabulasiFloorDistribution[];
}

export interface TabulasiMenuItem {
  id: string;
  name: string;
  category: 'Lauk Hewani' | 'Lauk Nabati' | 'Sayuran' | 'Sup' | 'Nasi/Pokok' | 'Ekstra';
  icon?: string;
  totalPortions: number;
  dietBreakdown: TabulasiDietBreakdown[];
  locationBreakdown: TabulasiLocationBreakdown[];
  status: ProductionStatus;
  notes?: string;
  allergens?: string[];
  prepTime?: string;
}

export interface TabulasiDietItem {
  code: string;
  name: string;
  count: number;
  percentage: number;
  description?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export interface TabulasiLocationGroup {
  gedung: string;
  totalPatients: number;
  floors: {
    floorName: string;
    patientCount: number;
    percentage: number;
  }[];
}

export interface TabulasiPatientSummary {
  totalPatients: number;
  patientsEating: number;
  specialDiet: number;
  othersNpo: number;
  totalPortions: number;
}

export interface TabulasiSnackCategory {
  category: string;
  portions: number;
  percentage: number;
  diets: string[];
}

export interface TabulasiSnackItem {
  name: string;
  diet: string;
  count: number;
  icon?: string;
}

export interface TabulasiSnackSummary {
  categories: TabulasiSnackCategory[];
  items: TabulasiSnackItem[];
  gedungLamaCount: number;
  gedungBaruCount: number;
  totalPortions: number;
}

export interface TabulasiScheduleItem {
  time: string;
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  statusLabel: string;
  description: string;
}

export interface TabulasiBatchOption {
  id: number;
  batch_code: string;
  tanggal_produksi: string;
  waktu_makan: string; // PAGI | SIANG | MALAM | SNACK
  total_pasien: number;
  status_batch: string;
  cutoff_time?: string | null;
}

export interface TabulasiFilterState {
  date: string;
  mealTime: string; // 'Pagi' | 'Siang' | 'Malam' | 'Snack' | 'Semua'
  siklus?: number;
  gedung?: string;
  lantai?: string;
  kategori?: string;
  diet?: string;
  status?: string;
  search?: string;
}

/**
 * Hospital-specific Tabulation Table Row (matching physical hospital kitchen spreadsheet)
 */
export interface TabulasiHospitalItem {
  id: string;
  kategori: string; // e.g. "HEWANI KELAS I", "HEWANI KELAS II", "NABATI", "SAYUR", "TKTP", "EXTRA"
  nama_menu: string;
  kode_diet: string;
  porsi_gedung_lama: number;
  porsi_gedung_baru: number;
  total_porsi: number;
  is_tktp?: boolean; // Highlighted row (kuning di excel)
  catatan?: string;
}

export interface TabulasiHospitalCategoryGroup {
  kategori: string;
  items: TabulasiHospitalItem[];
  subtotalGedungLama: number;
  subtotalGedungBaru: number;
  subtotalSemua: number;
  isTktp?: boolean;
}

export interface TabulasiHospitalData {
  tanggal: string;
  tanggalFormatted: string;
  waktuMakan: string; // PAGI | SIANG | MALAM | SNACK
  siklusNomor: number;
  siklusNama: string;
  availableSiklus: Array<{ nomor_siklus: number; nama_siklus: string }>;
  statusBatch: string; // "OFFICIAL_LOCKED" | "LIVE_ACTIVE"
  batchCode: string;
  lastUpdated: string;
  
  // KPI Totals
  grandTotalPasien: number;
  grandTotalPorsi: number;
  totalGedungLama: number;
  totalGedungBaru: number;
  totalPasienMakan: number;
  totalPasienNpo: number;
  totalDietKhusus: number;

  // Grouped by Category for Hospital Table
  categoryGroups: TabulasiHospitalCategoryGroup[];
  allItems: TabulasiHospitalItem[];
}

export interface TabulasiDashboardData {
  success: boolean;
  batch: TabulasiBatchOption | null;
  availableBatches: TabulasiBatchOption[];
  summary: TabulasiPatientSummary;
  locationDistribution: TabulasiLocationGroup[];
  dietDistribution: TabulasiDietItem[];
  menuItems: TabulasiMenuItem[];
  snackSummary: TabulasiSnackSummary;
  schedule: TabulasiScheduleItem[];
  hospitalData: TabulasiHospitalData;
  lastUpdated: string;
}


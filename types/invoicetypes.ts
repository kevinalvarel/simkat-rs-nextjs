export interface DietBreakdownItem {
  bentuk: string;
  kategori: string;
  count: number;
}

export interface InvoiceClassConsumption {
  kelas: string; // "VIP", "Kelas 1", "Kelas 2", "Kelas 3", etc.
  pagiCount: number; // Porsi Makan Pagi
  siangCount: number; // Porsi Makan Siang
  malamCount: number; // Porsi Makan Malam
  extraCount: number; // Porsi Ekstra / Buah / Snack
  baselinePorsi?: number; // Porsi baseline awal snapshot
  revisiTambahPorsi?: number; // Porsi tambahan dari revisi tambah pasien
  totalPorsi: number; // baseline + revisiTambahPorsi
  totalPasien: number; // Jumlah pasien terlayani di kelas ini
  dietBreakdown: DietBreakdownItem[]; // Rincian bentuk makanan & diet
}

export interface InvoiceRevisionPatient {
  id: number;
  nama_pasien: string;
  no_rm: string;
  kelas: string;
  ruangan?: string;
  bed?: string;
  diet: string;
  waktu_makan: string;
  jenis_perubahan: string; // 'NEW_PATIENT'
  alasan?: string;
  requested_by?: string;
  requested_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface AvailableSnapshotBatch {
  id: number;
  batch_code: string;
  tanggal_produksi: string;
  waktu_makan: string; // PAGI | SIANG | MALAM
  status_batch: string;
  total_pasien: number;
  cutoff_time?: string | null;
}

export interface InvoiceDailySummary {
  tanggal: string; // YYYY-MM-DD
  tanggalFormatted: string; // e.g. "Sabtu, 29 Agustus 2026"
  invoiceNumber: string; // e.g. "INVOICE/GZ-RS/20260829-SIANG/BATCH-12"
  hospitalName: string;
  cateringVendor: string;
  statusBatch: 'OFFICIAL_LOCKED' | 'LIVE_PREVIEW';
  availableDates: string[];
  availableBatches?: AvailableSnapshotBatch[];

  // Snapshot / Batch Info
  batchId?: number | null;
  batchCode?: string | null;
  waktuMakan?: string; // 'PAGI' | 'SIANG' | 'MALAM' | 'ALL'
  isPerSnapshot?: boolean;
  cutoffTime?: string | null;

  // Post-Snapshot Revision Breakdown
  baselineTotalPorsi?: number;
  revisiTambahPasienCount?: number;
  revisiPatients?: InvoiceRevisionPatient[];

  // Totals
  grandTotalPagi: number;
  grandTotalSiang: number;
  grandTotalMalam: number;
  grandTotalExtra: number;
  grandTotalPorsi: number;
  grandTotalPasien: number;

  classes: InvoiceClassConsumption[];
  lastUpdated: string;

  // Range metadata
  isRange?: boolean;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  dailyBreakdown?: Array<{
    tanggal: string;
    tanggalFormatted: string;
    totalPasien: number;
    totalPorsi: number;
    pagi: number;
    siang: number;
    malam: number;
    extra: number;
  }>;
  dailySummaries?: InvoiceDailySummary[];
  snapshotSummaries?: InvoiceDailySummary[];
}

export interface InvoicePageProps {
  initialData: InvoiceDailySummary;
}

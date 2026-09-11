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

  // Diet TKTP aggregated portions
  tktpCounts?: {
    pagi: number;
    siang: number;
    malam: number;
    total: number;
  };

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

export interface ClassEntry {
  pagi: number;
  siang: number;
  malam: number;
  extra: number;
  baselinePorsi: number;
  revisiTambahPorsi: number;
  pasienSet: Set<string>;
  dietMap: Map<string, number>;
}

/** TKTP meal counters */
export interface TktpCounters {
  pagi: number;
  siang: number;
  malam: number;
}

/** Aggregation context shared across processing functions */
export interface AggregationContext {
  classMap: Map<string, ClassEntry>;
  tktp: TktpCounters;
  revisiPatients: InvoiceRevisionPatient[];
  isOfficialLocked: boolean;
  resolvedBatchId: number | null;
  resolvedBatchCode: string | null;
  resolvedCutoffTime: string | null;
}

/** Grand totals computed from classes array */
export interface GrandTotals {
  grandTotalPagi: number;
  grandTotalSiang: number;
  grandTotalMalam: number;
  grandTotalExtra: number;
  grandTotalPorsi: number;
  grandTotalPasien: number;
  baselineTotalPorsi: number;
  revisiTambahPasienCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SALES INVOICE (FAKTUR PENJUALAN) TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** A single line item in the Faktur Penjualan table */
export interface SalesInvoiceLineItem {
  no: number;
  namaBarang: string; // "TKTP" or "Makan Pasien"
  type: string; // "Kelas I", "Kelas II", "Kelas III", etc.
  banyaknya: number; // jumlah porsi
  satuan: string; // "Porsi"
  hargaSatuan: number; // harga per porsi (Rp)
  jumlahHarga: number; // banyaknya × hargaSatuan
}

/** Default harga satuan per kelas and per nama barang */
export interface SalesInvoicePriceConfig {
  tktpKelas1: number;
  tktpKelas2: number;
  tktpKelas3: number;
  makanPasienKelas1: number;
  makanPasienKelas2: number;
  makanPasienKelas3: number;
}

/** Extended summary for Faktur Penjualan with pricing */
export interface SalesInvoiceSummary extends InvoiceDailySummary {
  lineItems: SalesInvoiceLineItem[];
  totalBanyaknya: number;
  totalHarga: number;
  terbilang: string;
  priceConfig: SalesInvoicePriceConfig;
  // Monthly invoice support
  isMonthly?: boolean;
  bulan?: number; // 1-12
  tahun?: number; // e.g. 2026
  monthLabel?: string; // e.g. "Agustus 2026"
  dailySalesInvoices?: SalesInvoiceSummary[];
}

/** Props for the SalesInvoiceClient component */
export interface SalesInvoicePageProps {
  initialData: SalesInvoiceSummary;
}

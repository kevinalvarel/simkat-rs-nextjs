export interface PemorsianPatientItem {
  id: number;
  nama_pasien: string;
  no_rm: string;
  ruangan: string;
  ruangan_id?: string | number | null;
  kamar: string;
  gedung?: string;
  bed: string;
  diet: string;
  waktu: string; // Pagi | Siang | Malam
  status: string; // AKTIF | NPO | PULANG | EMERGENT
  kelas: string;
  batch_id?: number | null;
  batch_code?: string | null;
  is_emergent?: boolean;
  extra?: string | null;
  buah?: string | null;
  snack?: string | null;

  // Print & Revision Tracking
  print_status?: 'BELUM_DICETAK' | 'SUDAH_DICETAK' | 'BUTUH_REVISI';
  printed_at?: string | null;
  diet_lama?: string | null;
  revisi_note?: string | null;
}

export interface PemorsianBatchOption {
  id: number;
  batch_code: string;
  tanggal_produksi: string;
  waktu_makan: string; // PAGI | SIANG | MALAM
  total_pasien: number;
  status_batch: string;
  cutoff_time?: string | null;
}

export interface PemorsianDietCount {
  diet: string;
  count: number;
}

export interface DataDietDetail {
  diet?: string;
  gedung?: string;
  kamar?: string;
  ruangan?: string;
  bed?: string;
  kelas?: string;
  status_pasien?: string;
}

export interface PemorsianRevisiItem {
  id: number;
  pasien_id: number;
  no_rm: string;
  nama_pasien: string;
  gedung: string;
  ruangan: string;
  kamar?: string;
  bed: string;
  kelas: string;
  waktu_makan: string;
  jenis_perubahan: string; // DIET_CHANGE | ROOM_TRANSFER | NEW_PATIENT | DISCHARGE | NPO
  data_lama?: DataDietDetail | null;
  data_baru?: DataDietDetail | null;
  alasan: string;
  status: string; // PENDING | APPROVED | REJECTED | SELESAI
  dampak_dapur: string;
  requested_by: string;
  requested_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  batch_id?: number | null;
  batch_code?: string | null;
  revision_signature?: string;
  revision_print_status?: 'BELUM_DICETAK' | 'SUDAH_DICETAK';
  revision_printed_at?: string | null;
}

export interface PemorsianSummaryData {
  success: boolean;
  batch: PemorsianBatchOption | null;
  batchId?: number | null;
  batchCode?: string;
  waktuMakan?: string;
  tanggalProduksi?: string;
  statusBatch?: 'LIVE' | 'LOCKED';
  cutoffTime?: string;

  // Cycle & Day Info (consistent with Live Produksi)
  siklusKe?: number;
  namaSiklus?: string;
  hari?: string;
  tanggalFormatted?: string;
  deskripsiSiklus?: string;

  availableBatches: PemorsianBatchOption[];
  patients: PemorsianPatientItem[];
  revisiItems: PemorsianRevisiItem[];

  totalCount: number;
  totalPasien?: number;
  revisiCount: number;
  dietSummary: PemorsianDietCount[];
  activeCount: number;
  npoCount: number;

  // 3-Status Counts
  belumDicetakCount?: number;
  sudahDicetakCount?: number;
  butuhRevisiCount?: number;

  lastUpdated: string;
}

export interface PemorsianFilterState {
  search: string;
  gedung?: string;
  kamar?: string;
  ruangan: string;
  diet: string;
  status: string;
}

export type EtiketVariant = 'diet-focus' | 'ruangan-focus';

export interface EtiketData {
  nama: string;
  ruangan: string;
  bed: string;
  diet: string;
  waktu: string;
  no_rm?: string;
  kelas?: string;
  gedung?: string;
  kamar?: string;
  is_revisi?: boolean;
  keterangan_revisi?: string;
  tgl_lahir?: string;
  keterangan?: string;
  exp_date?: string;
  quote?: string;
  catatan_alat?: string;
}

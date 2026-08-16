export interface MonitoringCardData {
  code: string; // e.g. BN, TKTP, PUTEL, BL, RG, DM, NPO, UNMAPPED
  name: string; // Display name (e.g. Biasa Nasi, Tinggi Kalori Tinggi Protein, Putih Telur)
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
  cards: MonitoringCardData[];
  lastUpdated: string;
}

export interface OverviewProductionClientProps {
  initialData: MonitoringSummary;
}

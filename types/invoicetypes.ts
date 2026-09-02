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
  totalPorsi: number; // pagi + siang + malam + extra
  totalPasien: number; // Jumlah pasien terlayani di kelas ini
  dietBreakdown: DietBreakdownItem[]; // Rincian bentuk makanan & diet
}

export interface InvoiceDailySummary {
  tanggal: string; // YYYY-MM-DD
  tanggalFormatted: string; // e.g. "Sabtu, 29 Agustus 2026"
  invoiceNumber: string; // e.g. "REKAP/GZ-RS/20260829/001"
  hospitalName: string;
  cateringVendor: string;
  statusBatch: 'OFFICIAL_LOCKED' | 'LIVE_PREVIEW';
  availableDates: string[];

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
}

export interface InvoicePageProps {
  initialData: InvoiceDailySummary;
}

import type {
  PemorsianPatientItem,
  PemorsianBatchOption,
  PemorsianDietCount,
} from './pemorsiantypes';

export type DpmpPatientItem = PemorsianPatientItem;
export type DpmpBatchOption = PemorsianBatchOption;
export type DpmpDietCount = PemorsianDietCount;

export interface DpmpFilterState {
  search: string;
  ruangan: string;
  kamar: string;
  gedung?: string;
  kelas: string;
  diet: string;
  status: string;
}

export interface DpmpSummaryData {
  success: boolean;
  batch: DpmpBatchOption | null;
  availableBatches: DpmpBatchOption[];
  patients: DpmpPatientItem[];
  totalCount: number;
  activeCount: number;
  npoCount: number;
  emergentCount: number;
  dpmpNumber: string;
  kwitansiNumber?: string; // alias for backwards compatibility
  tanggalFormatted: string;
  waktuMakanFormatted: string;
  lastUpdated: string;
  selectedDate?: string;
  selectedWaktu?: 'PAGI' | 'SIANG' | 'MALAM';
  availableDates?: string[];
  existingWaktuForDate?: string[];
  currentLiveWaktu?: 'PAGI' | 'SIANG' | 'MALAM';
}

export interface DpmpPageProps {
  initialData: DpmpSummaryData;
}

// Aliases for backwards compatibility
export type KwitansiPatientItem = DpmpPatientItem;
export type KwitansiBatchOption = DpmpBatchOption;
export type KwitansiDietCount = DpmpDietCount;
export type KwitansiFilterState = DpmpFilterState;
export type KwitansiSummaryData = DpmpSummaryData;
export type KwitansiPageProps = DpmpPageProps;

import type {
  PemorsianPatientItem,
  PemorsianBatchOption,
  PemorsianDietCount,
} from './pemorsiantypes';

export type KwitansiPatientItem = PemorsianPatientItem;
export type KwitansiBatchOption = PemorsianBatchOption;
export type KwitansiDietCount = PemorsianDietCount;

export interface KwitansiFilterState {
  search: string;
  gedung: string;
  ruangan: string;
  kelas: string;
  diet: string;
  status: string;
}

export interface KwitansiSummaryData {
  success: boolean;
  batch: KwitansiBatchOption | null;
  availableBatches: KwitansiBatchOption[];
  patients: KwitansiPatientItem[];
  totalCount: number;
  activeCount: number;
  npoCount: number;
  emergentCount: number;
  kwitansiNumber: string;
  tanggalFormatted: string;
  waktuMakanFormatted: string;
  lastUpdated: string;
}

export interface KwitansiPageProps {
  initialData: KwitansiSummaryData;
}

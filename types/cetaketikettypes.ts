import type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
  PemorsianBatchOption,
} from './pemorsiantypes';

export type {
  PemorsianSummaryData,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  EtiketData,
  PemorsianBatchOption,
};

export type CetakEtiketTab = 'UTAMA' | 'REVISI';

export interface CetakEtiketFilterState {
  searchQuery: string;
  filterRuangan: string;
  filterKelas: string;
  filterDiet: string;
  filterStatus: string;
}

export interface CetakEtiketFilterOptions {
  ruangan: string[];
  kelas: string[];
  diet: string[];
}

export interface CetakEtiketStatsData {
  totalPasien: number;
  porsiDietAktif: number;
  pasienPuasa: number;
  terpilihCount: number;
  sudahDicetakCount?: number;
  belumDicetakCount?: number;
}

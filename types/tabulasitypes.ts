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
  gedung: string;
  lantai: string;
  diet: string;
  status: string;
  search: string;
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
  lastUpdated: string;
}

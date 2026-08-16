import type { GedungWithRuangan, RuanganItem } from '@/servers/tempat.service';
import type {
  WaktuMakanConfig,
  SnapshotBatch,
} from '@/servers/snapshot.service';

export type MealTimeType = 'Makan Pagi' | 'Makan Siang' | 'Makan Malam' | null;

export interface MealConfigItem {
  key: 'Makan Pagi' | 'Makan Siang' | 'Makan Malam';
  title: string;
  jenisMakan: 'PAGI' | 'SIANG' | 'MALAM';
  distribusi: string;
  defaultCutoff: string;
  bgLight: string;
}

export interface MealLockInfo {
  isLocked: boolean;
  isPreviousBatch: boolean;
  isOlderLocked: boolean;
  cutoffTime: string;
  hasBatchToday: boolean;
  isCutoffPassed: boolean;
  runningCycle: 'PAGI' | 'SIANG' | 'MALAM';
  prevCycle: 'PAGI' | 'SIANG' | 'MALAM';
}

export interface SelectionState {
  selectedMealTime: MealTimeType;
  selectedGedung: GedungWithRuangan | null;
  selectedRuangan: RuanganItem | null;
  gedungList: GedungWithRuangan[];
  waktuConfigs: WaktuMakanConfig[];
  snapshotBatches: SnapshotBatch[];
  isLoading: boolean;
}

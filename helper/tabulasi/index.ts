/**
 * Barrel re-export for all tabulasi helper utilities.
 * Import from '@/lib/tabulasi' instead of individual files.
 */

// Internal types (patient record, analyzed patient, etc.)
export type {
  TabulasiPatientRecord,
  ParsedPatientRevisionPayload,
  AnalyzedPatient,
  MasterMenuItemRow,
} from '@/types/tabulasitypes';

// Pure normalization helpers
export {
  getDefaultMealtime,
  normalizeKelas,
  buildMenuGroupTitle,
  menuGroupSortWeight,
} from './normalize';

// Async menu cycle resolver
export { determineAutomaticMenuCycle } from './cycle-resolver';

// Patient fetching & building resolution
export {
  buildRoomBuildingMap,
  resolvePatientBuilding,
  resolveTabulasiPatients,
} from './patient-resolver';

// Pure dish matching
export { matchPatientToDish, matchesDishKelas } from './dish-matcher';

// Supplement (snack/buah) aggregation
export { buildSupplementResult } from './supplement-builder';
export type { TabulasiSupplementKind } from './supplement-builder';

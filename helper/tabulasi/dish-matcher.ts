import type { AnalyzedPatient, MasterMenuItemRow } from '@/types/tabulasitypes';

/**
 * Match a pre-analyzed patient to a menu cycle dish item.
 *
 * Matching rules (in order):
 * 1. NPO patients never match any dish.
 * 2. Class matching — kanonis KELAS I/II/III + wildcard "Semua Kelas".
 *    Legacy "KELAS 1/2/3" and "KELAS 2 - 3" are still read for backward compat.
 * 3. Clinical diet tag matching — see tag rules below.
 */
export function matchPatientToDish( 
  patient: AnalyzedPatient,
  item: Pick<MasterMenuItemRow, 'kelas' | 'kategori_menu'>,
): boolean {
  if (patient.isNpo) return false;

  // 1. Class Matching
  const iKelas = (item.kelas || '').toUpperCase();
  const isSemuaKelas = iKelas.includes('SEMUA') || !iKelas;
  const isKelas1 =
    iKelas === 'I' ||
    iKelas === 'KELAS I' ||
    iKelas === 'KELAS 1' ||
    iKelas.includes('VIP');
  const isKelas2 =
    iKelas === 'II' || iKelas === 'KELAS II' || iKelas === 'KELAS 2';
  const isKelas3 =
    iKelas === 'III' || iKelas === 'KELAS III' || iKelas === 'KELAS 3';
  const isLegacyGabungan23 =
    (iKelas.includes('2') && iKelas.includes('3')) ||
    iKelas.includes('II-III') ||
    iKelas.includes('II - III');

  if (!isSemuaKelas) {
    if (patient.kelasType === 'KELAS_1') {
      if (!isKelas1 && !isLegacyGabungan23) return false;
    } else if (patient.kelasType === 'KELAS_2') {
      if (!isKelas2 && !isLegacyGabungan23) return false;
    } else if (patient.kelasType === 'KELAS_3') {
      if (!isKelas3 && !isLegacyGabungan23) return false;
    }
  }

  // 2. Clinical Diet Tag Matching
  const tag = (item.kategori_menu || '').toUpperCase();
  if (!tag || tag === 'B') {
    return (
      patient.isBiasa ||
      (!patient.isDm &&
        !patient.isRg &&
        !patient.isRp &&
        !patient.isRs &&
        !patient.isDj &&
        !patient.isSaring)
    );
  }

  if (tag.includes('DM') && patient.isDm) return true;
  if (tag.includes('RG') && patient.isRg) return true;
  if (tag.includes('RS') && patient.isRs) return true;
  if (tag.includes('RP') && patient.isRp) return true;
  if (tag.includes('DJ') && patient.isDj) return true;
  if (tag.includes('RL') && patient.isRl) return true;
  if (tag.includes('RKOL') && patient.isRkol) return true;
  if (tag.includes('SARING') && patient.isSaring) return true;
  if (tag.includes('TKTP') && patient.isTktp) return true;

  return false;
}

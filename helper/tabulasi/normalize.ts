/**
 * Pure normalization utilities for tabulasi.
 * No side effects, no DB access — safe to import anywhere.
 */

/**
 * Determine default mealtime based on current local hour.
 */
export function getDefaultMealtime(): 'PAGI' | 'SIANG' | 'MALAM' {
  const hour = new Date().getHours();
  if (hour < 10) return 'PAGI';
  if (hour < 15) return 'SIANG';
  return 'MALAM';
}

/**
 * Standardisasi ke kanonis KELAS I/II/III (legacy VIP/VVIP → KELAS_1).
 * Kategori hidangan siklus-menu tetap memakai nilai sistem + "Semua Kelas".
 */
export function normalizeKelas(
  rawKelas: string | null | undefined,
): 'KELAS_1' | 'KELAS_2' | 'KELAS_3' {
  if (!rawKelas) return 'KELAS_3';
  const u = rawKelas.toUpperCase();
  if (u.includes('1') || u === 'I' || u.includes('VIP')) return 'KELAS_1';
  if (u.includes('2') || u === 'II') return 'KELAS_2';
  return 'KELAS_3';
}

/**
 * Build the display group title for a menu item based on jenis_makanan and kelas.
 * Used by the category aggregation loop in the makan service.
 */
export function buildMenuGroupTitle(jenisMakanan: string, kelas: string): string {
  const jm = (jenisMakanan || 'MENU').toUpperCase();
  const kl = (kelas || '').toUpperCase();

  if (kl === 'I' || kl === 'KELAS I' || kl === 'KELAS 1' || kl.includes('VIP')) {
    return `${jm} KELAS I`;
  }
  if (kl === 'II' || kl === 'KELAS II' || kl === 'KELAS 2') {
    return `${jm} KELAS II`;
  }
  if (kl === 'III' || kl === 'KELAS III' || kl === 'KELAS 3') {
    return `${jm} KELAS III`;
  }
  if (kl.includes('2') && kl.includes('3')) {
    return `${jm} KELAS II-III (LEGACY)`;
  }
  return `${jm} SEMUA KELAS`;
}

/**
 * Sort weight for category groups — determines culinary display sequence.
 */
export function menuGroupSortWeight(catName: string): number {
  const u = catName.toUpperCase();
  if (u.includes('POKOK') || u.includes('BERAS') || u.includes('NASI')) return 10;
  if (u.includes('HEWANI & NABATI')) return 25;
  if (u.includes('HEWANI')) return 20;
  if (u.includes('NABATI & SAYUR')) return 35;
  if (u.includes('NABATI')) return 30;
  if (u.includes('SAYUR')) return 40;
  if (u.includes('HEWANI & SAYUR')) return 45;
  if (u.includes('SARING')) return 50;
  if (u.includes('EXTRA') && !u.includes('TKTP')) return 60;
  if (u.includes('BUAH')) return 70;
  if (u.includes('SNACK')) return 80;
  if (u.includes('TKTP')) return 90;
  return 100;
}

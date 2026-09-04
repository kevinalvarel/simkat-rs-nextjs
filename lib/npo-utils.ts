/**
 * Centralized utility functions for determining and handling NPO (Nil Per Os / Puasa)
 * across all system modules: DPMP, Invoice, Tabulasi, Live Produksi, and Pemorsian.
 */

export interface PatientNpoCheckInput {
  is_npo?: boolean | null;
  status_pasien?: string | null;
  status_saat_snapshot?: string | null;
  diet?: string | null;
  diet_rs_raw?: string | null;
  bentuk_makanan?: string | null;
  kategori_diet?: string | null;
  status?: string | null;
  jenis_perubahan?: string | null;
  nama_pasien?: string | null;
}

/**
 * Checks whether a raw diet string explicitly indicates fasting / NPO.
 */
export function isNpoDietText(dietText?: string | null): boolean {
  if (!dietText) return false;
  const upper = dietText.trim().toUpperCase();
  return (
    upper === 'NPO' ||
    upper === 'PUASA' ||
    upper.includes('NPO') ||
    upper.includes('PUASA') ||
    upper.includes('NIL PER OS')
  );
}

/**
 * Universal detector for NPO / Puasa patients.
 * Returns true if the patient has any indicator of being medically fasted.
 */
export function isNpoPatient(record?: PatientNpoCheckInput | any): boolean {
  if (!record) return false;

  // 1. Explicit boolean flag
  if (record.is_npo === true) return true;

  // 2. Status flags
  const status = (record.status_pasien || record.status_saat_snapshot || record.status || '').trim().toUpperCase();
  if (status === 'NPO' || status === 'PUASA') return true;

  // 3. Revision change type
  if (record.jenis_perubahan?.trim().toUpperCase() === 'NPO') return true;

  // 4. Clinical diet text
  if (isNpoDietText(record.diet)) return true;
  if (isNpoDietText(record.diet_rs_raw)) return true;

  // 5. Diet mapping codes (master mapping results)
  const bentuk = (record.bentuk_makanan || '').trim().toUpperCase();
  const kategori = (record.kategori_diet || '').trim().toUpperCase();
  if (bentuk === 'NPO' || bentuk === 'PUASA' || kategori === 'NPO' || kategori === 'PUASA') {
    return true;
  }

  return false;
}

/**
 * Filters a list of patients, keeping only those who are active feeding patients (NOT NPO).
 */
export function filterFeedingPatients<T extends PatientNpoCheckInput>(patients: T[]): T[] {
  return patients.filter((p) => !isNpoPatient(p));
}

/**
 * Filters a list of patients, keeping only those who are NPO.
 */
export function filterNpoPatients<T extends PatientNpoCheckInput>(patients: T[]): T[] {
  return patients.filter((p) => isNpoPatient(p));
}

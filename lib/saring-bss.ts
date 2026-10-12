import { SARING_BENTUK_CODE } from '@/lib/mapping-diet-fields';

/**
 * Aturan dapur: pasien bentuk makanan Saring yang ter-mapping karbohidrat
 * BSS ASIN otomatis dihitung sebagai BSS MANIS pada waktu PAGI dan MALAM
 * (makanan saring pagi/malam hanya disajikan manis; yang asin khusus siang).
 *
 * - Pemicu KETAT: kode karbohidrat persis `BSS ASIN` + kode bentuk persis
 *   `SARING` (case-insensitive, toleran spasi). Varian lain tidak tersentuh.
 * - SIANG tidak dinormalisasi (mengikuti mapping apa adanya).
 * - Murni display-level: pemanggil memakai hasil fungsi ini untuk resolve
 *   hidangan; nilai yang tersimpan di DB TIDAK diubah.
 */

export const BSS_ASIN_CODE = 'BSS ASIN';
export const BSS_MANIS_CODE = 'BSS MANIS';

/** Waktu produksi yang memaksa BSS ASIN menjadi BSS MANIS. */
const BSS_MANIS_WAKTU = new Set(['PAGI', 'MALAM', 'SORE']);

const norm = (v: string | null | undefined) => (v || '').trim().toUpperCase();

/** True bila daftar kode bentuk memuat SARING persis. */
export function hasSaringBentuk(bentukCodes: string[]): boolean {
  return (bentukCodes || []).some((c) => norm(c) === SARING_BENTUK_CODE);
}

/**
 * Normalisasi display-level daftar kode karbohidrat untuk satu waktu makan.
 * Kembalikan array baru; input tidak dimutasi.
 */
export function normalizeSaringKarboForWaktu(
  bentukCodes: string[],
  karboCodes: string[],
  waktuMakan: string | null | undefined,
): string[] {
  const waktu = norm(waktuMakan);
  if (!BSS_MANIS_WAKTU.has(waktu)) return [...(karboCodes || [])];
  if (!hasSaringBentuk(bentukCodes)) return [...(karboCodes || [])];
  return (karboCodes || []).map((code) =>
    norm(code) === BSS_ASIN_CODE ? BSS_MANIS_CODE : code,
  );
}

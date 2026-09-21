/**
 * Utilitas kanonis untuk Kelas perawatan.
 * Satu-satunya sumber kebenaran untuk fallback & normalisasi legacy.
 * Nilai kanonis: "KELAS I", "KELAS II", "KELAS III".
 * "Semua Kelas" adalah wildcard khusus siklus-menu, bukan kelas perawatan.
 */

/** Daftar seed kanonis — dipakai seed.ts & fallback darurat saat tabel kosong */
export const KELAS_SEED = ['KELAS I', 'KELAS II', 'KELAS III'] as const;

/** Fallback tunggal saat nilai kosong — selalu ambil dari sistem (DB), ini hanya darurat */
export const KELAS_FALLBACK = 'KELAS I';

/**
 * Normalisasi varian legacy ke kanonis:
 * "Kelas 1", "KELAS 1", "Kelas I", "1", "I" -> "KELAS I", dst.
 * "VIP" / "VVIP" (legacy, sudah dihapus) -> "KELAS I".
 * "Kelas 2 - 3" / gabungan II+III -> dikembalikan apa adanya (ditangani matcher),
 *   kecuali untuk konteks single-value via normalizeKelasSingle().
 */
export function normalizeKelasName(
  raw: string | null | undefined,
  fallback: string = KELAS_FALLBACK,
): string {
  if (!raw || !raw.trim()) return fallback;
  const k = raw.trim();
  const u = k.toUpperCase();
  if (u === 'VIP' || u === 'VVIP' || u.includes('VIP')) return 'KELAS I';
  if (u === '1' || u === 'I' || u === 'KELAS 1' || u === 'KELAS I' || u === 'KELAS_I')
    return 'KELAS I';
  if (u === '2' || u === 'II' || u === 'KELAS 2' || u === 'KELAS II')
    return 'KELAS II';
  if (u === '3' || u === 'III' || u === 'KELAS 3' || u === 'KELAS III')
    return 'KELAS III';
  // Varian mengandung angka romawi/arab tanpa kata KELAS
  if (u.includes('1') && !u.includes('2') && !u.includes('3')) {
    if (u.includes('I') || u.includes('1')) return 'KELAS I';
  }
  // Gabungan legacy "KELAS 2 - 3" — biarkan apa adanya untuk matcher
  if (u.includes('2') && u.includes('3')) return k.toUpperCase() === k ? k : k.trim();
  if (u.includes('2') || u === 'II') return 'KELAS II';
  if (u.includes('3') || u === 'III') return 'KELAS III';
  if (u.includes('1') || u === 'I') return 'KELAS I';
  return k;
}

/** Normalisasi ketat untuk konteks single-value (ruangan/kamar/pasien): gabungan dipetakan ke KELAS II */
export function normalizeKelasSingle(
  raw: string | null | undefined,
  fallback: string = KELAS_FALLBACK,
): string {
  const norm = normalizeKelasName(raw, fallback);
  const u = norm.toUpperCase();
  if (u.includes('2') && u.includes('3')) return 'KELAS II';
  return norm;
}

/** Palet badge generik berbasis index — tidak ada mapping nama hardcoded */
const KELAS_BADGE_PALETTE = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
];

/** Urutan kanonis untuk sorting — index di daftar sistem, bukan object hardcoded */
export function getKelasSortWeight(kelas: string, orderedList: string[]): number {
  const idx = orderedList.findIndex(
    (k) => k.toUpperCase() === (kelas || '').toUpperCase(),
  );
  if (idx !== -1) return idx;
  // Legacy gabungan "KELAS 2 - 3" diletakkan setelah KELAS II
  const u = (kelas || '').toUpperCase();
  if (u.includes('2') && u.includes('3')) {
    const ii = orderedList.findIndex((k) => k.toUpperCase() === 'KELAS II');
    return ii !== -1 ? ii + 0.5 : 99;
  }
  // "Semua Kelas" (wildcard) selalu terakhir
  if (u.includes('SEMUA')) return 999;
  return 99;
}

/** Badge style generik: prioritaskan index di daftar sistem agar konsisten */
export function getKelasBadgeStyle(kelas: string, orderedList: string[] = []): string {
  const w = getKelasSortWeight(kelas, orderedList);
  if (Number.isFinite(w) && w >= 0 && w < 100) {
    return KELAS_BADGE_PALETTE[Math.floor(w) % KELAS_BADGE_PALETTE.length];
  }
  // Fallback hash sederhana untuk kelas custom (tanpa hardcoded nama)
  let h = 0;
  const s = (kelas || '').toUpperCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return KELAS_BADGE_PALETTE[h % KELAS_BADGE_PALETTE.length];
}

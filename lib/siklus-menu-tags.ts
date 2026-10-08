export interface MenuTagOption {
  kode: string;
  label: string;
  kategori: string;
}

/**
 * Kode tag fallback universal: hidangan penampung untuk diet yang tidak
 * terdaftar spesifik di slot jam tersebut (mis. DH tidak ada hidangannya
 * di Siang → pasien DH memakai hidangan DIIT slot itu).
 * Selalu tersedia di semua jenis makanan tanpa perlu baris master khusus.
 */
export const DIIT_TAG_CODE = "DIIT";
export const DIIT_TAG_LABEL = "DIIT (fallback diet tak terdaftar)";

/**
 * True bila nilai kategori_menu (CSV multi-tag) memuat token DIIT
 * (case-insensitive) — hidangan penampung diet tak terdaftar spesifik.
 */
export function hasDiitTag(value: string | null | undefined): boolean {
  return parseMenuTags(value).some(
    (tag) => tag.trim().toUpperCase() === DIIT_TAG_CODE,
  );
}

export function parseMenuTags(value: string | null | undefined): string[] {
  return (value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getMenuTagOptions(
  options: MenuTagOption[],
  jenisMakanan: string | null | undefined,
): MenuTagOption[] {
  const category = (jenisMakanan || '').trim().toUpperCase();
  const seen = new Set<string>();

  const result = options.filter((option) => {
    const code = option.kode.trim().toUpperCase();
    if (!code || option.kategori.trim().toUpperCase() !== category || seen.has(code)) {
      return false;
    }
    seen.add(code);
    return true;
  });

  // Tag DIIT selalu tersedia sebagai fallback universal di semua jenis.
  if (category && !seen.has(DIIT_TAG_CODE)) {
    result.push({ kode: DIIT_TAG_CODE, label: DIIT_TAG_LABEL, kategori: category });
  }

  return result;
}

export function normalizeMenuTags(
  value: string | null | undefined,
  options: MenuTagOption[],
): { codes: string[]; invalid: string[] } {
  const allowed = new Map(options.map((option) => [option.kode.trim().toUpperCase(), option.kode]));
  const codes: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const tag of parseMenuTags(value)) {
    const key = tag.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const canonical = allowed.get(key);
    if (canonical) codes.push(canonical);
    else invalid.push(tag);
  }

  return { codes, invalid };
}

/**
 * Diet gabungan bersifat implisit: hidangan dengan >1 tag otomatis
 * dianggap diet gabungan dari tag-tag tersebut. Tidak ada lagi
 * kolom / input nama diet gabungan terpisah.
 */
export function countUniqueMenuTags(
  value: string | null | undefined,
): number {
  const seen = new Set<string>();
  for (const tag of parseMenuTags(value)) {
    const key = tag.trim().toUpperCase();
    if (key) seen.add(key);
  }
  return seen.size;
}

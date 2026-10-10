export interface MenuTagOption {
  kode: string;
  label: string;
  kategori: string;
  /** True bila diet ditandai sebagai Diet Makanan Saring di Konfigurasi Menu. */
  isSaring?: boolean;
}

/**
 * Kode tag fallback universal: hidangan penampung untuk diet yang tidak
 * terdaftar spesifik di slot jam tersebut (mis. DH tidak ada hidangannya
 * di Siang → pasien DH memakai hidangan DIIT slot itu).
 * Tersedia di semua jenis makanan kecuali KARBOHIDRAT — karbohidrat wajib
 * punya minimal 1 tag diet spesifik dan tidak memakai fallback DIIT.
 * Tanpa perlu baris master khusus.
 */
export const DIIT_TAG_CODE = "DIIT";
export const DIIT_TAG_LABEL = "DIIT (fallback diet tak terdaftar)";

/** Jenis yang tidak memakai fallback DIIT (wajib tag spesifik). */
export const NO_DIIT_FALLBACK_JENIS = new Set(["KARBOHIDRAT"]);

export function isNoDiitFallbackJenis(
  jenisMakanan: string | null | undefined,
): boolean {
  return NO_DIIT_FALLBACK_JENIS.has(
    (jenisMakanan || "").trim().toUpperCase(),
  );
}

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
  // Slot SARING tidak punya kategori master sendiri: opsinya adalah diet
  // dari semua kategori yang berflag Diet Makanan Saring di Konfigurasi Menu.
  const isSaringSlot = category === 'SARING';

  const result = options.filter((option) => {
    const code = option.kode.trim().toUpperCase();
    if (!code || seen.has(code)) {
      return false;
    }
    if (isSaringSlot) {
      if (!option.isSaring) return false;
    } else if (option.kategori.trim().toUpperCase() !== category) {
      return false;
    }
    seen.add(code);
    return true;
  });

  // Tag DIIT sebagai fallback universal di semua jenis, kecuali KARBOHIDRAT
  // yang wajib memakai tag diet spesifik dari Konfigurasi Master Menu.
  if (
    category &&
    !seen.has(DIIT_TAG_CODE) &&
    !NO_DIIT_FALLBACK_JENIS.has(category)
  ) {
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

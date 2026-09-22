export interface MenuTagOption {
  kode: string;
  label: string;
  kategori: string;
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

  return options.filter((option) => {
    const code = option.kode.trim().toUpperCase();
    if (!code || option.kategori.trim().toUpperCase() !== category || seen.has(code)) {
      return false;
    }
    seen.add(code);
    return true;
  });
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

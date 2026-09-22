import type { SiklusDietOption } from '@/servers/siklus-menu.service';
import type { KategoriMenuOption } from '@/servers/mapping-diet.service';

export const FOOD_FIELDS = [
  'bentuk_makanan',
  'kategori_diet',
  'nabati',
  'sayur',
  'buah',
  'snack',
] as const;

export type FoodField = (typeof FOOD_FIELDS)[number];

export type MappingMode = 'STANDARD' | 'NPO';

export function modeFromBentukMakanan(value: string | null | undefined): MappingMode {
  return value === 'NPO' ? 'NPO' : 'STANDARD';
}

export function selectBentukMakanan<T extends { hewani: string; nabati: string; sayur: string; buah: string; snack: string }>(
  current: T,
  bentukMakanan: string,
): T & { bentukMakanan: string; mode: MappingMode } {
  const mode = modeFromBentukMakanan(bentukMakanan);
  const clean = (value: string) => (value === 'NPO' ? '' : value);
  return {
    ...current,
    bentukMakanan,
    mode,
    hewani: mode === 'NPO' ? 'NPO' : clean(current.hewani),
    nabati: mode === 'NPO' ? 'NPO' : clean(current.nabati),
    sayur: mode === 'NPO' ? 'NPO' : clean(current.sayur),
    buah: mode === 'NPO' ? 'NPO' : clean(current.buah),
    snack: mode === 'NPO' ? 'NPO' : clean(current.snack),
  };
}

export function mergeFoodMapping(
  existing: Partial<Record<FoodField, string | null | undefined>>,
  patch: Partial<Record<FoodField, string | null | undefined>>,
): Record<FoodField, string | null> {
  return Object.fromEntries(FOOD_FIELDS.map((field) => [
    field,
    patch[field]?.trim() || existing[field]?.trim() || null,
  ])) as Record<FoodField, string | null>;
}

export function hasFoodMapping(values: Record<FoodField, string | null | undefined>): boolean {
  return FOOD_FIELDS.some((field) => Boolean(values[field]?.trim()));
}

export function hasFormFoodMapping(values: {
  bentukMakanan?: string | null;
  hewani?: string | null;
  nabati?: string | null;
  sayur?: string | null;
  buah?: string | null;
  snack?: string | null;
}): boolean {
  return [values.bentukMakanan, values.hewani, values.nabati, values.sayur, values.buah, values.snack]
    .some((value) => Boolean(value?.trim()));
}

// ─── Tugas AG Katering (otomatis via flag kategori_menu.is_tugas_ag_katering) ──

export interface TugasKateringOption {
  kodeItem: string;
  isTugasAgKatering?: boolean | null;
}

/** Set kode bentuk (uppercase) yang berflag tugas AG Katering. */
export function getTugasKateringCodes(
  options: TugasKateringOption[],
): Set<string> {
  return new Set(
    options
      .filter((o) => o.isTugasAgKatering)
      .map((o) => o.kodeItem.trim().toUpperCase())
      .filter(Boolean),
  );
}

/** True bila nilai bentuk makanan mengandung kode yang berflag tugas AG Katering. */
export function isBentukTugasKatering(
  bentukMakanan: string | null | undefined,
  tugasCodes: Set<string>,
): boolean {
  if (!bentukMakanan || tugasCodes.size === 0) return false;
  return bentukMakanan
    .split(/[,;/]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .some((code) => tugasCodes.has(code));
}

/**
 * True untuk data lama era "Alihkan ke AG Katering" manual
 * (status/bentuk/kategori berisi sentinel 'KATERING').
 */
export function isLegacyKateringMapping(item: {
  status_mapping?: string | null;
  bentuk_makanan?: string | null;
  kategori_diet?: string | null;
}): boolean {
  const has = (v: string | null | undefined) =>
    (v || '').trim().toUpperCase() === 'KATERING';
  return (
    (item.status_mapping || '').trim().toUpperCase() === 'KATERING' ||
    has(item.bentuk_makanan) ||
    has(item.kategori_diet)
  );
}

// ─── Opsi mapping diet dari data siklus menu ────────────────────────────────

/**
 * Ubah opsi diet siklus menjadi bentuk KategoriMenuOption untuk satu jenis
 * makanan (HEWANI | NABATI | SAYUR | BUAH | SNACK) agar kompatibel dengan
 * SelectField / CategorySelectCell yang sudah ada.
 */
export function siklusDietOptionsForKind(
  siklusOptions: SiklusDietOption[],
  kind: string,
): KategoriMenuOption[] {
  return siklusOptions
    .filter((o) => o.jenisMakanan === kind)
    .map((o, idx) => ({
      id: 1_000_000 + idx,
      namaKategori: o.jenisMakanan,
      kodeItem: o.kode,
      labelItem: o.label,
      isTugasAgKatering: false,
    }));
}

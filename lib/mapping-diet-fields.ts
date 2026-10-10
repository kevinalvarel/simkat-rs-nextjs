import type { SiklusDietOption } from '@/servers/siklus-menu.service';
import type { KategoriMenuOption } from '@/servers/mapping-diet.service';

export const FOOD_FIELDS = [
  'bentuk_makanan',
  'karbohidrat',
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

export function selectBentukMakanan<T extends { karbohidrat: string; hewani: string; nabati: string; sayur: string; buah: string; snack: string }>(
  current: T,
  bentukMakanan: string,
): T & { bentukMakanan: string; mode: MappingMode } {
  const mode = modeFromBentukMakanan(bentukMakanan);
  const clean = (value: string) => (value === 'NPO' ? '' : value);
  return {
    ...current,
    bentukMakanan,
    mode,
    karbohidrat: mode === 'NPO' ? 'NPO' : clean(current.karbohidrat),
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
  karbohidrat?: string | null;
  hewani?: string | null;
  nabati?: string | null;
  sayur?: string | null;
  buah?: string | null;
  snack?: string | null;
}): boolean {
  return [values.bentukMakanan, values.karbohidrat, values.hewani, values.nabati, values.sayur, values.buah, values.snack]
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

// ─── Mode Saring ( dipicu BENTUK_MAKANAN = SARING persis ) ───────────────────

/** Kode bentuk makanan yang mengaktifkan mode Saring. Hanya SARING persis (bukan SAR). */
export const SARING_BENTUK_CODE = 'SARING';

/**
 * True bila nilai bentuk makanan memuat kode SARING persis (case-insensitive,
 * toleran CSV `,`/`;`/`/` dan spasi). `SAR` saja tidak memicu.
 */
export function isBentukSaring(
  bentukMakanan: string | null | undefined,
): boolean {
  if (!bentukMakanan) return false;
  return bentukMakanan
    .split(/[,;/]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .some((code) => code === SARING_BENTUK_CODE);
}

export interface SaringAwareOption {
  kodeItem: string;
  namaKategori?: string | null;
  isDietSaring?: boolean | null;
}

const normalizeKode = (v: string | null | undefined) =>
  (v || '').trim().toUpperCase();

/** Set kode (uppercase) yang berflag Diet Makanan Saring di master. */
export function getSaringDietCodes(
  options: SaringAwareOption[],
): Set<string> {
  return new Set(
    options
      .filter((o) => o.isDietSaring)
      .map((o) => normalizeKode(o.kodeItem))
      .filter(Boolean),
  );
}

/**
 * Opsi master per kategori dengan partisi Saring ketat:
 * - isSaring=true  → hanya kode berflag Saring di kategori itu
 * - isSaring=false → hanya kode non-Saring di kategori itu
 */
export function getMasterOptionsForKind(
  options: KategoriMenuOption[],
  kind: string,
  isSaring: boolean,
): KategoriMenuOption[] {
  const kindUpper = kind.trim().toUpperCase();
  return options.filter(
    (o) =>
      (o.namaKategori || '').trim().toUpperCase() === kindUpper &&
      ((o.isDietSaring ?? false) === isSaring),
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

/**
 * Opsi Hewani gabungan master + siklus dengan partisi Saring:
 * - Mode Saring → hanya master HEWANI berflag Saring (siklus tidak punya baris
 *   SARING di SIKLUS_DIET_JENIS, jadi tidak ada sumber siklus untuk Saring).
 * - Mode reguler → union master HEWANI non-Saring + tag HEWANI siklus,
 *   dedup case-insensitive, buang DIIT, buang kode siklus yang di master
 *   berflag Saring. Label prioritas master.
 */
export function hewaniMappingOptions(
  masterOptions: KategoriMenuOption[],
  siklusOptions: SiklusDietOption[],
  isSaring: boolean,
): KategoriMenuOption[] {
  if (isSaring) {
    return getMasterOptionsForKind(masterOptions, 'HEWANI', true);
  }
  const labelMap = new Map<string, string>();
  for (const m of masterOptions) {
    if ((m.namaKategori || '').trim().toUpperCase() !== 'HEWANI') continue;
    if (m.isDietSaring) continue;
    const key = normalizeKode(m.kodeItem);
    if (key && !labelMap.has(key)) labelMap.set(key, m.labelItem);
  }
  const saringCodes = getSaringDietCodes(masterOptions);
  const seen = new Set<string>();
  const result: KategoriMenuOption[] = [];
  const push = (
    kodeItem: string,
    labelItem: string,
    namaKategori: string,
    id: number,
  ) => {
    const key = normalizeKode(kodeItem);
    if (!key || key === 'DIIT' || seen.has(key)) return;
    if (saringCodes.has(key)) return;
    seen.add(key);
    result.push({ id, namaKategori, kodeItem, labelItem });
  };
  masterOptions
    .filter(
      (o) =>
        (o.namaKategori || '').trim().toUpperCase() === 'HEWANI' &&
        !(o.isDietSaring ?? false),
    )
    .forEach((o) => push(o.kodeItem, o.labelItem, o.namaKategori, o.id));
  siklusDietOptionsForKind(siklusOptions, 'HEWANI').forEach((o, idx) =>
    push(
      o.kodeItem,
      labelMap.get(normalizeKode(o.kodeItem)) ?? o.labelItem,
      'HEWANI',
      1_000_000 + idx,
    ),
  );
  return result.sort((a, b) =>
    a.kodeItem.localeCompare(b.kodeItem, 'id', { sensitivity: 'base' }),
  );
}

/**
 * Transisi saat Bentuk Makanan berubah: NPO tetap seperti semula; masuk/keluar
 * SARING mengosongkan kolom yang dipartisi (karbo/hewani/nabati/sayur/buah)
 * agar tidak tersisa nilai basi lintas mode. Snack dipertahankan.
 */
export function applyBentukSaringTransition<
  T extends {
    karbohidrat: string;
    hewani: string;
    nabati: string;
    sayur: string;
    buah: string;
    snack: string;
  },
>(
  current: T,
  bentukMakanan: string,
  prevBentuk?: string | null,
): T & { bentukMakanan: string; mode: MappingMode; isSaring: boolean } {
  const withMode = selectBentukMakanan(current, bentukMakanan);
  const isSaring = isBentukSaring(withMode.bentukMakanan);
  const prevBentukValue =
    prevBentuk ??
    (current as unknown as Record<string, unknown>).bentukMakanan ??
    (current as unknown as Record<string, unknown>).bentuk_makanan ??
    null;
  const wasSaring = isBentukSaring(
    typeof prevBentukValue === 'string' ? prevBentukValue : null,
  );
  if (withMode.mode === 'NPO' || isSaring === wasSaring) {
    return { ...withMode, isSaring };
  }
  return {
    ...withMode,
    karbohidrat: '',
    hewani: '',
    nabati: '',
    sayur: '',
    buah: '',
    isSaring,
  };
}

export type SaringPartitionValues = {
  karbohidrat?: string | null;
  hewani?: string | null;
  nabati?: string | null;
  sayur?: string | null;
  buah?: string | null;
};

/**
 * Validasi client-side partisi Saring per field (tanpa snack). Kembalikan
 * daftar pesan error; kosong berarti valid. Dipakai sebelum submit agar
 * kesalahan langsung terlihat tanpa menunggu server.
 */
export function validateSaringPartition(
  values: SaringPartitionValues,
  saringCodes: Set<string>,
  isSaring: boolean,
): string[] {
  const errors: string[] = [];
  const entries: Array<[string, string | null | undefined]> = [
    ['Karbohidrat', values.karbohidrat],
    ['Hewani', values.hewani],
    ['Nabati', values.nabati],
    ['Sayur', values.sayur],
    ['Buah', values.buah],
  ];
  for (const [label, raw] of entries) {
    const codes = (raw || '')
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const code of codes) {
      const upper = code.toUpperCase();
      if (upper === 'NPO') continue;
      const flagged = saringCodes.has(upper);
      if (isSaring && !flagged) {
        errors.push(`${label} "${code}" bukan diet Saring aktif.`);
      } else if (!isSaring && flagged) {
        errors.push(`${label} "${code}" adalah diet Saring; pilih Bentuk SARING.`);
      }
    }
  }
  return errors;
}

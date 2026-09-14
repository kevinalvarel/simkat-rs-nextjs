export const FOOD_FIELDS = [
  'bentuk_makanan',
  'kategori_diet',
  'nabati',
  'sayur',
  'buah',
  'snack',
] as const;

export type FoodField = (typeof FOOD_FIELDS)[number];

export type MappingMode = 'STANDARD' | 'NPO' | 'KATERING';

export function modeFromBentukMakanan(value: string | null | undefined): MappingMode {
  return value === 'NPO' ? 'NPO' : value === 'KATERING' ? 'KATERING' : 'STANDARD';
}

export function selectBentukMakanan<T extends { hewani: string; nabati: string; sayur: string; buah: string; snack: string }>(
  current: T,
  bentukMakanan: string,
): T & { bentukMakanan: string; mode: MappingMode } {
  const mode = modeFromBentukMakanan(bentukMakanan);
  const clean = (value: string) => value === 'NPO' || value === 'KATERING' ? '' : value;
  return {
    ...current,
    bentukMakanan,
    mode,
    hewani: mode === 'NPO' ? 'NPO' : mode === 'KATERING' ? 'KATERING' : clean(current.hewani),
    nabati: mode === 'NPO' ? 'NPO' : mode === 'KATERING' ? '' : clean(current.nabati),
    sayur: mode === 'NPO' ? 'NPO' : mode === 'KATERING' ? '' : clean(current.sayur),
    buah: mode === 'NPO' ? 'NPO' : mode === 'KATERING' ? '' : clean(current.buah),
    snack: mode === 'NPO' ? 'NPO' : mode === 'KATERING' ? '' : clean(current.snack),
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

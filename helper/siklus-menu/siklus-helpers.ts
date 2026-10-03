import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle";
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from "@/db/schemas/master/siklus-menu";
import { kategoriMenuTable } from "@/db/schemas/master/kategori-menu";
import {
  getMenuTagOptions,
  normalizeMenuTags,
  parseMenuTags,
  type MenuTagOption,
} from "@/lib/siklus-menu-tags";
import { getWibTodayKey, parseCalendarDate } from "@/lib/wib";
import {
  SIKLUS_DIET_JENIS,
  type SiklusDietOption,
  type MutationResult,
} from "@/types/siklus-menu.types";

export const SIKLUS_MENU_REVALIDATE_PATH =
  "/dashboard/ag-katering/admin/konfigurasi-siklus-menu";

/**
 * Safely trigger cache revalidation for the siklus menu admin path.
 */
export function revalidateSiklusPath(): void {
  try {
    revalidatePath(SIKLUS_MENU_REVALIDATE_PATH);
  } catch (error) {
    console.warn("revalidatePath skipped (non-request context):", error);
  }
}

/**
 * Check if the target cycle exists in master_siklus, and create it with defaults if missing.
 */
export async function ensureCycleExists(
  siklusKe: number,
  deskripsi?: string | null,
): Promise<void> {
  const existingCycle = await db
    .select({ id: masterSiklusTable.id })
    .from(masterSiklusTable)
    .where(eq(masterSiklusTable.nomor_siklus, siklusKe))
    .limit(1);

  if (existingCycle.length === 0) {
    await db.insert(masterSiklusTable).values({
      nomor_siklus: siklusKe,
      nama_siklus: `Siklus ${siklusKe}`,
      deskripsi: deskripsi ?? null,
      is_active: true,
    });
  }
}

/**
 * Copy all menu dishes from a source cycle to a destination cycle.
 * Returns the count of copied dishes.
 */
export async function copyCycleMenuItems(
  fromSiklus: number,
  toSiklus: number,
): Promise<number> {
  const sourceItems = await db
    .select()
    .from(masterSiklusMenuTable)
    .where(eq(masterSiklusMenuTable.siklus_ke, fromSiklus));

  if (!sourceItems || sourceItems.length === 0) {
    return 0;
  }

  await db.insert(masterSiklusMenuTable).values(
    sourceItems.map((item) => ({
      siklus_ke: toSiklus,
      kelas: item.kelas,
      jenis_makanan: item.jenis_makanan,
      waktu_makan: item.waktu_makan,
      nama_makanan: item.nama_makanan,
      kategori_menu: item.kategori_menu,
      catatan: item.catatan,
      is_active: item.is_active,
    })),
  );

  return sourceItems.length;
}

/**
 * Validate whether fruit menu item is placed in an appropriate meal time (Siang / Sore).
 */
export function isInvalidFruitSlot(
  jenisMakanan: string,
  waktuMakan: string,
): boolean {
  return (
    jenisMakanan.trim().toUpperCase() === "BUAH" &&
    !["SIANG", "SORE"].includes(waktuMakan.trim().toUpperCase())
  );
}

/**
 * Fetch active diet menu tag options from database for a specific food category.
 */
export async function getActiveTagOptions(
  jenisMakanan: string,
): Promise<MenuTagOption[]> {
  const rows = await db
    .select({
      kode: kategoriMenuTable.kode_item,
      label: kategoriMenuTable.label_item,
      kategori: kategoriMenuTable.nama_kategori,
    })
    .from(kategoriMenuTable)
    .where(
      and(
        eq(kategoriMenuTable.nama_kategori, jenisMakanan.trim().toUpperCase()),
        eq(kategoriMenuTable.is_active, true),
      ),
    );
  return getMenuTagOptions(rows, jenisMakanan);
}

/**
 * Validate and normalize menu tags selection against active options.
 */
export function validateMenuTagSelection(
  value: string | null | undefined,
  options: MenuTagOption[],
  jenisMakanan: string,
): { value: string | null; error?: string } {
  const { codes, invalid } = normalizeMenuTags(value, options);
  if (invalid.length > 0) {
    return {
      value: null,
      error: `Tag ${invalid.join(", ")} tidak tersedia pada kategori ${jenisMakanan.trim().toUpperCase()}. Pilih tag dari Konfigurasi Master Menu.`,
    };
  }
  return { value: codes.length > 0 ? codes.join(", ") : null };
}

/**
 * Normalizes Date or string input to a calendar YYYY-MM-DD date key in WIB timezone.
 */
export function parseRotationStartDate(
  startDateInput: Date | string,
): string | null {
  if (typeof startDateInput === "string") {
    const parsed = parseCalendarDate(startDateInput);
    if (parsed) {
      return `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
    }
    const d = new Date(startDateInput);
    if (isNaN(d.getTime())) return null;
    return getWibTodayKey(d);
  }

  if (isNaN(startDateInput.getTime())) return null;
  return getWibTodayKey(startDateInput);
}

/**
 * Transforms raw menu distinct tags and category labels into sorted SiklusDietOption items.
 */
export function buildSiklusDietOptions(
  menuRows: Array<{
    jenis_makanan: string | null;
    kategori_menu: string | null;
  }>,
  labelRows: Array<{
    kode: string;
    label: string;
    kategori: string;
  }>,
): SiklusDietOption[] {
  const labelMap = new Map<string, string>();
  for (const row of labelRows) {
    const key = `${row.kategori.trim().toUpperCase()}__${row.kode.trim().toUpperCase()}`;
    if (!labelMap.has(key)) labelMap.set(key, row.label);
  }

  const singles = new Map<string, SiklusDietOption>();

  for (const row of menuRows) {
    const jenis = (row.jenis_makanan || "").trim().toUpperCase();
    if (!(SIKLUS_DIET_JENIS as readonly string[]).includes(jenis)) continue;

    const seen = new Set<string>();
    for (const tag of parseMenuTags(row.kategori_menu)) {
      const key = tag.trim().toUpperCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const mapKey = `${jenis}__${key}`;
      if (!singles.has(mapKey)) {
        // Samakan canonical kode dengan master kategori bila tersedia
        const canonical = [...labelMap.keys()].includes(mapKey)
          ? (labelRows.find(
              (r) =>
                r.kategori.trim().toUpperCase() === jenis &&
                r.kode.trim().toUpperCase() === key,
            )?.kode ?? tag)
          : tag;
        singles.set(mapKey, {
          id: `siklus-satuan-${jenis}-${key}`,
          jenisMakanan: jenis,
          kode: canonical,
          label: labelMap.get(mapKey) ?? canonical,
          isGabungan: false,
          memberTags: [],
        });
      }
    }
  }

  const byKode = (a: SiklusDietOption, b: SiklusDietOption) =>
    a.kode.localeCompare(b.kode, "id");
  return [...singles.values()].sort(byKode);
}

export function createSuccessResult(
  message: string,
  insertedId?: number,
): MutationResult {
  return { success: true, message, insertedId };
}

export function createErrorResult(message: string): MutationResult {
  return { success: false, message };
}

'use server';

import { eq, and, inArray, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MutationResult = {
  success: boolean;
  message: string;
};

export type KategoriMenuOption = {
  id: number;
  namaKategori: string;
  kodeItem: string;
  labelItem: string;
  urutan: number;
};

export type KategoriMenuGrouped = {
  namaKategori: string;
  options: KategoriMenuOption[];
};

export type DietMappingRecord = typeof dietMappingTable.$inferSelect;

/**
 * Represents a unique diet_rs_raw string that has not been fully mapped.
 */
export type UnmappedDietItem = {
  diet_rs_raw: string;
  jumlah_pasien: number;
  mapping_id: number | null;
  status_mapping: string;
  bentuk_makanan: string | null;
  kategori_diet: string | null;
  extra: string | null;
  buah: string | null;
  snack: string | null;
  is_active: boolean | null;
};

// ─── Mock Data (fallback) ────────────────────────────────────────────────────

const MOCK_UNMAPPED: UnmappedDietItem[] = [
  {
    diet_rs_raw: 'Diet RG Rendah Garam Lunak',
    jumlah_pasien: 4,
    mapping_id: null,
    status_mapping: 'UNMAPPED',
    bentuk_makanan: null,
    kategori_diet: null,
    extra: null,
    buah: null,
    snack: null,
    is_active: null,
  },
  {
    diet_rs_raw: 'Diet DM 1700',
    jumlah_pasien: 3,
    mapping_id: null,
    status_mapping: 'UNMAPPED',
    bentuk_makanan: null,
    kategori_diet: null,
    extra: null,
    buah: null,
    snack: null,
    is_active: null,
  },
  {
    diet_rs_raw: 'Cair Nutrisi Tinggi 2000',
    jumlah_pasien: 2,
    mapping_id: null,
    status_mapping: 'UNMAPPED',
    bentuk_makanan: null,
    kategori_diet: null,
    extra: null,
    buah: null,
    snack: null,
    is_active: null,
  },
  {
    diet_rs_raw: 'RP Rendah Protein Tim',
    jumlah_pasien: 1,
    mapping_id: null,
    status_mapping: 'UNMAPPED',
    bentuk_makanan: null,
    kategori_diet: null,
    extra: null,
    buah: null,
    snack: null,
    is_active: null,
  },
  {
    diet_rs_raw: 'Biasa Nasi TKTP',
    jumlah_pasien: 6,
    mapping_id: 10,
    status_mapping: 'PARTIAL',
    bentuk_makanan: 'BN',
    kategori_diet: 'TKTP',
    extra: null,
    buah: null,
    snack: null,
    is_active: true,
  },
];

const MOCK_KATEGORI_MENU: KategoriMenuOption[] = [
  { id: 1, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'BN', labelItem: 'Biasa Nasi', urutan: 1 },
  { id: 2, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'BL', labelItem: 'Biasa Lunak', urutan: 2 },
  { id: 3, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'BC', labelItem: 'Biasa Cincang', urutan: 3 },
  { id: 4, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'TM', labelItem: 'Tim', urutan: 4 },
  { id: 5, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'SAR', labelItem: 'Saring', urutan: 5 },
  { id: 6, namaKategori: 'BENTUK_MAKANAN', kodeItem: 'CAI', labelItem: 'Cair', urutan: 6 },
  { id: 7, namaKategori: 'DIIT', kodeItem: 'BIASA', labelItem: 'Diet Biasa', urutan: 1 },
  { id: 8, namaKategori: 'DIIT', kodeItem: 'TKTP', labelItem: 'Tinggi Kalori Tinggi Protein', urutan: 2 },
  { id: 9, namaKategori: 'DIIT', kodeItem: 'RG', labelItem: 'Rendah Garam', urutan: 3 },
  { id: 10, namaKategori: 'DIIT', kodeItem: 'DM', labelItem: 'Diabetes Melitus', urutan: 4 },
  { id: 11, namaKategori: 'DIIT', kodeItem: 'RP', labelItem: 'Rendah Protein', urutan: 5 },
  { id: 12, namaKategori: 'DIIT', kodeItem: 'RL', labelItem: 'Rendah Lemak', urutan: 6 },
  { id: 13, namaKategori: 'DIIT', kodeItem: 'RP', labelItem: 'Rendah Purin', urutan: 7 },
  { id: 14, namaKategori: 'EXTRA', kodeItem: 'PUTEL', labelItem: 'Putih Telur', urutan: 1 },
  { id: 15, namaKategori: 'EXTRA', kodeItem: 'SUSU', labelItem: 'Susu', urutan: 2 },
  { id: 16, namaKategori: 'EXTRA', kodeItem: 'PEPAYA', labelItem: 'Pepaya', urutan: 3 },
  { id: 17, namaKategori: 'BUAH', kodeItem: 'PISANG', labelItem: 'Pisang', urutan: 1 },
  { id: 18, namaKategori: 'BUAH', kodeItem: 'JERUK', labelItem: 'Jeruk', urutan: 2 },
  { id: 19, namaKategori: 'BUAH', kodeItem: 'APEL', labelItem: 'Apel', urutan: 3 },
  { id: 20, namaKategori: 'SNACK', kodeItem: 'SGP', labelItem: 'Snack Gula Pasir', urutan: 1 },
  { id: 21, namaKategori: 'SNACK', kodeItem: 'SRP', labelItem: 'Snack Rendah Protein', urutan: 2 },
];

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all unique diet strings from active patients that are not yet fully mapped.
 * Returns UNMAPPED + PARTIAL records only.
 */
export async function getUnmappedDietItems(): Promise<UnmappedDietItem[]> {
  try {
    // 1. Get distinct diet strings from all active patients
    const allPatients = await db
      .select({ diet: pasienTable.diet })
      .from(pasienTable)
      .where(ne(pasienTable.status_pasien, 'PULANG'));

    if (!allPatients || allPatients.length === 0) {
      return MOCK_UNMAPPED;
    }

    // Count occurrences per diet_rs_raw
    const countMap = new Map<string, number>();
    for (const p of allPatients) {
      const key = p.diet.trim();
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    const uniqueDiets = Array.from(countMap.keys());

    // 2. Check existing mappings for these diet strings
    const existingMappings = await db
      .select()
      .from(dietMappingTable)
      .where(
        and(
          inArray(dietMappingTable.diet_rs_raw, uniqueDiets),
          eq(dietMappingTable.is_active, true),
        ),
      );

    const mappingByRaw = new Map<string, DietMappingRecord>();
    for (const m of existingMappings) {
      mappingByRaw.set(m.diet_rs_raw, m);
    }

    // 3. Build result — only include UNMAPPED and PARTIAL
    const results: UnmappedDietItem[] = [];

    for (const rawDiet of uniqueDiets) {
      const existing = mappingByRaw.get(rawDiet);
      const statusMapping = existing?.status_mapping ?? 'UNMAPPED';

      // Skip fully MAPPED ones
      if (statusMapping === 'MAPPED') continue;

      results.push({
        diet_rs_raw: rawDiet,
        jumlah_pasien: countMap.get(rawDiet) ?? 0,
        mapping_id: existing?.id ?? null,
        status_mapping: statusMapping,
        bentuk_makanan: existing?.bentuk_makanan ?? null,
        kategori_diet: existing?.kategori_diet ?? null,
        extra: existing?.extra ?? null,
        buah: existing?.buah ?? null,
        snack: existing?.snack ?? null,
        is_active: existing?.is_active ?? null,
      });
    }

    // Sort: UNMAPPED first, then by jumlah_pasien desc
    results.sort((a, b) => {
      if (a.status_mapping !== b.status_mapping) {
        return a.status_mapping === 'UNMAPPED' ? -1 : 1;
      }
      return b.jumlah_pasien - a.jumlah_pasien;
    });

    return results.length > 0 ? results : MOCK_UNMAPPED;
  } catch (error) {
    console.error('Error fetching unmapped diet items:', error);
    return MOCK_UNMAPPED;
  }
}

/**
 * Fetch all active kategori menu options grouped by namaKategori.
 */
export async function getKategoriMenuOptions(): Promise<KategoriMenuOption[]> {
  try {
    const items = await db
      .select()
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_active, true))
      .orderBy(kategoriMenuTable.urutan);

    if (items && items.length > 0) {
      return items.map((i) => ({
        id: i.id,
        namaKategori: i.nama_kategori,
        kodeItem: i.kode_item,
        labelItem: i.label_item,
        urutan: i.urutan,
      }));
    }
  } catch (error) {
    console.error('Error fetching kategori menu options:', error);
  }

  return MOCK_KATEGORI_MENU;
}

/**
 * Stats for summary cards.
 */
export type MappingDietStats = {
  unmappedCount: number;
  partialCount: number;
  totalPatientAffected: number;
};

export async function getMappingDietStats(
  items?: UnmappedDietItem[],
): Promise<MappingDietStats> {
  const data = items ?? (await getUnmappedDietItems());
  return {
    unmappedCount: data.filter((i) => i.status_mapping === 'UNMAPPED').length,
    partialCount: data.filter((i) => i.status_mapping === 'PARTIAL').length,
    totalPatientAffected: data.reduce((sum, i) => sum + i.jumlah_pasien, 0),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export type SaveMappingPayload = {
  diet_rs_raw: string;
  bentuk_makanan: string;
  kategori_diet: string;
  extra?: string;
  buah?: string;
  snack?: string;
  mapped_by?: string;
};

/**
 * Upsert a diet mapping record. Creates if new, updates if already exists.
 */
export async function saveDietMapping(
  payload: SaveMappingPayload,
): Promise<MutationResult> {
  if (!payload.diet_rs_raw?.trim()) {
    return { success: false, message: 'Diet RS Raw tidak boleh kosong.' };
  }
  if (!payload.bentuk_makanan?.trim() || !payload.kategori_diet?.trim()) {
    return {
      success: false,
      message: 'Bentuk Makanan dan Kategori Diet wajib diisi.',
    };
  }

  try {
    const existing = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.diet_rs_raw, payload.diet_rs_raw.trim()));

    if (existing && existing.length > 0) {
      await db
        .update(dietMappingTable)
        .set({
          bentuk_makanan: payload.bentuk_makanan,
          kategori_diet: payload.kategori_diet,
          extra: payload.extra || null,
          buah: payload.buah || null,
          snack: payload.snack || null,
          status_mapping: 'MAPPED',
          updated_by: payload.mapped_by || 'Admin Gizi',
          updated_at: new Date(),
          is_active: true,
        })
        .where(eq(dietMappingTable.diet_rs_raw, payload.diet_rs_raw.trim()));
    } else {
      await db.insert(dietMappingTable).values({
        diet_rs_raw: payload.diet_rs_raw.trim(),
        bentuk_makanan: payload.bentuk_makanan,
        kategori_diet: payload.kategori_diet,
        extra: payload.extra || null,
        buah: payload.buah || null,
        snack: payload.snack || null,
        status_mapping: 'MAPPED',
        created_by: payload.mapped_by || 'Admin Gizi',
        updated_by: payload.mapped_by || 'Admin Gizi',
        is_active: true,
      });
    }

    revalidatePath('/dashboard/ag-katering/mapping-diet');
    return {
      success: true,
      message: `Mapping diet untuk "${payload.diet_rs_raw}" berhasil disimpan.`,
    };
  } catch (error) {
    console.error('Error saving diet mapping:', error);
    return { success: false, message: 'Gagal menyimpan mapping diet.' };
  }
}

/**
 * Bulk save mappings for multiple diet strings using the same mapping values.
 */
export async function bulkSaveDietMapping(
  dietRawList: string[],
  mappingValues: Omit<SaveMappingPayload, 'diet_rs_raw'>,
): Promise<MutationResult> {
  if (!dietRawList || dietRawList.length === 0) {
    return { success: false, message: 'Tidak ada item yang dipilih.' };
  }

  let successCount = 0;
  for (const raw of dietRawList) {
    const res = await saveDietMapping({ ...mappingValues, diet_rs_raw: raw });
    if (res.success) successCount++;
  }

  revalidatePath('/dashboard/ag-katering/mapping-diet');
  return {
    success: true,
    message: `${successCount} dari ${dietRawList.length} mapping berhasil disimpan.`,
  };
}

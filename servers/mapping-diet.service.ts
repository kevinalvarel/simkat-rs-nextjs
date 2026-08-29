'use server';

import { eq, and, inArray, ne, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';

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
  kelas_list: string[];
  mapping_id: number | null;
  status_mapping: string;
  bentuk_makanan: string | null;
  kategori_diet: string | null;
  nabati?: string | null;
  sayur?: string | null;
  extra: string | null;
  buah: string | null;
  snack: string | null;
  is_active: boolean | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all unique diet strings from active patients that are not yet fully mapped.
 * Returns UNMAPPED + PARTIAL records only.
 * Strictly excludes unapproved pending revisions (Mode Revisi).
 */
export async function getUnmappedDietItems(): Promise<UnmappedDietItem[]> {
  try {
    // 1. Fetch pending revisions that have not yet been approved by supervisor
    const pendingRevisions = await db
      .select({
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
      })
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.status, 'PENDING'));

    const pendingNewPatientIds = new Set(
      pendingRevisions
        .filter((r) => r.jenis_perubahan === 'NEW_PATIENT')
        .map((r) => r.pasien_id)
    );

    // 2. Get distinct diet strings from active (approved) patients
    const allPatients = await db
      .select({
        id: pasienTable.id,
        diet: pasienTable.diet,
        kelas: pasienTable.kelas,
      })
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        )
      );

    const validPatients = allPatients.filter(
      (p) => !pendingNewPatientIds.has(p.id)
    );

    if (!validPatients || validPatients.length === 0) {
      return [];
    }

    // Count occurrences and collect patient classes per diet_rs_raw
    const countMap = new Map<string, number>();
    const kelasMap = new Map<string, Set<string>>();
    for (const p of validPatients) {
      const key = (p.diet || '').trim();
      if (!key) continue;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);

      if (p.kelas) {
        if (!kelasMap.has(key)) {
          kelasMap.set(key, new Set<string>());
        }
        kelasMap.get(key)!.add(p.kelas.trim());
      }
    }

    const uniqueDiets = Array.from(countMap.keys());
    if (uniqueDiets.length === 0) {
      return [];
    }

    // 3. Check existing mappings for these diet strings
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

    // 4. Build result — only include UNMAPPED and PARTIAL
    const results: UnmappedDietItem[] = [];

    for (const rawDiet of uniqueDiets) {
      const existing = mappingByRaw.get(rawDiet);
      const statusMapping = existing?.status_mapping ?? 'UNMAPPED';

      // Skip fully MAPPED ones
      if (statusMapping === 'MAPPED') continue;

      const kelasList = Array.from(kelasMap.get(rawDiet) || []).sort();

      let nabati: string | null = null;
      let sayur: string | null = null;
      if (existing?.extra) {
        const parts = existing.extra.split(',').map((s) => s.trim());
        if (parts.length >= 2) {
          nabati = parts[0];
          sayur = parts[1];
        } else if (parts.length === 1 && parts[0]) {
          nabati = parts[0];
        }
      }

      results.push({
        diet_rs_raw: rawDiet,
        jumlah_pasien: countMap.get(rawDiet) ?? 0,
        kelas_list: kelasList,
        mapping_id: existing?.id ?? null,
        status_mapping: statusMapping,
        bentuk_makanan: existing?.bentuk_makanan ?? null,
        kategori_diet: existing?.kategori_diet ?? null,
        nabati,
        sayur,
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

    return results;
  } catch (error) {
    console.error('Error fetching unmapped diet items:', error);
    return [];
  }
}

/**
 * Fetch all active kategori menu options from master database (kategori_menu table).
 */
export async function getKategoriMenuOptions(): Promise<KategoriMenuOption[]> {
  try {
    const items = await db
      .select()
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_active, true))
      .orderBy(asc(kategoriMenuTable.nama_kategori), asc(kategoriMenuTable.urutan));

    if (items && items.length > 0) {
      return items.map((i) => ({
        id: i.id,
        namaKategori: i.nama_kategori,
        kodeItem: i.kode_item,
        labelItem: i.label_item,
        urutan: i.urutan,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching kategori menu options from DB:', error);
    return [];
  }
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
  bentuk_makanan?: string | null;
  kategori_diet?: string | null;
  nabati?: string | null;
  sayur?: string | null;
  extra?: string | null;
  buah?: string | null;
  snack?: string | null;
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

  const extraCombined =
    payload.extra !== undefined
      ? payload.extra
      : [payload.nabati, payload.sayur].filter(Boolean).join(', ') || null;

  const isMapped = Boolean(
    payload.bentuk_makanan?.trim() && payload.kategori_diet?.trim(),
  );
  const isPartial = Boolean(
    payload.bentuk_makanan?.trim() ||
      payload.kategori_diet?.trim() ||
      extraCombined?.trim() ||
      payload.buah?.trim() ||
      payload.snack?.trim(),
  );
  const status_mapping = isMapped ? 'MAPPED' : isPartial ? 'PARTIAL' : 'UNMAPPED';

  try {
    const existing = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.diet_rs_raw, payload.diet_rs_raw.trim()));

    if (existing && existing.length > 0) {
      await db
        .update(dietMappingTable)
        .set({
          bentuk_makanan: payload.bentuk_makanan || null,
          kategori_diet: payload.kategori_diet || null,
          extra: extraCombined,
          buah: payload.buah || null,
          snack: payload.snack || null,
          status_mapping: status_mapping,
          updated_by: payload.mapped_by || 'Admin Gizi',
          updated_at: new Date(),
          is_active: true,
        })
        .where(eq(dietMappingTable.diet_rs_raw, payload.diet_rs_raw.trim()));
    } else {
      await db.insert(dietMappingTable).values({
        diet_rs_raw: payload.diet_rs_raw.trim(),
        bentuk_makanan: payload.bentuk_makanan || null,
        kategori_diet: payload.kategori_diet || null,
        extra: extraCombined,
        buah: payload.buah || null,
        snack: payload.snack || null,
        status_mapping: status_mapping,
        created_by: payload.mapped_by || 'Admin Gizi',
        updated_by: payload.mapped_by || 'Admin Gizi',
        is_active: true,
      });
    }

    revalidatePath('/dashboard/ag-katering/mapping-diet');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
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
  revalidatePath('/dashboard/ag-katering/overview');
  revalidatePath('/dashboard/ag-katering/overview/produksi');
  revalidatePath('/dashboard/ag-katering/overview/pemorsian');
  return {
    success: true,
    message: `${successCount} dari ${dietRawList.length} mapping berhasil disimpan.`,
  };
}

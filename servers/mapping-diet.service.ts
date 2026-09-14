'use server';

import { eq, and, inArray, ne, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import { hasFoodMapping, mergeFoodMapping } from '@/lib/mapping-diet-fields';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MutationResult = {
  success: boolean;
  message: string;
  savedCount?: number;
  skippedRaws?: string[];
  failedRaws?: string[];
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

      // Skip fully MAPPED or KATERING ones
      if (statusMapping === 'MAPPED' || statusMapping === 'KATERING') continue;

      const kelasList = Array.from(kelasMap.get(rawDiet) || []).sort();

      let nabati: string | null = existing?.nabati ?? null;
      let sayur: string | null = existing?.sayur ?? null;
      if (!nabati && !sayur && existing?.extra) {
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
 * Fetch all diet strings that have been successfully mapped (status MAPPED or KATERING).
 * Also maps with active patient counts and classes.
 */
export async function getMappedDietItems(): Promise<UnmappedDietItem[]> {
  try {
    // 1. Fetch active patients to compute real-time impact
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
        .map((r) => r.pasien_id),
    );

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
        ),
      );

    const validPatients = allPatients.filter(
      (p) => !pendingNewPatientIds.has(p.id),
    );

    const countMap = new Map<string, number>();
    const kelasMap = new Map<string, Set<string>>();
    for (const p of validPatients) {
      const key = (p.diet || '').trim();
      if (!key) continue;
      countMap.set(key.toLowerCase(), (countMap.get(key.toLowerCase()) ?? 0) + 1);

      if (p.kelas) {
        if (!kelasMap.has(key.toLowerCase())) {
          kelasMap.set(key.toLowerCase(), new Set<string>());
        }
        kelasMap.get(key.toLowerCase())!.add(p.kelas.trim());
      }
    }

    // 2. Fetch all mapped records from master_diet_mapping
    const mappedRecords = await db
      .select()
      .from(dietMappingTable)
      .where(
        and(
          eq(dietMappingTable.is_active, true),
          inArray(dietMappingTable.status_mapping, ['MAPPED', 'KATERING']),
        ),
      )
      .orderBy(asc(dietMappingTable.diet_rs_raw));

    const results: UnmappedDietItem[] = [];
    for (const m of mappedRecords) {
      const key = m.diet_rs_raw.trim().toLowerCase();
      const jumlahPasien = countMap.get(key) ?? 0;
      const kelasList = Array.from(kelasMap.get(key) || []).sort();

      let nabati: string | null = m.nabati ?? null;
      let sayur: string | null = m.sayur ?? null;
      if (!nabati && !sayur && m.extra) {
        const parts = m.extra.split(',').map((s) => s.trim());
        if (parts.length >= 2) {
          nabati = parts[0];
          sayur = parts[1];
        } else if (parts.length === 1 && parts[0]) {
          nabati = parts[0];
        }
      }

      results.push({
        diet_rs_raw: m.diet_rs_raw,
        jumlah_pasien: jumlahPasien,
        kelas_list: kelasList,
        mapping_id: m.id,
        status_mapping: m.status_mapping,
        bentuk_makanan: m.bentuk_makanan,
        kategori_diet: m.kategori_diet,
        nabati,
        sayur,
        extra: m.extra,
        buah: m.buah,
        snack: m.snack,
        is_active: m.is_active,
      });
    }

    // Sort: records with active patients first (descending), then alphabetically
    results.sort((a, b) => {
      if (b.jumlah_pasien !== a.jumlah_pasien) {
        return b.jumlah_pasien - a.jumlah_pasien;
      }
      return a.diet_rs_raw.localeCompare(b.diet_rs_raw);
    });

    return results;
  } catch (error) {
    console.error('Error fetching mapped diet items:', error);
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
  mappedCount: number;
  totalPatientAffected: number;
};

export async function getMappingDietStats(
  unmappedItems?: UnmappedDietItem[],
  mappedItems?: UnmappedDietItem[],
): Promise<MappingDietStats> {
  const unmapped = unmappedItems ?? (await getUnmappedDietItems());
  const mapped = mappedItems ?? (await getMappedDietItems());
  return {
    unmappedCount: unmapped.filter((i) => i.status_mapping === 'UNMAPPED').length,
    partialCount: unmapped.filter((i) => i.status_mapping === 'PARTIAL').length,
    mappedCount: mapped.length,
    totalPatientAffected: unmapped.reduce((sum, i) => sum + i.jumlah_pasien, 0),
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
  status_mapping?: string | null;
  mode?: 'STANDARD' | 'NPO' | 'KATERING';
  mapped_by?: string;
};

/**
 * Upsert a diet mapping record. Creates if new, updates if already exists.
 * Supports STANDARD, NPO (auto-fills all to NPO), and KATERING (Alihkan ke AG Katering).
 */
export async function saveDietMapping(
  payload: SaveMappingPayload,
): Promise<MutationResult> {
  if (!payload.diet_rs_raw?.trim()) {
    return { success: false, message: 'Diet RS Raw tidak boleh kosong.' };
  }

  const raw = payload.diet_rs_raw.trim();
  let bentuk_makanan = payload.bentuk_makanan?.trim() || null;
  let kategori_diet = payload.kategori_diet?.trim() || null;
  let nabati = payload.nabati?.trim() || null;
  let sayur = payload.sayur?.trim() || null;
  let buah = payload.buah?.trim() || null;
  let snack = payload.snack?.trim() || null;
  let extraCombined =
    payload.extra !== undefined
      ? payload.extra
      : [nabati, sayur].filter(Boolean).join(', ') || null;

  let status_mapping: string = 'UNMAPPED';

  // Mode 1: NPO / Puasa
  if (
    payload.mode === 'NPO' ||
    raw.toUpperCase() === 'NPO'
  ) {
    bentuk_makanan = 'NPO';
    kategori_diet = 'NPO';
    nabati = 'NPO';
    sayur = 'NPO';
    extraCombined = 'NPO, NPO';
    buah = 'NPO';
    snack = 'NPO';
    status_mapping = 'MAPPED';
  }
  // Mode 2: Alihkan ke AG Katering
  else if (
    payload.mode === 'KATERING' ||
    payload.status_mapping === 'KATERING'
  ) {
    bentuk_makanan = 'KATERING';
    kategori_diet = 'KATERING';
    extraCombined = null;
    buah = null;
    snack = null;
    status_mapping = 'KATERING';
  }
  // Mode 3: Standard mapping
  else {
    if ([bentuk_makanan, kategori_diet, nabati, sayur, buah, snack].some((value) => value === 'NPO' || value === 'KATERING')) {
      return { success: false, message: 'Pilih mode NPO atau AG Katering untuk nilai khusus.' };
    }
    if (!hasFoodMapping({ bentuk_makanan, kategori_diet, nabati, sayur, buah, snack })) {
      return { success: false, message: 'Isi minimal satu jenis makanan sebelum menyimpan mapping.' };
    }
    status_mapping = 'MAPPED';
  }

  try {
    const existing = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.diet_rs_raw, raw));

    if (existing && existing.length > 0) {
      await db
        .update(dietMappingTable)
        .set({
          bentuk_makanan,
          kategori_diet,
          nabati,
          sayur,
          extra: extraCombined,
          buah,
          snack,
          status_mapping,
          updated_by: payload.mapped_by || 'Admin Gizi',
          updated_at: new Date(),
          is_active: true,
        })
        .where(eq(dietMappingTable.diet_rs_raw, raw));
    } else {
      await db.insert(dietMappingTable).values({
        diet_rs_raw: raw,
        bentuk_makanan,
        kategori_diet,
        nabati,
        sayur,
        extra: extraCombined,
        buah,
        snack,
        status_mapping,
        created_by: payload.mapped_by || 'Admin Gizi',
        updated_by: payload.mapped_by || 'Admin Gizi',
        is_active: true,
      });
    }

    try {
      revalidatePath('/dashboard/ag-katering/mapping-diet');
      revalidatePath('/dashboard/ag-katering/overview');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      revalidatePath('/dashboard/ag-katering/overview/katering');
    } catch {
      // Safe fallback when executed outside Next.js request context
    }

    const labelMode =
      status_mapping === 'KATERING'
        ? 'dialihkan ke AG Katering'
        : bentuk_makanan === 'NPO'
        ? 'diset NPO (Puasa)'
        : 'berhasil disimpan';

    return {
      success: true,
      message: `Mapping diet untuk "${raw}" ${labelMode}.`,
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

  const isStandard = !mappingValues.mode || mappingValues.mode === 'STANDARD';
  if (isStandard && !hasFoodMapping({
    bentuk_makanan: mappingValues.bentuk_makanan,
    kategori_diet: mappingValues.kategori_diet,
    nabati: mappingValues.nabati,
    sayur: mappingValues.sayur,
    buah: mappingValues.buah,
    snack: mappingValues.snack,
  })) {
    return { success: false, message: 'Pilih minimal satu jenis makanan untuk mapping massal.' };
  }

  const existingRecords = await db.select().from(dietMappingTable)
    .where(inArray(dietMappingTable.diet_rs_raw, dietRawList.map((raw) => raw.trim())));
  const existingByRaw = new Map(existingRecords.map((record) => [record.diet_rs_raw, record]));
  const skippedRaws: string[] = [];
  const failedRaws: string[] = [];
  let successCount = 0;
  for (const raw of dietRawList) {
    const stored = existingByRaw.get(raw.trim());
    const existing = stored?.is_active ? stored : null;
    if (isStandard && (raw.trim().toUpperCase() === 'NPO' || existing?.status_mapping === 'KATERING' ||
      existing?.bentuk_makanan === 'NPO' || existing?.kategori_diet === 'NPO' ||
      existing?.bentuk_makanan === 'KATERING' || existing?.kategori_diet === 'KATERING')) {
      skippedRaws.push(raw);
      continue;
    }

    let merged: Omit<SaveMappingPayload, 'diet_rs_raw'> = mappingValues;
    if (isStandard) {
      const legacyParts = existing?.extra?.split(',').map((part) => part.trim()) || [];
      const useLegacyExtra = !existing?.nabati && !existing?.sayur;
      const foodFields = mergeFoodMapping({
        bentuk_makanan: existing?.bentuk_makanan,
        kategori_diet: existing?.kategori_diet,
        nabati: existing?.nabati || (useLegacyExtra ? legacyParts[0] : null),
        sayur: existing?.sayur || (useLegacyExtra ? legacyParts[1] : null),
        buah: existing?.buah,
        snack: existing?.snack,
      }, mappingValues);
      merged = {
        mode: 'STANDARD',
        ...foodFields,
        mapped_by: mappingValues.mapped_by,
      };
    }
    const res = await saveDietMapping({ ...merged, diet_rs_raw: raw });
    if (res.success) successCount++;
    else failedRaws.push(raw);
  }

  try {
    revalidatePath('/dashboard/ag-katering/mapping-diet');
    revalidatePath('/dashboard/ag-katering/overview');
    revalidatePath('/dashboard/ag-katering/overview/produksi');
    revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    revalidatePath('/dashboard/ag-katering/overview/katering');
  } catch {
    // Safe fallback
  }

  return {
    success: successCount > 0,
    savedCount: successCount,
    skippedRaws,
    failedRaws,
    message: `${successCount} mapping disimpan${skippedRaws.length ? `, ${skippedRaws.length} mode khusus dilewati` : ''}${failedRaws.length ? `, ${failedRaws.length} gagal` : ''}.`,
  };
}

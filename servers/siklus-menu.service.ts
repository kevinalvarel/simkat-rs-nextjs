'use server';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from '@/db/schemas/master/siklus-menu';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';
import { type MenuTagOption } from '@/lib/siklus-menu-tags';
import { addCalendarDays, formatIndo, getWibHari } from '@/lib/wib';
import {
  HARI_ROTASI_LIST,
  type MasterSiklusItem,
  type CreateMasterSiklusPayload,
  type UpdateMasterSiklusPayload,
  type SiklusMenuItem,
  type MutationResult,
  type CreateSiklusItemPayload,
  type UpdateSiklusItemPayload,
  type SlotItemInput,
  type SiklusDietOption,
} from '@/types/siklus-menu.types';
import {
  ensureTableInitialized,
  ensureCycleExists,
  copyCycleMenuItems,
  isInvalidFruitSlot,
  getActiveTagOptions,
  validateMenuTagSelection,
  parseRotationStartDate,
  buildSiklusDietOptions,
  revalidateSiklusPath,
  createSuccessResult,
  createErrorResult,
} from '@/helper/siklus-menu';

// ─── Re-export Types for Backwards Compatibility ────────────────────────────

export type {
  HariRotasi,
  SiklusDietJenis,
  MasterSiklusItem,
  CreateMasterSiklusPayload,
  UpdateMasterSiklusPayload,
  SiklusMenuItem,
  MutationResult,
  CreateSiklusItemPayload,
  UpdateSiklusItemPayload,
  SlotItemInput,
  SiklusMatrixRow,
  SiklusStatsData,
  SiklusDietOption,
} from '@/types/siklus-menu.types';

// ─── Master Siklus Management ───────────────────────────────────────────────

/**
 * Fetch all defined cycles in the master table
 */
export async function getMasterSiklusList(): Promise<MasterSiklusItem[]> {
  try {
    await ensureTableInitialized();

    const results = await db
      .select()
      .from(masterSiklusTable)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    return results.map((row) => ({
      id: row.id,
      nomor_siklus: row.nomor_siklus,
      nama_siklus: row.nama_siklus,
      hari: row.hari,
      tanggal: row.tanggal,
      deskripsi: row.deskripsi,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching master siklus list:', error);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => ({
      id: num,
      nomor_siklus: num,
      nama_siklus: `Siklus ${num}`,
      hari: HARI_ROTASI_LIST[(num - 1) % 7],
      tanggal: null,
      deskripsi: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));
  }
}

/**
 * Create a new cycle in the master table with optional dish copy
 */
export async function createMasterSiklus(
  payload: CreateMasterSiklusPayload,
): Promise<MutationResult & { createdSiklus?: number }> {
  if (!payload.nomor_siklus || payload.nomor_siklus < 1) {
    return createErrorResult(
      'Nomor siklus harus berupa angka positif (minimal 1).',
    );
  }

  try {
    await ensureTableInitialized();

    // Check duplicate
    const existing = await db
      .select({ id: masterSiklusTable.id })
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, payload.nomor_siklus))
      .limit(1);

    if (existing.length > 0) {
      return createErrorResult(
        `Siklus #${payload.nomor_siklus} sudah terdaftar. Silakan pilih nomor siklus lain.`,
      );
    }

    const namaSiklus =
      payload.nama_siklus?.trim() || `Siklus ${payload.nomor_siklus}`;

    const [inserted] = await db
      .insert(masterSiklusTable)
      .values({
        nomor_siklus: payload.nomor_siklus,
        nama_siklus: namaSiklus,
        hari: payload.hari?.trim()?.toUpperCase() || null,
        tanggal: payload.tanggal?.trim() || null,
        deskripsi: payload.deskripsi?.trim() || null,
        is_active: true,
      })
      .returning({ id: masterSiklusTable.id });

    // Optional: Copy menu dishes from existing cycle
    let copiedCount = 0;
    if (payload.copyFromSiklus && payload.copyFromSiklus > 0) {
      copiedCount = await copyCycleMenuItems(
        payload.copyFromSiklus,
        payload.nomor_siklus,
      );
    }

    revalidateSiklusPath();
    return {
      success: true,
      message: `${namaSiklus} berhasil ditambahkan ke master siklus.${
        copiedCount > 0
          ? ` (${copiedCount} hidangan disalin dari Siklus #${payload.copyFromSiklus})`
          : ''
      }`,
      insertedId: inserted?.id,
      createdSiklus: payload.nomor_siklus,
    };
  } catch (error) {
    console.error('Error creating master siklus:', error);
    return createErrorResult('Gagal menambahkan siklus baru ke sistem.');
  }
}

/**
 * Update an existing cycle's metadata
 */
export async function updateMasterSiklus(
  nomorSiklus: number,
  payload: UpdateMasterSiklusPayload,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    await db
      .update(masterSiklusTable)
      .set({
        ...(payload.nama_siklus !== undefined
          ? { nama_siklus: payload.nama_siklus.trim() }
          : {}),
        ...(payload.hari !== undefined
          ? { hari: payload.hari?.trim()?.toUpperCase() || null }
          : {}),
        ...(payload.tanggal !== undefined
          ? { tanggal: payload.tanggal?.trim() || null }
          : {}),
        ...(payload.deskripsi !== undefined
          ? { deskripsi: payload.deskripsi?.trim() || null }
          : {}),
        ...(payload.is_active !== undefined
          ? { is_active: payload.is_active }
          : {}),
        updated_at: new Date(),
      })
      .where(eq(masterSiklusTable.nomor_siklus, nomorSiklus));

    revalidateSiklusPath();
    return createSuccessResult(
      `Informasi Siklus #${nomorSiklus} berhasil diperbarui.`,
    );
  } catch (error) {
    console.error('Error updating master siklus:', error);
    return createErrorResult('Gagal memperbarui data master siklus.');
  }
}

/**
 * Automatically set rotation schedule starting from a chosen Date for Cycle 1
 */
export async function applyStartDateRotation(
  startDateInput: Date | string,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    const startKey = parseRotationStartDate(startDateInput);
    if (!startKey) {
      return createErrorResult('Tanggal mulai rotasi siklus tidak valid.');
    }

    const cycles = await db
      .select()
      .from(masterSiklusTable)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    if (!cycles || cycles.length === 0) {
      return createErrorResult('Tidak ada data siklus menu yang terdaftar.');
    }

    const regularCycles = cycles.filter(
      (c) => c.nomor_siklus !== 11 && c.nomor_siklus !== 31,
    );
    const specialCycles = cycles.filter(
      (c) => c.nomor_siklus === 11 || c.nomor_siklus === 31,
    );

    for (let i = 0; i < regularCycles.length; i++) {
      const cycle = regularCycles[i];
      const isoDate = addCalendarDays(startKey, i);
      const assignedDay = getWibHari(isoDate);
      const displayTargetDate = formatIndo(isoDate);

      await db
        .update(masterSiklusTable)
        .set({
          tanggal: isoDate,
          hari: assignedDay,
          deskripsi: `Rotasi menu makanan siklus tanggal ${displayTargetDate}`,
          updated_at: new Date(),
        })
        .where(eq(masterSiklusTable.nomor_siklus, cycle.nomor_siklus));
    }

    for (const sc of specialCycles) {
      await db
        .update(masterSiklusTable)
        .set({
          tanggal: null,
          hari: null,
          deskripsi: `Menu khusus tanggal 31 (${sc.nama_siklus})`,
          updated_at: new Date(),
        })
        .where(eq(masterSiklusTable.nomor_siklus, sc.nomor_siklus));
    }

    revalidateSiklusPath();
    const displayDate = formatIndo(startKey);

    return createSuccessResult(
      `Jadwal rotasi siklus berhasil diperbarui: Siklus #1 dimulai pada tanggal ${displayDate}.`,
    );
  } catch (error) {
    console.error('Error applying start date rotation:', error);
    return createErrorResult('Gagal mengatur jadwal tanggal rotasi siklus.');
  }
}

/**
 * Backwards-compatible day-based rotation setting
 */
export async function applyStartDayRotation(
  startDay: string,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    const normalizedStartDay = startDay.trim().toUpperCase();
    const startIndex = HARI_ROTASI_LIST.indexOf(
      normalizedStartDay as (typeof HARI_ROTASI_LIST)[number],
    );

    if (startIndex === -1) {
      return createErrorResult(
        `Hari "${startDay}" tidak valid. Pilih antara SENIN s.d. MINGGU.`,
      );
    }

    const cycles = await db
      .select()
      .from(masterSiklusTable)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    if (!cycles || cycles.length === 0) {
      return createErrorResult('Tidak ada data siklus menu yang terdaftar.');
    }

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const dayIndex = (startIndex + i) % 7;
      const assignedDay = HARI_ROTASI_LIST[dayIndex];

      await db
        .update(masterSiklusTable)
        .set({
          hari: assignedDay,
          updated_at: new Date(),
        })
        .where(eq(masterSiklusTable.nomor_siklus, cycle.nomor_siklus));
    }

    revalidateSiklusPath();
    return createSuccessResult(
      `Jadwal rotasi siklus berhasil diperbarui: Siklus #1 dimulai pada hari ${normalizedStartDay}.`,
    );
  } catch (error) {
    console.error('Error applying start day rotation:', error);
    return createErrorResult('Gagal mengatur jadwal hari rotasi siklus.');
  }
}

/**
 * Delete a cycle from master table and all its associated menu items (Cascade)
 */
export async function deleteMasterSiklus(
  nomorSiklus: number,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    // 1. Delete dishes for this cycle
    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, nomorSiklus));

    // 2. Delete the master cycle record
    await db
      .delete(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, nomorSiklus));

    revalidateSiklusPath();
    return createSuccessResult(
      `Siklus #${nomorSiklus} beserta seluruh menu hidangannya berhasil dihapus.`,
    );
  } catch (error) {
    console.error('Error deleting master siklus:', error);
    return createErrorResult('Gagal menghapus siklus dari sistem.');
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all items for a given cycle (default 1)
 */
export async function getSiklusMenuList(
  siklusKe: number = 1,
): Promise<SiklusMenuItem[]> {
  try {
    await ensureTableInitialized();

    const dbResults = await db
      .select()
      .from(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, siklusKe))
      .orderBy(
        asc(masterSiklusMenuTable.jenis_makanan),
        asc(masterSiklusMenuTable.kelas),
        asc(masterSiklusMenuTable.id),
      );

    return (dbResults || []).map((row) => ({
      id: row.id,
      siklus_ke: row.siklus_ke,
      kelas: row.kelas,
      jenis_makanan: row.jenis_makanan,
      waktu_makan: row.waktu_makan,
      nama_makanan: row.nama_makanan,
      kategori_menu: row.kategori_menu,
      catatan: row.catatan,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching siklus_menu from database:', error);
    return [];
  }
}

/**
 * Delete all menu items for a specific cycle
 */
export async function deleteAllItemSiklusMenu(siklusKe: number): Promise<void> {
  try {
    await ensureTableInitialized();

    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, siklusKe));

    revalidateSiklusPath();
  } catch (error) {
    console.error('Error deleting siklus menu items:', error);
    throw error;
  }
}

/**
 * Get distinct active siklus numbers available in database
 */
export async function getAvailableSiklusList(): Promise<number[]> {
  try {
    await ensureTableInitialized();

    const results = await db
      .select({ nomor_siklus: masterSiklusTable.nomor_siklus })
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.is_active, true))
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    return results.map((r) => r.nomor_siklus).filter(Boolean);
  } catch (error) {
    console.error('Error getting available siklus list:', error);
    return [];
  }
}

/**
 * Fetch kategori menu options from master table for badge/tag options
 */
export async function getKategoriMenuDietList(): Promise<MenuTagOption[]> {
  try {
    const list = await db
      .select()
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_active, true))
      .orderBy(
        asc(kategoriMenuTable.nama_kategori),
        asc(kategoriMenuTable.kode_item),
      );

    return list.map((item) => ({
      kode: item.kode_item,
      label: item.label_item,
      kategori: item.nama_kategori,
      isSaring:
        (item as { is_diet_saring?: boolean | null }).is_diet_saring ?? false,
    }));
  } catch (error) {
    console.error('Error fetching kategori menu for diet options:', error);
    return [];
  }
}

/**
 * Fetch unique diet options from existing cycle menu items for patient diet mapping dropdowns.
 */
export async function getSiklusDietOptions(): Promise<SiklusDietOption[]> {
  try {
    await ensureTableInitialized();

    const [rows, labelRows] = await Promise.all([
      db
        .selectDistinct({
          jenis_makanan: masterSiklusMenuTable.jenis_makanan,
          kategori_menu: masterSiklusMenuTable.kategori_menu,
        })
        .from(masterSiklusMenuTable)
        .where(eq(masterSiklusMenuTable.is_active, true)),
      db
        .select({
          kode: kategoriMenuTable.kode_item,
          label: kategoriMenuTable.label_item,
          kategori: kategoriMenuTable.nama_kategori,
        })
        .from(kategoriMenuTable)
        .where(eq(kategoriMenuTable.is_active, true)),
    ]);

    return buildSiklusDietOptions(rows, labelRows);
  } catch (error) {
    console.error('Error fetching siklus diet options:', error);
    return [];
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a single menu item in the cycle
 */
export async function createSiklusMenuItem(
  payload: CreateSiklusItemPayload,
): Promise<MutationResult> {
  if (!payload.nama_makanan?.trim()) {
    return createErrorResult('Nama makanan tidak boleh kosong.');
  }

  const jenisMakanan = (payload.jenis_makanan || 'HEWANI').toUpperCase();
  const waktuMakan = (payload.waktu_makan || 'PAGI').toUpperCase();

  try {
    await ensureTableInitialized();

    if (isInvalidFruitSlot(jenisMakanan, waktuMakan)) {
      return createErrorResult(
        'Menu buah hanya tersedia untuk Siang dan Sore.',
      );
    }

    const tagOptions = await getActiveTagOptions(jenisMakanan);
    const tagSelection = validateMenuTagSelection(
      payload.kategori_menu,
      tagOptions,
      jenisMakanan,
    );
    if (tagSelection.error) return createErrorResult(tagSelection.error);

    // Ensure cycle exists in master_siklus
    const targetCycle = payload.siklus_ke || 1;
    await ensureCycleExists(targetCycle);

    const [inserted] = await db
      .insert(masterSiklusMenuTable)
      .values({
        siklus_ke: targetCycle,
        kelas: payload.kelas || 'Semua Kelas',
        jenis_makanan: jenisMakanan,
        waktu_makan: waktuMakan,
        nama_makanan: payload.nama_makanan.trim(),
        kategori_menu: tagSelection.value,
        catatan: payload.catatan?.trim() || null,
        is_active: payload.is_active ?? true,
      })
      .returning({ id: masterSiklusMenuTable.id });

    revalidateSiklusPath();
    return createSuccessResult(
      `Menu "${payload.nama_makanan}" berhasil ditambahkan.`,
      inserted?.id,
    );
  } catch (error) {
    console.error('Error creating siklus_menu item:', error);
    return createErrorResult('Gagal menambahkan hidangan ke siklus menu.');
  }
}

/**
 * Update an existing menu item in the cycle
 */
export async function updateSiklusMenuItem(
  id: number,
  payload: UpdateSiklusItemPayload,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    const [existingItem] = await db
      .select({
        jenis_makanan: masterSiklusMenuTable.jenis_makanan,
        waktu_makan: masterSiklusMenuTable.waktu_makan,
        kategori_menu: masterSiklusMenuTable.kategori_menu,
      })
      .from(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.id, id))
      .limit(1);

    if (!existingItem) {
      return createErrorResult('Hidangan siklus menu tidak ditemukan.');
    }

    const targetJenis = payload.jenis_makanan || existingItem.jenis_makanan;
    const targetWaktu = payload.waktu_makan || existingItem.waktu_makan;

    if (isInvalidFruitSlot(targetJenis, targetWaktu)) {
      return createErrorResult(
        'Menu buah hanya tersedia untuk Siang dan Sore.',
      );
    }

    const targetKategori =
      payload.kategori_menu === undefined
        ? existingItem.kategori_menu
        : payload.kategori_menu;

    const tagOptions = await getActiveTagOptions(targetJenis);
    const tagSelection = validateMenuTagSelection(
      targetKategori,
      tagOptions,
      targetJenis,
    );
    if (tagSelection.error) return createErrorResult(tagSelection.error);

    if (payload.siklus_ke !== undefined) {
      await ensureCycleExists(payload.siklus_ke);
    }

    await db
      .update(masterSiklusMenuTable)
      .set({
        ...(payload.siklus_ke !== undefined
          ? { siklus_ke: payload.siklus_ke }
          : {}),
        ...(payload.kelas !== undefined ? { kelas: payload.kelas } : {}),
        ...(payload.jenis_makanan !== undefined
          ? { jenis_makanan: payload.jenis_makanan.toUpperCase() }
          : {}),
        ...(payload.waktu_makan !== undefined
          ? { waktu_makan: payload.waktu_makan.toUpperCase() }
          : {}),
        ...(payload.nama_makanan !== undefined
          ? { nama_makanan: payload.nama_makanan.trim() }
          : {}),
        kategori_menu: tagSelection.value,
        ...(payload.catatan !== undefined
          ? { catatan: payload.catatan?.trim() || null }
          : {}),
        ...(payload.is_active !== undefined
          ? { is_active: payload.is_active }
          : {}),
        updated_at: new Date(),
      })
      .where(eq(masterSiklusMenuTable.id, id));

    revalidateSiklusPath();
    return createSuccessResult('Hidangan siklus menu berhasil diperbarui.');
  } catch (error) {
    console.error('Error updating siklus_menu item:', error);
    return createErrorResult('Gagal memperbarui hidangan.');
  }
}

/**
 * Delete a menu item from the cycle
 */
export async function deleteSiklusMenuItem(
  id: number,
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.id, id));

    revalidateSiklusPath();
    return createSuccessResult('Hidangan berhasil dihapus dari siklus menu.');
  } catch (error) {
    console.error('Error deleting siklus_menu item:', error);
    return createErrorResult('Gagal menghapus hidangan.');
  }
}

/**
 * Batch update an entire cell slot (e.g. all dishes for Siklus 1, Kelas I, Hewani, Pagi)
 */
export async function saveSlotMenuItems(
  siklusKe: number,
  kelas: string,
  jenisMakanan: string,
  waktuMakan: string,
  items: SlotItemInput[],
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    if (isInvalidFruitSlot(jenisMakanan, waktuMakan)) {
      return createErrorResult(
        'Menu buah hanya tersedia untuk Siang dan Sore.',
      );
    }

    const validItems = items.filter((item) => item.nama_makanan?.trim());
    const allowedTags = await getActiveTagOptions(jenisMakanan);
    const normalizedTags = validItems.map((item) =>
      validateMenuTagSelection(item.kategori_menu, allowedTags, jenisMakanan),
    );

    const invalidIndex = normalizedTags.findIndex(
      (selection) => selection.error,
    );
    if (invalidIndex !== -1) {
      return createErrorResult(
        `Hidangan #${invalidIndex + 1}: ${normalizedTags[invalidIndex].error}`,
      );
    }

    // Ensure cycle exists in master_siklus
    await ensureCycleExists(siklusKe);

    // 1. Delete existing items in this exact slot
    await db
      .delete(masterSiklusMenuTable)
      .where(
        and(
          eq(masterSiklusMenuTable.siklus_ke, siklusKe),
          eq(masterSiklusMenuTable.kelas, kelas),
          eq(masterSiklusMenuTable.jenis_makanan, jenisMakanan),
          eq(masterSiklusMenuTable.waktu_makan, waktuMakan),
        ),
      );

    // 2. Insert new items if provided
    if (validItems.length > 0) {
      await db.insert(masterSiklusMenuTable).values(
        validItems.map((item, idx) => ({
          siklus_ke: siklusKe,
          kelas,
          jenis_makanan: jenisMakanan.toUpperCase(),
          waktu_makan: waktuMakan.toUpperCase(),
          nama_makanan: item.nama_makanan.trim(),
          kategori_menu: normalizedTags[idx].value,
          catatan: item.catatan?.trim() || null,
          is_active: true,
        })),
      );
    }

    revalidateSiklusPath();
    return createSuccessResult(
      `Konfigurasi slot (${validItems.length} hidangan) berhasil disimpan.`,
    );
  } catch (error) {
    console.error('Error batch updating slot menu items:', error);
    return createErrorResult('Gagal menyimpan slot hidangan.');
  }
}

/**
 * Duplicate an entire cycle (e.g. copy all dishes from Siklus 1 to Siklus 2)
 */
export async function duplicateSiklus(
  fromSiklus: number,
  toSiklus: number,
): Promise<MutationResult> {
  if (fromSiklus === toSiklus) {
    return createErrorResult('Siklus sumber dan tujuan tidak boleh sama.');
  }

  try {
    await ensureTableInitialized();

    // Ensure target cycle exists in master_siklus
    await ensureCycleExists(toSiklus, `Diduplikasi dari Siklus #${fromSiklus}`);

    // Delete existing items in target cycle
    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, toSiklus));

    // Copy dishes from source cycle to target cycle
    const copiedCount = await copyCycleMenuItems(fromSiklus, toSiklus);

    if (copiedCount === 0) {
      return createErrorResult(
        `Tidak ada data pada Siklus ${fromSiklus} untuk disalin.`,
      );
    }

    revalidateSiklusPath();
    return createSuccessResult(
      `Berhasil menduplikasi ${copiedCount} hidangan dari Siklus ${fromSiklus} ke Siklus ${toSiklus}.`,
    );
  } catch (error) {
    console.error('Error duplicating siklus:', error);
    return createErrorResult('Gagal menduplikasi siklus menu.');
  }
}

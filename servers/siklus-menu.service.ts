'use server';

import { eq, and, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import {
  masterSiklusTable,
  masterSiklusMenuTable,
} from '@/db/schemas/master/siklus-menu';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';

// ─── Types ──────────────────────────────────────────────────────────────────

const HARI_ROTASI_LIST = [
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
  'MINGGU',
] as const;

export type HariRotasi = (typeof HARI_ROTASI_LIST)[number];


export interface MasterSiklusItem {
  id: number;
  nomor_siklus: number;
  nama_siklus: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CreateMasterSiklusPayload = {
  nomor_siklus: number;
  nama_siklus: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi?: string | null;
  copyFromSiklus?: number | null;
};

export type UpdateMasterSiklusPayload = {
  nama_siklus?: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi?: string | null;
  is_active?: boolean;
};

export interface SiklusMenuItem {
  id: number;
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  nama_makanan: string;
  kategori_menu: string | null;
  catatan: string | null;
  urutan: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MutationResult {
  success: boolean;
  message: string;
  insertedId?: number;
}

export type CreateSiklusItemPayload = {
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  nama_makanan: string;
  kategori_menu?: string | null;
  catatan?: string | null;
  urutan?: number;
  is_active?: boolean;
};

export type UpdateSiklusItemPayload = Partial<CreateSiklusItemPayload>;

export type SlotItemInput = {
  id?: number;
  nama_makanan: string;
  kategori_menu?: string | null;
  catatan?: string | null;
  urutan?: number;
};

export interface SiklusMatrixRow {
  id: string; // Unique key e.g. "I-HEWANI" or "II-III-HEWANI" or "ALL-NABATI"
  kelas: string; // "I", "II-III", "VIP", "Semua Kelas"
  jenis_makanan: string; // "HEWANI" | "NABATI" | "SAYUR" | "SARING"
  label: string;
  pagi: SiklusMenuItem[];
  siang: SiklusMenuItem[];
  sore: SiklusMenuItem[];
  saring_siang: SiklusMenuItem[];
}

export interface SiklusStatsData {
  totalItems: number;
  pagiCount: number;
  siangCount: number;
  soreCount: number;
  saringCount: number;
  hewaniCount: number;
  nabatiCount: number;
  sayurCount: number;
  kelasCount: number;
}

// ─── Helpers: Ensure Tables Exist & Seed Default Master ─────────────────────

async function ensureTableInitialized() {
  try {
    // 1. Ensure master_siklus table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "master_siklus" (
        "id" serial PRIMARY KEY NOT NULL,
        "nomor_siklus" integer UNIQUE NOT NULL,
        "nama_siklus" text NOT NULL,
        "hari" text,
        "deskripsi" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Ensure hari & tanggal columns exist if created previously
    await db.execute(sql`
      ALTER TABLE "master_siklus" ADD COLUMN IF NOT EXISTS "hari" text;
    `);
    await db.execute(sql`
      ALTER TABLE "master_siklus" ADD COLUMN IF NOT EXISTS "tanggal" text;
    `);

    // 2. Ensure master_siklus_menu table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "master_siklus_menu" (
        "id" serial PRIMARY KEY NOT NULL,
        "siklus_ke" integer DEFAULT 1 NOT NULL,
        "kelas" text DEFAULT 'Semua Kelas' NOT NULL,
        "jenis_makanan" text NOT NULL,
        "waktu_makan" text NOT NULL,
        "nama_makanan" text NOT NULL,
        "kategori_menu" text,
        "catatan" text,
        "urutan" integer DEFAULT 0 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 3. Auto-seed default cycles 1-10 (+11) if master_siklus is empty
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(masterSiklusTable);
    const totalCycles = countRes[0]?.count || 0;

    if (totalCycles === 0) {
      // Look for any existing cycles in master_siklus_menu
      const existingMenuCycles = await db
        .selectDistinct({ siklus_ke: masterSiklusMenuTable.siklus_ke })
        .from(masterSiklusMenuTable);

      const distinctNums = existingMenuCycles
        .map((r) => r.siklus_ke)
        .filter(Boolean);

      const defaultNumbers = Array.from(
        new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...distinctNums]),
      ).sort((a, b) => a - b);

      await db.insert(masterSiklusTable).values(
        defaultNumbers.map((num) => {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + (num - 1));
          const yyyy = targetDate.getFullYear();
          const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dd = String(targetDate.getDate()).padStart(2, '0');
          const iso = `${yyyy}-${mm}-${dd}`;
          const displayTarget = targetDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return {
            nomor_siklus: num,
            nama_siklus: `Siklus ${num}${num === 31 ? ' (Tgl 31)' : ''}`,
            hari: HARI_ROTASI_LIST[(num - 1) % 7],
            tanggal: iso,
            deskripsi: `Rotasi menu makanan siklus tanggal ${displayTarget}`,
            is_active: true,
          };
        }),
      );
    } else {
      // If table already has cycles but tanggal is null, initialize them
      const nullTanggalCycles = await db
        .select({
          id: masterSiklusTable.id,
          nomor_siklus: masterSiklusTable.nomor_siklus,
        })
        .from(masterSiklusTable)
        .where(sql`"tanggal" IS NULL`)
        .orderBy(asc(masterSiklusTable.nomor_siklus));

      if (nullTanggalCycles.length > 0) {
        const today = new Date();
        const dayNames = [
          'MINGGU',
          'SENIN',
          'SELASA',
          'RABU',
          'KAMIS',
          'JUMAT',
          'SABTU',
        ];
        for (let i = 0; i < nullTanggalCycles.length; i++) {
          const row = nullTanggalCycles[i];
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + (row.nomor_siklus - 1));
          const yyyy = targetDate.getFullYear();
          const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dd = String(targetDate.getDate()).padStart(2, '0');
          const iso = `${yyyy}-${mm}-${dd}`;
          const day = dayNames[targetDate.getDay()];
          const displayTarget = targetDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          await db
            .update(masterSiklusTable)
            .set({
              tanggal: iso,
              hari: day,
              deskripsi: `Rotasi menu makanan siklus tanggal ${displayTarget}`,
              updated_at: new Date(),
            })
            .where(eq(masterSiklusTable.id, row.id));
        }
      }
    }
  } catch (err) {
    console.error('Error ensuring master_siklus / menu tables exist:', err);
  }
}

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
 * Create a new cycle in the master table with optional copy
 */
export async function createMasterSiklus(
  payload: CreateMasterSiklusPayload,
): Promise<MutationResult & { createdSiklus?: number }> {
  if (!payload.nomor_siklus || payload.nomor_siklus < 1) {
    return {
      success: false,
      message: 'Nomor siklus harus berupa angka positif (minimal 1).',
    };
  }

  try {
    await ensureTableInitialized();

    // Check duplicate
    const existing = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, payload.nomor_siklus))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        message: `Siklus #${payload.nomor_siklus} sudah terdaftar. Silakan pilih nomor siklus lain.`,
      };
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
    if (payload.copyFromSiklus && payload.copyFromSiklus > 0) {
      const sourceItems = await db
        .select()
        .from(masterSiklusMenuTable)
        .where(eq(masterSiklusMenuTable.siklus_ke, payload.copyFromSiklus));

      if (sourceItems && sourceItems.length > 0) {
        await db.insert(masterSiklusMenuTable).values(
          sourceItems.map((item) => ({
            siklus_ke: payload.nomor_siklus,
            kelas: item.kelas,
            jenis_makanan: item.jenis_makanan,
            waktu_makan: item.waktu_makan,
            nama_makanan: item.nama_makanan,
            kategori_menu: item.kategori_menu,
            catatan: item.catatan,
            urutan: item.urutan,
            is_active: item.is_active,
          })),
        );
      }
    }

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `${namaSiklus} berhasil ditambahkan ke master siklus.${
        payload.copyFromSiklus
          ? ` (Hidangan disalin dari Siklus #${payload.copyFromSiklus})`
          : ''
      }`,
      insertedId: inserted?.id,
      createdSiklus: payload.nomor_siklus,
    };
  } catch (error) {
    console.error('Error creating master siklus:', error);
    return {
      success: false,
      message: 'Gagal menambahkan siklus baru ke sistem.',
    };
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

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Informasi Siklus #${nomorSiklus} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error('Error updating master siklus:', error);
    return { success: false, message: 'Gagal memperbarui data master siklus.' };
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

    const startDate =
      typeof startDateInput === 'string'
        ? new Date(startDateInput)
        : startDateInput;

    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        message: 'Tanggal mulai rotasi siklus tidak valid.',
      };
    }

    const cycles = await db
      .select()
      .from(masterSiklusTable)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    if (!cycles || cycles.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data siklus menu yang terdaftar.',
      };
    }

    const dayNames = [
      'MINGGU',
      'SENIN',
      'SELASA',
      'RABU',
      'KAMIS',
      'JUMAT',
      'SABTU',
    ];

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const assignedDay = dayNames[targetDate.getDay()];
      const displayTargetDate = targetDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

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

    try {
      revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    } catch {}

    const displayDate = startDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      success: true,
      message: `Jadwal rotasi siklus berhasil diperbarui: Siklus #1 dimulai pada tanggal ${displayDate}.`,
    };
  } catch (error) {
    console.error('Error applying start date rotation:', error);
    return {
      success: false,
      message: 'Gagal mengatur jadwal tanggal rotasi siklus.',
    };
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
      return {
        success: false,
        message: `Hari "${startDay}" tidak valid. Pilih antara SENIN s.d. MINGGU.`,
      };
    }

    const cycles = await db
      .select()
      .from(masterSiklusTable)
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    if (!cycles || cycles.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data siklus menu yang terdaftar.',
      };
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

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Jadwal rotasi siklus berhasil diperbarui: Siklus #1 dimulai pada hari ${normalizedStartDay}.`,
    };
  } catch (error) {
    console.error('Error applying start day rotation:', error);
    return {
      success: false,
      message: 'Gagal mengatur jadwal hari rotasi siklus.',
    };
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

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Siklus #${nomorSiklus} beserta seluruh menu hidangannya berhasil dihapus.`,
    };
  } catch (error) {
    console.error('Error deleting master siklus:', error);
    return { success: false, message: 'Gagal menghapus siklus dari sistem.' };
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
        asc(masterSiklusMenuTable.urutan),
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
      urutan: row.urutan,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching siklus_menu from database:', error);
    return [];
  }
}

export async function deleteAllItemSiklusMenu(siklusKe: number): Promise<void> {
  try {
    await ensureTableInitialized();

    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, siklusKe));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
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

    const nums = results.map((r) => r.nomor_siklus).filter(Boolean);
    if (nums.length === 0) {
      return [];
    }
    return nums;
  } catch (error) {
    console.error('Error getting available siklus list:', error);
    return [];
  }
}

/**
 * Fetch kategori menu options from master table for badge/tag options
 */
export async function getKategoriMenuDietList(): Promise<
  Array<{ kode: string; label: string; kategori: string }>
> {
  try {
    const list = await db
      .select()
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_active, true))
      .orderBy(
        asc(kategoriMenuTable.nama_kategori),
        asc(kategoriMenuTable.urutan),
      );

    return list.map((item) => ({
      kode: item.kode_item,
      label: item.label_item,
      kategori: item.nama_kategori,
    }));
  } catch (error) {
    console.error('Error fetching kategori menu for diet options:', error);
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
    return { success: false, message: 'Nama makanan tidak boleh kosong.' };
  }

  try {
    await ensureTableInitialized();

    // Ensure cycle exists in master_siklus
    const targetCycle = payload.siklus_ke || 1;
    const existingCycle = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, targetCycle))
      .limit(1);

    if (existingCycle.length === 0) {
      await db.insert(masterSiklusTable).values({
        nomor_siklus: targetCycle,
        nama_siklus: `Siklus ${targetCycle}`,
        is_active: true,
      });
    }

    const [inserted] = await db
      .insert(masterSiklusMenuTable)
      .values({
        siklus_ke: targetCycle,
        kelas: payload.kelas || 'Semua Kelas',
        jenis_makanan: (payload.jenis_makanan || 'HEWANI').toUpperCase(),
        waktu_makan: (payload.waktu_makan || 'PAGI').toUpperCase(),
        nama_makanan: payload.nama_makanan.trim(),
        kategori_menu: payload.kategori_menu?.trim() || null,
        catatan: payload.catatan?.trim() || null,
        urutan: payload.urutan ?? 0,
        is_active: payload.is_active ?? true,
      })
      .returning({ id: masterSiklusMenuTable.id });

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Menu "${payload.nama_makanan}" berhasil ditambahkan.`,
      insertedId: inserted?.id,
    };
  } catch (error) {
    console.error('Error creating siklus_menu item:', error);
    return {
      success: false,
      message: 'Gagal menambahkan hidangan ke siklus menu.',
    };
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

    if (payload.siklus_ke !== undefined) {
      const existingCycle = await db
        .select()
        .from(masterSiklusTable)
        .where(eq(masterSiklusTable.nomor_siklus, payload.siklus_ke))
        .limit(1);

      if (existingCycle.length === 0) {
        await db.insert(masterSiklusTable).values({
          nomor_siklus: payload.siklus_ke,
          nama_siklus: `Siklus ${payload.siklus_ke}`,
          is_active: true,
        });
      }
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
        ...(payload.kategori_menu !== undefined
          ? { kategori_menu: payload.kategori_menu?.trim() || null }
          : {}),
        ...(payload.catatan !== undefined
          ? { catatan: payload.catatan?.trim() || null }
          : {}),
        ...(payload.urutan !== undefined ? { urutan: payload.urutan } : {}),
        ...(payload.is_active !== undefined
          ? { is_active: payload.is_active }
          : {}),
        updated_at: new Date(),
      })
      .where(eq(masterSiklusMenuTable.id, id));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: 'Hidangan siklus menu berhasil diperbarui.',
    };
  } catch (error) {
    console.error('Error updating siklus_menu item:', error);
    return { success: false, message: 'Gagal memperbarui hidangan.' };
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

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: 'Hidangan berhasil dihapus dari siklus menu.',
    };
  } catch (error) {
    console.error('Error deleting siklus_menu item:', error);
    return { success: false, message: 'Gagal menghapus hidangan.' };
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

    // Ensure cycle exists in master_siklus
    const existingCycle = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, siklusKe))
      .limit(1);

    if (existingCycle.length === 0) {
      await db.insert(masterSiklusTable).values({
        nomor_siklus: siklusKe,
        nama_siklus: `Siklus ${siklusKe}`,
        is_active: true,
      });
    }

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
    const validItems = items.filter((i) => i.nama_makanan?.trim());
    if (validItems.length > 0) {
      await db.insert(masterSiklusMenuTable).values(
        validItems.map((item, idx) => ({
          siklus_ke: siklusKe,
          kelas,
          jenis_makanan: jenisMakanan.toUpperCase(),
          waktu_makan: waktuMakan.toUpperCase(),
          nama_makanan: item.nama_makanan.trim(),
          kategori_menu: item.kategori_menu?.trim() || null,
          catatan: item.catatan?.trim() || null,
          urutan: item.urutan ?? idx + 1,
          is_active: true,
        })),
      );
    }

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Konfigurasi slot (${validItems.length} hidangan) berhasil disimpan.`,
    };
  } catch (error) {
    console.error('Error batch updating slot menu items:', error);
    return { success: false, message: 'Gagal menyimpan slot hidangan.' };
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
    return {
      success: false,
      message: 'Siklus sumber dan tujuan tidak boleh sama.',
    };
  }

  try {
    await ensureTableInitialized();

    // Ensure target cycle exists in master_siklus
    const existingTarget = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.nomor_siklus, toSiklus))
      .limit(1);

    if (existingTarget.length === 0) {
      await db.insert(masterSiklusTable).values({
        nomor_siklus: toSiklus,
        nama_siklus: `Siklus ${toSiklus}`,
        deskripsi: `Diduplikasi dari Siklus #${fromSiklus}`,
        is_active: true,
      });
    }

    // Fetch source items
    const sourceItems = await db
      .select()
      .from(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, fromSiklus));

    if (!sourceItems || sourceItems.length === 0) {
      return {
        success: false,
        message: `Tidak ada data pada Siklus ${fromSiklus} untuk disalin.`,
      };
    }

    // Delete existing items in target cycle
    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, toSiklus));

    // Insert copied items into target cycle
    await db.insert(masterSiklusMenuTable).values(
      sourceItems.map((item) => ({
        siklus_ke: toSiklus,
        kelas: item.kelas,
        jenis_makanan: item.jenis_makanan,
        waktu_makan: item.waktu_makan,
        nama_makanan: item.nama_makanan,
        kategori_menu: item.kategori_menu,
        catatan: item.catatan,
        urutan: item.urutan,
        is_active: item.is_active,
      })),
    );

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Berhasil menduplikasi ${sourceItems.length} hidangan dari Siklus ${fromSiklus} ke Siklus ${toSiklus}.`,
    };
  } catch (error) {
    console.error('Error duplicating siklus:', error);
    return { success: false, message: 'Gagal menduplikasi siklus menu.' };
  }
}

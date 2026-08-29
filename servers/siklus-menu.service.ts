'use server';

import { eq, and, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { masterSiklusMenuTable } from '@/db/schemas/master/siklus-menu';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Default Reference Seed Data (Siklus 1 from Hospital standard) ─────────

const INITIAL_SIKLUS_1_ITEMS: Array<Omit<CreateSiklusItemPayload, 'siklus_ke'>> = [
  // ── Kelas I - HEWANI ──
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Puyuh BB Kecap',
    kategori_menu: 'B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Puyuh BB Kuning',
    kategori_menu: 'Diit, DM',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Puyuh BB Kuning',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Puyuh BB Kuning',
    kategori_menu: 'RKol',
    catatan: '',
    urutan: 4,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Ayam fillet Panggang',
    kategori_menu: 'B, Diit, DM',
    catatan: 'fillet',
    urutan: 1,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Ayam fillet Panggang',
    kategori_menu: 'RG',
    catatan: 'fillet',
    urutan: 2,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SORE',
    nama_makanan: 'Gadon Ayam Cetak D',
    kategori_menu: 'B, Diit, DM',
    catatan: 'Cetak D',
    urutan: 1,
  },
  {
    kelas: 'I',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SORE',
    nama_makanan: 'Gadon Ayam Cetak D',
    kategori_menu: 'RG',
    catatan: 'Cetak D',
    urutan: 2,
  },
  {
    kelas: 'I',
    jenis_makanan: 'SARING',
    waktu_makan: 'SARING_SIANG',
    nama_makanan: 'Bubur sumsum',
    kategori_menu: 'SARING',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'I',
    jenis_makanan: 'SARING',
    waktu_makan: 'SARING_SIANG',
    nama_makanan: 'Tumis Telur Puyuh',
    kategori_menu: 'SARING',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'I',
    jenis_makanan: 'SARING',
    waktu_makan: 'SARING_SIANG',
    nama_makanan: 'Stik Tempe Kukus',
    kategori_menu: 'SARING',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'I',
    jenis_makanan: 'SARING',
    waktu_makan: 'SARING_SIANG',
    nama_makanan: 'Sup Wortel Saring',
    kategori_menu: 'SARING',
    catatan: '',
    urutan: 4,
  },

  // ── Kelas II-III - HEWANI ──
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Ayam BB Kecap',
    kategori_menu: 'B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Ayam BB Kuning',
    kategori_menu: 'Diit, DM',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Telur Ayam BB Kuning',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Putih Telur BB Kuning',
    kategori_menu: 'DJ, RKol, RL',
    catatan: '',
    urutan: 4,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Pepes Ayam Potong',
    kategori_menu: 'B, Diit, DM',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Pepes Ayam Potong',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SORE',
    nama_makanan: 'Gadon Ayam Cetak D',
    kategori_menu: 'B, Diit, DM',
    catatan: 'Cetak D',
    urutan: 1,
  },
  {
    kelas: 'II-III',
    jenis_makanan: 'HEWANI',
    waktu_makan: 'SORE',
    nama_makanan: 'Gadon Ayam Cetak D',
    kategori_menu: 'RG',
    catatan: 'Cetak D',
    urutan: 2,
  },

  // ── NABATI (Semua Kelas / I, II-III) ──
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Tumis Tahu Bw.daun',
    kategori_menu: 'RG',
    catatan: '*ptg dadu',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'PAGI',
    nama_makanan: 'Tahu Tempe Ungkep',
    kategori_menu: 'B, Diit, DM',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Bacem Tempe',
    kategori_menu: 'B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Tempe BB Kuning',
    kategori_menu: 'Diit, DM',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'SIANG',
    nama_makanan: 'Tempe BB Kuning',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'SORE',
    nama_makanan: 'Balado Tahu',
    kategori_menu: 'B, Diit, DM',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'NABATI',
    waktu_makan: 'SORE',
    nama_makanan: 'Balado Tahu',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 2,
  },

  // ── SAYUR (Semua Kelas / I, II-III) ──
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'PAGI',
    nama_makanan: 'Sup Sawi Putih, Wortel, Jg.Manis',
    kategori_menu: 'B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'PAGI',
    nama_makanan: 'Sup Sawi Putih, Wortel, Jg.Manis',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'PAGI',
    nama_makanan: 'Sup Sawi Putih, Wortel',
    kategori_menu: 'DM',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'PAGI',
    nama_makanan: 'Sup Sayur Bening',
    kategori_menu: 'DJ, DH, RL',
    catatan: '',
    urutan: 4,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'PAGI',
    nama_makanan: 'Sup Wortel',
    kategori_menu: 'RP, RS',
    catatan: '',
    urutan: 5,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SIANG',
    nama_makanan: 'Sup Bungakol, wortel, jmrkuping, sohun',
    kategori_menu: 'B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SIANG',
    nama_makanan: 'Sup Bungakol, wortel, jmrkuping, sohun',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SIANG',
    nama_makanan: 'Sup Bungakol, wortel, jmrkuping',
    kategori_menu: 'DM',
    catatan: '',
    urutan: 3,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SIANG',
    nama_makanan: 'Sup Wortel, jmrkuping, sohun',
    kategori_menu: 'DJ, DH, RL',
    catatan: '',
    urutan: 4,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SIANG',
    nama_makanan: 'Sup Wortel',
    kategori_menu: 'RP, RS',
    catatan: '',
    urutan: 5,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SORE',
    nama_makanan: 'Sayur Sop Campur',
    kategori_menu: 'DIIT, DM, B',
    catatan: '',
    urutan: 1,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SORE',
    nama_makanan: 'Sup Jamur Tiram, Wortel, Buncis',
    kategori_menu: 'RG',
    catatan: '',
    urutan: 2,
  },
  {
    kelas: 'Semua Kelas',
    jenis_makanan: 'SAYUR',
    waktu_makan: 'SORE',
    nama_makanan: 'Sup Labu Siam',
    kategori_menu: 'RP, RS',
    catatan: '*PTG DADU',
    urutan: 3,
  },
];

// ─── Helpers: Ensure Table Exists ──────────────────────────────────────────

async function ensureTableInitialized() {
  try {
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
  } catch (err) {
    console.error('Error ensuring master_siklus_menu table exists:', err);
  }
}

// ─── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all items for a given cycle (default 1) or all cycles
 */
export async function getSiklusMenuList(siklusKe: number = 1): Promise<SiklusMenuItem[]> {
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
        asc(masterSiklusMenuTable.id)
      );

    // If database is empty for Siklus 1, auto-seed with reference hospital data
    if ((!dbResults || dbResults.length === 0) && siklusKe === 1) {
      console.log('Master Siklus 1 kosong, melakukan auto-seed default data rumah sakit...');
      await resetSiklusToDefault(1);
      return getSiklusMenuList(1);
    }

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

/**
 * Get distinct active siklus numbers available in database
 */
export async function getAvailableSiklusList(): Promise<number[]> {
  try {
    await ensureTableInitialized();

    const results = await db
      .selectDistinct({ siklus_ke: masterSiklusMenuTable.siklus_ke })
      .from(masterSiklusMenuTable)
      .orderBy(asc(masterSiklusMenuTable.siklus_ke));

    const nums = results.map((r) => r.siklus_ke).filter(Boolean);
    if (!nums.includes(1)) {
      nums.unshift(1);
    }
    return nums.length > 0 ? nums : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  } catch (error) {
    console.error('Error getting available siklus list:', error);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
}

/**
 * Fetch kategori menu options from master table for badge/tag options
 */
export async function getKategoriMenuDietList(): Promise<Array<{ kode: string; label: string; kategori: string }>> {
  try {
    const list = await db
      .select()
      .from(kategoriMenuTable)
      .where(eq(kategoriMenuTable.is_active, true))
      .orderBy(asc(kategoriMenuTable.nama_kategori), asc(kategoriMenuTable.urutan));

    return list.map((item) => ({
      kode: item.kode_item,
      label: item.label_item,
      kategori: item.nama_kategori,
    }));
  } catch (error) {
    console.error('Error fetching kategori menu for diet options:', error);
    // Fallback default options
    return [
      { kode: 'B', label: 'Biasa', kategori: 'DIIT' },
      { kode: 'Diit', label: 'Diit Khusus', kategori: 'DIIT' },
      { kode: 'DM', label: 'Diabetes Melitus', kategori: 'DIIT' },
      { kode: 'RG', label: 'Rendah Garam', kategori: 'DIIT' },
      { kode: 'DJ', label: 'Diet Jantung', kategori: 'DIIT' },
      { kode: 'DH', label: 'Diet Hati', kategori: 'DIIT' },
      { kode: 'RP', label: 'Rendah Protein', kategori: 'DIIT' },
      { kode: 'RS', label: 'Rendah Serat', kategori: 'DIIT' },
      { kode: 'RL', label: 'Rendah Lemak', kategori: 'DIIT' },
      { kode: 'RKol', label: 'Rendah Kolesterol', kategori: 'DIIT' },
      { kode: 'TKTP', label: 'Tinggi Kalori Tinggi Protein', kategori: 'DIIT' },
      { kode: 'SARING', label: 'Makanan Saring', kategori: 'BENTUK_MAKANAN' },
    ];
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a single menu item in the cycle
 */
export async function createSiklusMenuItem(
  payload: CreateSiklusItemPayload
): Promise<MutationResult> {
  if (!payload.nama_makanan?.trim()) {
    return { success: false, message: 'Nama makanan tidak boleh kosong.' };
  }

  try {
    await ensureTableInitialized();

    const [inserted] = await db
      .insert(masterSiklusMenuTable)
      .values({
        siklus_ke: payload.siklus_ke || 1,
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
    return { success: false, message: 'Gagal menambahkan hidangan ke siklus menu.' };
  }
}

/**
 * Update an existing menu item in the cycle
 */
export async function updateSiklusMenuItem(
  id: number,
  payload: UpdateSiklusItemPayload
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    await db
      .update(masterSiklusMenuTable)
      .set({
        ...(payload.siklus_ke !== undefined ? { siklus_ke: payload.siklus_ke } : {}),
        ...(payload.kelas !== undefined ? { kelas: payload.kelas } : {}),
        ...(payload.jenis_makanan !== undefined ? { jenis_makanan: payload.jenis_makanan.toUpperCase() } : {}),
        ...(payload.waktu_makan !== undefined ? { waktu_makan: payload.waktu_makan.toUpperCase() } : {}),
        ...(payload.nama_makanan !== undefined ? { nama_makanan: payload.nama_makanan.trim() } : {}),
        ...(payload.kategori_menu !== undefined ? { kategori_menu: payload.kategori_menu?.trim() || null } : {}),
        ...(payload.catatan !== undefined ? { catatan: payload.catatan?.trim() || null } : {}),
        ...(payload.urutan !== undefined ? { urutan: payload.urutan } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        updated_at: new Date(),
      })
      .where(eq(masterSiklusMenuTable.id, id));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return { success: true, message: 'Hidangan siklus menu berhasil diperbarui.' };
  } catch (error) {
    console.error('Error updating siklus_menu item:', error);
    return { success: false, message: 'Gagal memperbarui hidangan.' };
  }
}

/**
 * Delete a menu item from the cycle
 */
export async function deleteSiklusMenuItem(id: number): Promise<MutationResult> {
  try {
    await ensureTableInitialized();
    await db.delete(masterSiklusMenuTable).where(eq(masterSiklusMenuTable.id, id));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return { success: true, message: 'Hidangan berhasil dihapus dari siklus menu.' };
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
  items: SlotItemInput[]
): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    // 1. Delete existing items in this exact slot
    await db
      .delete(masterSiklusMenuTable)
      .where(
        and(
          eq(masterSiklusMenuTable.siklus_ke, siklusKe),
          eq(masterSiklusMenuTable.kelas, kelas),
          eq(masterSiklusMenuTable.jenis_makanan, jenisMakanan),
          eq(masterSiklusMenuTable.waktu_makan, waktuMakan)
        )
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
        }))
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
  toSiklus: number
): Promise<MutationResult> {
  if (fromSiklus === toSiklus) {
    return { success: false, message: 'Siklus sumber dan tujuan tidak boleh sama.' };
  }

  try {
    await ensureTableInitialized();

    // Fetch source items
    const sourceItems = await db
      .select()
      .from(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, fromSiklus));

    if (!sourceItems || sourceItems.length === 0) {
      return { success: false, message: `Tidak ada data pada Siklus ${fromSiklus} untuk disalin.` };
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
      }))
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

/**
 * Reset cycle data to default reference hospital data
 */
export async function resetSiklusToDefault(siklusKe: number = 1): Promise<MutationResult> {
  try {
    await ensureTableInitialized();

    // Clear existing for this cycle
    await db
      .delete(masterSiklusMenuTable)
      .where(eq(masterSiklusMenuTable.siklus_ke, siklusKe));

    // Seed default items
    await db.insert(masterSiklusMenuTable).values(
      INITIAL_SIKLUS_1_ITEMS.map((item) => ({
        ...item,
        siklus_ke: siklusKe,
      }))
    );

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-siklus-menu');
    return {
      success: true,
      message: `Siklus ${siklusKe} berhasil di-reset ke standar referensi rumah sakit.`,
    };
  } catch (error) {
    console.error('Error resetting siklus to default:', error);
    return { success: false, message: 'Gagal me-reset siklus ke default.' };
  }
}

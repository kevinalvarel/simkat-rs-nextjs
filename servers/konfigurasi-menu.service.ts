'use server';

import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';

export interface KategoriMenuItem {
  id: number;
  nama_kategori: string;
  kode_item: string;
  label_item: string;
  is_active: boolean;
  is_tugas_ag_katering: boolean;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

export type CreateKategoriMenuPayload = {
  nama_kategori: string;
  kode_item: string;
  label_item: string;
  is_active?: boolean;
  is_tugas_ag_katering?: boolean;
};

export type UpdateKategoriMenuPayload = Partial<CreateKategoriMenuPayload>;

/**
 * True when the DB error means a schema column does not exist yet
 * (Postgres 42703) — i.e. the DB lags behind the migration.
 */
function isMissingColumnError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: unknown }).code === '42703') return true;
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return /column .* does not exist/i.test(message);
}

/**
 * Fetch all kategori menu items ordered by nama_kategori & kode_item ascending.
 *
 * Tahan terhadap DB yang belum di-migrate (`is_tugas_ag_katering` belum ada):
 * fallback ke 6 kolom lama dengan nilai default false.
 */
export async function getKategoriMenuAll(): Promise<KategoriMenuItem[]> {
  const toItems = (rows: {
    id: number;
    nama_kategori: string;
    kode_item: string;
    label_item: string;
    is_active: boolean;
    is_tugas_ag_katering?: boolean | null;
  }[]): KategoriMenuItem[] =>
    rows.map((item) => ({
      id: item.id,
      nama_kategori: item.nama_kategori,
      kode_item: item.kode_item,
      label_item: item.label_item,
      is_active: item.is_active,
      is_tugas_ag_katering: item.is_tugas_ag_katering ?? false,
    }));

  try {
    const dbResults = await db
      .select()
      .from(kategoriMenuTable)
      .orderBy(asc(kategoriMenuTable.nama_kategori), asc(kategoriMenuTable.kode_item));

    if (dbResults && dbResults.length > 0) {
      return toItems(dbResults);
    }
    return [];
  } catch (error) {
    if (!isMissingColumnError(error)) {
      console.error('Error fetching kategori_menu from database:', error);
      return [];
    }
    console.warn(
      'kategori_menu.is_tugas_ag_katering belum ada di DB — pakai fallback tanpa kolom itu. Jalankan migrasi 0007.',
    );
  }

  try {
    const legacyResults = await db
      .select({
        id: kategoriMenuTable.id,
        nama_kategori: kategoriMenuTable.nama_kategori,
        kode_item: kategoriMenuTable.kode_item,
        label_item: kategoriMenuTable.label_item,
        is_active: kategoriMenuTable.is_active,
      })
      .from(kategoriMenuTable)
      .orderBy(asc(kategoriMenuTable.nama_kategori), asc(kategoriMenuTable.kode_item));

    return toItems(legacyResults.map((item) => ({ ...item, is_tugas_ag_katering: false })));
  } catch (fallbackError) {
    console.error('Error fetching kategori_menu from database:', fallbackError);
    return [];
  }
}

/**
 * Create a new menu item in database
 */
export async function createKategoriMenuItem(
  payload: CreateKategoriMenuPayload,
): Promise<MutationResult> {
  if (!payload.nama_kategori?.trim() || !payload.kode_item?.trim() || !payload.label_item?.trim()) {
    return { success: false, message: 'Semua field wajib diisi.' };
  }

  try {
    const normalizedKategori = payload.nama_kategori.trim().toUpperCase();
    const isBentukMakanan = normalizedKategori === 'BENTUK_MAKANAN';
    await db.insert(kategoriMenuTable).values({
      nama_kategori: normalizedKategori,
      kode_item: payload.kode_item.trim().toUpperCase(),
      label_item: payload.label_item.trim(),
      is_active: payload.is_active ?? true,
      is_tugas_ag_katering: isBentukMakanan
        ? (payload.is_tugas_ag_katering ?? false)
        : false,
    });

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
    revalidatePath('/dashboard/ag-katering/mapping-diet');
    return {
      success: true,
      message: `Menu item "${payload.label_item}" (${payload.kode_item}) berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error('Error creating kategori_menu item:', error);
    return {
      success: false,
      message: 'Gagal menambahkan menu item.',
    };
  }
}

/**
 * Update an existing menu item
 */
export async function updateKategoriMenuItem(
  id: number,
  payload: UpdateKategoriMenuPayload,
): Promise<MutationResult> {
  try {
    const normalizedKategori = payload.nama_kategori
      ? payload.nama_kategori.trim().toUpperCase()
      : undefined;
    await db
      .update(kategoriMenuTable)
      .set({
        ...(normalizedKategori ? { nama_kategori: normalizedKategori } : {}),
        ...(payload.kode_item ? { kode_item: payload.kode_item.trim().toUpperCase() } : {}),
        ...(payload.label_item ? { label_item: payload.label_item.trim() } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
        // Tugas AG Katering hanya berlaku untuk Bentuk Makanan; kategori lain dipaksa false.
        ...(normalizedKategori
          ? {
              is_tugas_ag_katering:
                normalizedKategori === 'BENTUK_MAKANAN'
                  ? (payload.is_tugas_ag_katering ?? false)
                  : false,
            }
          : payload.is_tugas_ag_katering !== undefined
            ? { is_tugas_ag_katering: payload.is_tugas_ag_katering }
            : {}),
      })
      .where(eq(kategoriMenuTable.id, id));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
    revalidatePath('/dashboard/ag-katering/mapping-diet');
    return {
      success: true,
      message: 'Menu item berhasil diperbarui.',
    };
  } catch (error) {
    console.error('Error updating kategori_menu item:', error);
    return {
      success: false,
      message: 'Gagal memperbarui menu item.',
    };
  }
}

/**
 * Toggle active status of a menu item
 */
export async function toggleKategoriMenuItemStatus(
  id: number,
  currentStatus: boolean,
): Promise<MutationResult> {
  return updateKategoriMenuItem(id, { is_active: !currentStatus });
}

/**
 * Delete menu item from database
 */
export async function deleteKategoriMenuItem(id: number): Promise<MutationResult> {
  try {
    await db.delete(kategoriMenuTable).where(eq(kategoriMenuTable.id, id));
    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
    return {
      success: true,
      message: `Menu item #${id} berhasil dihapus.`,
    };
  } catch (error) {
    console.error('Error deleting kategori_menu item:', error);
    return {
      success: false,
      message: 'Gagal menghapus menu item.',
    };
  }
}

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
  urutan: number;
  is_active: boolean;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

export type CreateKategoriMenuPayload = {
  nama_kategori: string;
  kode_item: string;
  label_item: string;
  urutan?: number;
  is_active?: boolean;
};

export type UpdateKategoriMenuPayload = Partial<CreateKategoriMenuPayload>;

/**
 * Fetch all kategori menu items ordered by nama_kategori & urutan ascending
 */
export async function getKategoriMenuAll(): Promise<KategoriMenuItem[]> {
  try {
    const dbResults = await db
      .select()
      .from(kategoriMenuTable)
      .orderBy(asc(kategoriMenuTable.nama_kategori), asc(kategoriMenuTable.urutan));

    if (dbResults && dbResults.length > 0) {
      return dbResults.map((item) => ({
        id: item.id,
        nama_kategori: item.nama_kategori,
        kode_item: item.kode_item,
        label_item: item.label_item,
        urutan: item.urutan,
        is_active: item.is_active,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching kategori_menu from database:', error);
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
    await db.insert(kategoriMenuTable).values({
      nama_kategori: payload.nama_kategori.trim().toUpperCase(),
      kode_item: payload.kode_item.trim().toUpperCase(),
      label_item: payload.label_item.trim(),
      urutan: payload.urutan ?? 0,
      is_active: payload.is_active ?? true,
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
    await db
      .update(kategoriMenuTable)
      .set({
        ...(payload.nama_kategori ? { nama_kategori: payload.nama_kategori.trim().toUpperCase() } : {}),
        ...(payload.kode_item ? { kode_item: payload.kode_item.trim().toUpperCase() } : {}),
        ...(payload.label_item ? { label_item: payload.label_item.trim() } : {}),
        ...(payload.urutan !== undefined ? { urutan: payload.urutan } : {}),
        ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
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

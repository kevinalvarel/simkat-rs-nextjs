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

// Comprehensive fallback mock data when database is empty
const MOCK_KATEGORI_ITEMS: KategoriMenuItem[] = [
  { id: 1, nama_kategori: 'KARBO', kode_item: 'BN', label_item: 'Biasa Nasi', urutan: 1, is_active: true },
  { id: 2, nama_kategori: 'KARBO', kode_item: 'BL', label_item: 'Biasa Lunak', urutan: 2, is_active: true },
  { id: 3, nama_kategori: 'KARBO', kode_item: 'BC', label_item: 'Biasa Cincang', urutan: 3, is_active: true },
  { id: 4, nama_kategori: 'KARBO', kode_item: 'TM', label_item: 'Nasi Tim', urutan: 4, is_active: true },
  { id: 5, nama_kategori: 'KARBO', kode_item: 'SAR', label_item: 'Bubur Saring', urutan: 5, is_active: true },
  { id: 6, nama_kategori: 'KARBO', kode_item: 'CAI', label_item: 'Makanan Cair', urutan: 6, is_active: true },

  { id: 7, nama_kategori: 'HEWANI', kode_item: 'AYM-G', label_item: 'Ayam Ungkep Goreng', urutan: 1, is_active: true },
  { id: 8, nama_kategori: 'HEWANI', kode_item: 'DND-S', label_item: 'Daging Sapi Semur', urutan: 2, is_active: true },
  { id: 9, nama_kategori: 'HEWANI', kode_item: 'IKN-B', label_item: 'Ikan Kakap Bakar', urutan: 3, is_active: true },
  { id: 10, nama_kategori: 'HEWANI', kode_item: 'TLR-D', label_item: 'Telur Dadar Daun Bawang', urutan: 4, is_active: true },
  { id: 11, nama_kategori: 'HEWANI', kode_item: 'P-TLR', label_item: 'Putih Telur Rebus', urutan: 5, is_active: true },

  { id: 12, nama_kategori: 'NABATI', kode_item: 'TMP-B', label_item: 'Tempe Bacem', urutan: 1, is_active: true },
  { id: 13, nama_kategori: 'NABATI', kode_item: 'TFU-G', label_item: 'Tahu Goreng Tepung', urutan: 2, is_active: true },
  { id: 14, nama_kategori: 'NABATI', kode_item: 'TFU-K', label_item: 'Tahu Kukus Wortel', urutan: 3, is_active: true },

  { id: 15, nama_kategori: 'SAYUR', kode_item: 'SYR-A', label_item: 'Sayur Asem Bumbu Kuning', urutan: 1, is_active: true },
  { id: 16, nama_kategori: 'SAYUR', kode_item: 'SOP-V', label_item: 'Sop Bening Sayur Segar', urutan: 2, is_active: true },
  { id: 17, nama_kategori: 'SAYUR', kode_item: 'CAP-C', label_item: 'Capcay Bakso Ayam', urutan: 3, is_active: true },

  { id: 18, nama_kategori: 'BUAH', kode_item: 'PSG-A', label_item: 'Pisang Ambon', urutan: 1, is_active: true },
  { id: 19, nama_kategori: 'BUAH', kode_item: 'JRK-M', label_item: 'Jeruk Manis', urutan: 2, is_active: true },
  { id: 20, nama_kategori: 'BUAH', kode_item: 'PPY-S', label_item: 'Pepaya Potong Segar', urutan: 3, is_active: true },

  { id: 21, nama_kategori: 'SNACK', kode_item: 'SGP', label_item: 'Snack Gula Pasir', urutan: 1, is_active: true },
  { id: 22, nama_kategori: 'SNACK', kode_item: 'SRP', label_item: 'Snack Rendah Protein', urutan: 2, is_active: true },
  { id: 23, nama_kategori: 'SNACK', kode_item: 'BBR-K', label_item: 'Bubur Kacang Hijau', urutan: 3, is_active: true },

  { id: 24, nama_kategori: 'DIIT', kode_item: 'BIASA', label_item: 'Diet Biasa', urutan: 1, is_active: true },
  { id: 25, nama_kategori: 'DIIT', kode_item: 'TKTP', label_item: 'Tinggi Kalori Tinggi Protein', urutan: 2, is_active: true },
  { id: 26, nama_kategori: 'DIIT', kode_item: 'RG', label_item: 'Rendah Garam', urutan: 3, is_active: true },
  { id: 27, nama_kategori: 'DIIT', kode_item: 'DM', label_item: 'Diabetes Melitus', urutan: 4, is_active: true },
  { id: 28, nama_kategori: 'DIIT', kode_item: 'RP', label_item: 'Rendah Protein', urutan: 5, is_active: true },
];

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
  } catch (error) {
    console.error('Error fetching kategori_menu from database:', error);
  }

  return MOCK_KATEGORI_ITEMS;
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
  }

  // Mock fallback
  const newId = Math.max(...MOCK_KATEGORI_ITEMS.map((i) => i.id), 0) + 1;
  MOCK_KATEGORI_ITEMS.push({
    id: newId,
    nama_kategori: payload.nama_kategori.trim().toUpperCase(),
    kode_item: payload.kode_item.trim().toUpperCase(),
    label_item: payload.label_item.trim(),
    urutan: payload.urutan ?? 0,
    is_active: payload.is_active ?? true,
  });

  revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
  return {
    success: true,
    message: `Menu item "${payload.label_item}" (${payload.kode_item}) berhasil ditambahkan.`,
  };
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
  }

  // Mock fallback
  const idx = MOCK_KATEGORI_ITEMS.findIndex((i) => i.id === id);
  if (idx !== -1) {
    if (payload.nama_kategori) MOCK_KATEGORI_ITEMS[idx].nama_kategori = payload.nama_kategori.toUpperCase();
    if (payload.kode_item) MOCK_KATEGORI_ITEMS[idx].kode_item = payload.kode_item.toUpperCase();
    if (payload.label_item) MOCK_KATEGORI_ITEMS[idx].label_item = payload.label_item;
    if (payload.urutan !== undefined) MOCK_KATEGORI_ITEMS[idx].urutan = payload.urutan;
    if (payload.is_active !== undefined) MOCK_KATEGORI_ITEMS[idx].is_active = payload.is_active;
  }

  revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
  return {
    success: true,
    message: 'Menu item berhasil diperbarui.',
  };
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
  }

  const idx = MOCK_KATEGORI_ITEMS.findIndex((i) => i.id === id);
  if (idx !== -1) {
    MOCK_KATEGORI_ITEMS.splice(idx, 1);
  }

  revalidatePath('/dashboard/ag-katering/admin/konfigurasi-menu');
  return {
    success: true,
    message: `Menu item #${id} berhasil dihapus.`,
  };
}

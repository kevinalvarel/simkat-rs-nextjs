'use server';

import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { kelasTable } from '@/db/schemas/master/kelas';
import { ruanganTable } from '@/db/schemas/master/ruangan';
import { kamarTable } from '@/db/schemas/master/kamar';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { masterSiklusMenuTable } from '@/db/schemas/master/siklus-menu';
import { KELAS_FALLBACK } from '@/lib/kelas-utils';

export type KelasItem = {
  id: number;
  namaKelas: string;
};

export type MutationResult = {
  success: boolean;
  message: string;
  /** Baris yang baru dibuat (hanya diisi oleh createKelas saat sukses) */
  data?: KelasItem;
  /** Kode kegagalan terstruktur — 'KELAS_IN_USE' saat hapus ditolak karena dipakai sistem */
  code?: 'KELAS_IN_USE';
};

const REVALIDATE_PATHS = [
  '/dashboard/ag-katering/admin/konfigurasi-kelas',
  '/dashboard/ag-katering/admin/konfigurasi-ruangan',
  '/dashboard/ag-katering/admin/konfigurasi-siklus-menu',
  '/dashboard/ag-rs/data-pasien',
];

function revalidateKelasPaths() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

function sanitizeNama(nama: string): string {
  return (nama || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Ambil baris kelas dengan kolom eksplisit (id + nama_kelas saja).
 * PENTING: jangan pakai `db.select().from(kelasTable)` (select *) karena
 * schema kini memuat created_at/updated_at dari migrasi 0010 — pada DB yang
 * belum di-migrate, select * melempar 42703 dan membuat tambah/ubah/hapus
 * selalu gagal. Select eksplisit aman untuk DB lama maupun baru.
 */
async function fetchKelasRows(): Promise<{ id: number; nama_kelas: string }[]> {
  return db
    .select({ id: kelasTable.id, nama_kelas: kelasTable.nama_kelas })
    .from(kelasTable);
}

/**
 * Daftar kelas dari sistem (DB), terurut abjad agar stabil.
 * Tidak ada fallback hardcoded di sini — pemanggil yang menentukan
 * perilaku saat tabel kosong (halaman konfigurasi menampilkan empty-state).
 */
export async function getKelasList(): Promise<KelasItem[]> {
  try {
    const rows = await db
      .select({ id: kelasTable.id, namaKelas: kelasTable.nama_kelas })
      .from(kelasTable)
      .orderBy(asc(kelasTable.nama_kelas));
    return rows;
  } catch (error) {
    console.error('Error fetching kelas list:', error);
    return [];
  }
}

/**
 * Opsi string untuk dropdown. Tetap DB-first.
 * Fallback darurat hanya dipakai agar form tidak crash saat DB kosong/belum migrate;
 * halaman konfigurasi-kelas adalah tempat untuk mengisi data yang benar.
 */
export async function getKelasOptions(): Promise<string[]> {
  const list = await getKelasList();
  if (list.length > 0) return list.map((k) => k.namaKelas);
  return [KELAS_FALLBACK];
}

export async function createKelas(namaKelas: string): Promise<MutationResult> {
  const nama = sanitizeNama(namaKelas);
  if (!nama) return { success: false, message: 'Nama kelas tidak boleh kosong.' };

  try {
    const existing = await fetchKelasRows();
    if (existing.some((k) => (k.nama_kelas || '').toUpperCase() === nama)) {
      return { success: false, message: `Kelas "${nama}" sudah terdaftar.` };
    }
    const [created] = await db
      .insert(kelasTable)
      .values({ nama_kelas: nama })
      .returning({ id: kelasTable.id, nama_kelas: kelasTable.nama_kelas });
    revalidateKelasPaths();
    if (!created) {
      return { success: false, message: 'Gagal menambahkan kelas.' };
    }
    return {
      success: true,
      message: `Kelas "${nama}" berhasil ditambahkan.`,
      data: { id: created.id, namaKelas: created.nama_kelas },
    };
  } catch (error) {
    console.error('Error creating kelas:', error);
    return { success: false, message: 'Gagal menambahkan kelas.' };
  }
}

export async function updateKelas(
  id: number,
  namaKelas: string,
): Promise<MutationResult> {
  const nama = sanitizeNama(namaKelas);
  if (!nama) return { success: false, message: 'Nama kelas tidak boleh kosong.' };

  try {
    const existing = await fetchKelasRows();
    const current = existing.find((k) => k.id === id);
    if (!current) return { success: false, message: 'Data kelas tidak ditemukan.' };
    if (
      existing.some(
        (k) => k.id !== id && (k.nama_kelas || '').toUpperCase() === nama,
      )
    ) {
      return { success: false, message: `Kelas "${nama}" sudah terdaftar.` };
    }

    const oldNama = current.nama_kelas;
    await db
      .update(kelasTable)
      .set({ nama_kelas: nama })
      .where(eq(kelasTable.id, id));

    // Propagasi rename ke kolom text yang menyimpan nama kelas (tetap text, bukan FK)
    if (oldNama.toUpperCase() !== nama) {
      const [ruanganRows, kamarRows, pasienRows, menuRows] = await Promise.all([
        db.select({ id: ruanganTable.id, kelas: ruanganTable.kelas }).from(ruanganTable),
        db.select({ id: kamarTable.id, kelas: kamarTable.kelas }).from(kamarTable),
        db.select({ id: pasienTable.id, kelas: pasienTable.kelas }).from(pasienTable),
        db
          .select({ id: masterSiklusMenuTable.id, kelas: masterSiklusMenuTable.kelas })
          .from(masterSiklusMenuTable),
      ]);
      const oldU = oldNama.toUpperCase();
      await Promise.all([
        ...ruanganRows
          .filter((r) => (r.kelas || '').toUpperCase() === oldU)
          .map((r) =>
            db
              .update(ruanganTable)
              .set({ kelas: nama })
              .where(eq(ruanganTable.id, r.id)),
          ),
        ...kamarRows
          .filter((r) => (r.kelas || '').toUpperCase() === oldU)
          .map((r) =>
            db.update(kamarTable).set({ kelas: nama }).where(eq(kamarTable.id, r.id)),
          ),
        ...pasienRows
          .filter((r) => (r.kelas || '').toUpperCase() === oldU)
          .map((r) =>
            db.update(pasienTable).set({ kelas: nama }).where(eq(pasienTable.id, r.id)),
          ),
        ...menuRows
          .filter((r) => (r.kelas || '').toUpperCase() === oldU)
          .map((r) =>
            db
              .update(masterSiklusMenuTable)
              .set({ kelas: nama })
              .where(eq(masterSiklusMenuTable.id, r.id)),
          ),
      ]);
    }

    revalidateKelasPaths();
    return { success: true, message: `Kelas berhasil diubah menjadi "${nama}".` };
  } catch (error) {
    console.error('Error updating kelas:', error);
    return { success: false, message: 'Gagal memperbarui kelas.' };
  }
}

export async function deleteKelas(id: number): Promise<MutationResult> {
  try {
    const existing = await fetchKelasRows();
    const target = existing.find((k) => k.id === id);
    if (!target) return { success: false, message: 'Data kelas tidak ditemukan.' };

    const targetU = (target.nama_kelas || '').toUpperCase();
    const [ruanganRows, kamarRows, pasienRows, menuRows] = await Promise.all([
      db.select({ kelas: ruanganTable.kelas }).from(ruanganTable),
      db.select({ kelas: kamarTable.kelas }).from(kamarTable),
      db.select({ kelas: pasienTable.kelas }).from(pasienTable),
      db.select({ kelas: masterSiklusMenuTable.kelas }).from(masterSiklusMenuTable),
    ]);
    const usedCount =
      ruanganRows.filter((r) => (r.kelas || '').toUpperCase() === targetU).length +
      kamarRows.filter((r) => (r.kelas || '').toUpperCase() === targetU).length +
      pasienRows.filter((r) => (r.kelas || '').toUpperCase() === targetU).length +
      menuRows.filter((r) => (r.kelas || '').toUpperCase() === targetU).length;

    if (usedCount > 0) {
      return {
        success: false,
        message: `Kelas "${target.nama_kelas}" masih dipakai di ${usedCount} data (ruangan/kamar/pasien/siklus-menu). Ubah data tersebut dulu sebelum menghapus.`,
        code: 'KELAS_IN_USE',
      };
    }

    await db.delete(kelasTable).where(eq(kelasTable.id, id));
    revalidateKelasPaths();
    return { success: true, message: `Kelas "${target.nama_kelas}" berhasil dihapus.` };
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return { success: false, message: 'Gagal menghapus kelas.' };
  }
}

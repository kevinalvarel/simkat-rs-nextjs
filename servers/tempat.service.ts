'use server';

import { eq, desc, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { gedungTable } from '@/db/schemas/master/gedung';
import { ruanganTable } from '@/db/schemas/master/ruangan';
import { kelasTable } from '@/db/schemas/master/kelas';

export type RuanganDetail = {
  idRuangan: number;
  namaRuangan: string;
  kelas: string;
  jumlahBed: number;
  gedungId: number;
};

export type GedungHierarkis = {
  idGedung: number;
  namaGedung: string;
  totalRuangan: number;
  totalBed: number;
  ruanganList: RuanganDetail[];
};

export type RuanganItem = {
  idRuangan: number;
  namaRuangan: string;
};

export type GedungWithRuangan = {
  idGedung: number;
  namaGedung: string;
  ruanganList: RuanganItem[];
};

export type MutationResult = {
  success: boolean;
  message: string;
};

// Standard fallback default kelas options
const DEFAULT_KELAS_LIST = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'VIP'];

/**
 * Fetch hierarchical Gedung -> Ruangan -> Kelas -> Bed data
 */
export async function getGedungHierarkis(): Promise<GedungHierarkis[]> {
  try {
    const result = await db
      .select({
        idGedung: gedungTable.id,
        namaGedung: gedungTable.nama_gedung,
        idRuangan: ruanganTable.id,
        namaRuangan: ruanganTable.nama_ruangan,
        kelas: ruanganTable.kelas,
        jumlahBed: ruanganTable.jumlah_bed,
      })
      .from(gedungTable)
      .leftJoin(ruanganTable, eq(gedungTable.id, ruanganTable.gedung_id))
      .orderBy(asc(gedungTable.id), asc(ruanganTable.id));

    if (result && result.length > 0) {
      const gedungMap = new Map<number, GedungHierarkis>();

      for (const row of result) {
        if (!gedungMap.has(row.idGedung)) {
          gedungMap.set(row.idGedung, {
            idGedung: row.idGedung,
            namaGedung: row.namaGedung,
            totalRuangan: 0,
            totalBed: 0,
            ruanganList: [],
          });
        }

        const gedungObj = gedungMap.get(row.idGedung)!;

        if (row.idRuangan && row.namaRuangan) {
          const bedCount = row.jumlahBed || 6;
          const kelasVal = row.kelas || 'Kelas 1';

          gedungObj.ruanganList.push({
            idRuangan: row.idRuangan,
            namaRuangan: row.namaRuangan,
            kelas: kelasVal,
            jumlahBed: bedCount,
            gedungId: row.idGedung,
          });
          gedungObj.totalRuangan += 1;
          gedungObj.totalBed += bedCount;
        }
      }

      return Array.from(gedungMap.values());
    }
  } catch (error) {
    console.error('Error fetching gedung hierarchy from DB:', error);
  }

  return [];
}

/**
 * Backward compatible function for patient form selects
 */
export async function getGedungWithRuangan(): Promise<GedungWithRuangan[]> {
  const data = await getGedungHierarkis();
  return data.map((g) => ({
    idGedung: g.idGedung,
    namaGedung: g.namaGedung,
    ruanganList: g.ruanganList.map((r) => ({
      idRuangan: r.idRuangan,
      namaRuangan: r.namaRuangan,
    })),
  }));
}

/**
 * Fetch available Kelas options from DB or fallback
 */
export async function getKelasOptions(): Promise<string[]> {
  try {
    const list = await db
      .select({ namaKelas: kelasTable.nama_kelas })
      .from(kelasTable);

    if (list && list.length > 0) {
      return list.map((k) => k.namaKelas);
    }
  } catch (error) {
    console.error('Error fetching kelas options:', error);
  }

  return DEFAULT_KELAS_LIST;
}

// -----------------------------------------------------------------------------
// GEDUNG MUTATIONS
// -----------------------------------------------------------------------------

export async function createGedung(
  namaGedung: string,
): Promise<MutationResult> {
  if (!namaGedung?.trim()) {
    return { success: false, message: 'Nama gedung tidak boleh kosong.' };
  }

  try {
    await db.insert(gedungTable).values({
      nama_gedung: namaGedung.trim(),
    });

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return {
      success: true,
      message: `Gedung "${namaGedung.trim()}" berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error('Error creating gedung:', error);
    return { success: false, message: 'Gagal menambahkan gedung baru.' };
  }
}

export async function updateGedung(
  idGedung: number,
  namaGedung: string,
): Promise<MutationResult> {
  if (!namaGedung?.trim()) {
    return { success: false, message: 'Nama gedung tidak boleh kosong.' };
  }

  try {
    await db
      .update(gedungTable)
      .set({ nama_gedung: namaGedung.trim() })
      .where(eq(gedungTable.id, idGedung));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return { success: true, message: `Nama gedung berhasil diperbarui.` };
  } catch (error) {
    console.error('Error updating gedung:', error);
    return { success: false, message: 'Gagal memperbarui nama gedung.' };
  }
}

export async function deleteGedung(idGedung: number): Promise<MutationResult> {
  try {
    // First delete associated ruangan
    await db.delete(ruanganTable).where(eq(ruanganTable.gedung_id, idGedung));
    await db.delete(gedungTable).where(eq(gedungTable.id, idGedung));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return {
      success: true,
      message: 'Gedung dan ruangan di dalamnya berhasil dihapus.',
    };
  } catch (error) {
    console.error('Error deleting gedung:', error);
    return { success: false, message: 'Gagal menghapus gedung.' };
  }
}

// -----------------------------------------------------------------------------
// RUANGAN MUTATIONS
// -----------------------------------------------------------------------------

export async function createRuangan(
  gedungId: number,
  namaRuangan: string,
  kelas: string,
  jumlahBed: number,
): Promise<MutationResult> {
  if (!namaRuangan?.trim()) {
    return { success: false, message: 'Nama ruangan tidak boleh kosong.' };
  }

  try {
    await db.insert(ruanganTable).values({
      nama_ruangan: namaRuangan.trim(),
      gedung_id: gedungId,
      kelas: kelas || 'Kelas 1',
      jumlah_bed: jumlahBed > 0 ? jumlahBed : 6,
    });

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return {
      success: true,
      message: `Ruangan "${namaRuangan.trim()}" berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error('Error creating ruangan:', error);
    return { success: false, message: 'Gagal menambahkan ruangan.' };
  }
}

export async function updateRuangan(
  idRuangan: number,
  namaRuangan: string,
  kelas: string,
  jumlahBed: number,
): Promise<MutationResult> {
  if (!namaRuangan?.trim()) {
    return { success: false, message: 'Nama ruangan tidak boleh kosong.' };
  }

  try {
    await db
      .update(ruanganTable)
      .set({
        nama_ruangan: namaRuangan.trim(),
        kelas: kelas || 'Kelas 1',
        jumlah_bed: jumlahBed > 0 ? jumlahBed : 6,
      })
      .where(eq(ruanganTable.id, idRuangan));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return { success: true, message: `Data ruangan berhasil diperbarui.` };
  } catch (error) {
    console.error('Error updating ruangan:', error);
    return { success: false, message: 'Gagal memperbarui ruangan.' };
  }
}

export async function deleteRuangan(
  idRuangan: number,
): Promise<MutationResult> {
  try {
    await db.delete(ruanganTable).where(eq(ruanganTable.id, idRuangan));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return { success: true, message: 'Ruangan berhasil dihapus.' };
  } catch (error) {
    console.error('Error deleting ruangan:', error);
    return { success: false, message: 'Gagal menghapus ruangan.' };
  }
}

export async function updateBedCount(
  idRuangan: number,
  newJumlahBed: number,
): Promise<MutationResult> {
  if (newJumlahBed < 1) {
    return { success: false, message: 'Jumlah bed minimal 1.' };
  }

  try {
    await db
      .update(ruanganTable)
      .set({ jumlah_bed: newJumlahBed })
      .where(eq(ruanganTable.id, idRuangan));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    return {
      success: true,
      message: `Kapasitas bed diperbarui menjadi ${newJumlahBed}.`,
    };
  } catch (error) {
    console.error('Error updating bed count:', error);
    return { success: false, message: 'Gagal memperbarui jumlah bed.' };
  }
}

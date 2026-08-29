'use server';

import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { gedungTable } from '@/db/schemas/master/gedung';
import { ruanganTable } from '@/db/schemas/master/ruangan';
import { kamarTable } from '@/db/schemas/master/kamar';
import { kelasTable } from '@/db/schemas/master/kelas';

export type KamarDetail = {
  idKamar: string;
  nomorKamar: string; // cth: 'Kamar 101', 'Pintu 01', '101'
  jumlahBed: number;
  kelas?: string;
};

export type RuanganDetail = {
  idRuangan: number;
  namaRuangan: string;
  kelas: string;
  jumlahBed: number;
  gedungId: number;
  kamarList: KamarDetail[];
};

export type GedungHierarkis = {
  idGedung: number;
  namaGedung: string;
  totalRuangan: number;
  totalKamar: number;
  totalBed: number;
  ruanganList: RuanganDetail[];
};

export type RuanganItem = {
  idRuangan: number;
  namaRuangan: string;
  jumlahBed?: number;
  kelas?: string;
  kamarList?: KamarDetail[];
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
 * Helper to normalize raw JSON kamar list or produce safe fallback
 */
export async function normalizeKamarList(
  detailKamarRaw: unknown,
  fallbackBedCount: number,
  fallbackKelas: string,
): Promise<KamarDetail[]> {
  if (Array.isArray(detailKamarRaw) && detailKamarRaw.length > 0) {
    return detailKamarRaw.map((item, idx) => ({
      idKamar: String(item.idKamar || `kamar-${idx + 1}`),
      nomorKamar: String(item.nomorKamar || `Kamar ${idx + 1}`),
      jumlahBed:
        typeof item.jumlahBed === 'number' && item.jumlahBed > 0
          ? item.jumlahBed
          : 1,
      kelas: item.kelas || fallbackKelas,
    }));
  }

  const bedCount = fallbackBedCount > 0 ? fallbackBedCount : 6;
  return [
    {
      idKamar: 'kamar-1',
      nomorKamar: 'Kamar 1',
      jumlahBed: bedCount,
      kelas: fallbackKelas,
    },
  ];
}

/**
 * Fetch hierarchical Gedung -> Ruangan -> Kamar / Nomor Pintu -> Bed data
 * using relational join with kamarTable
 */
export async function getGedungHierarkis(): Promise<GedungHierarkis[]> {
  try {
    const result = await db
      .select({
        idGedung: gedungTable.id,
        namaGedung: gedungTable.nama_gedung,
        idRuangan: ruanganTable.id,
        namaRuangan: ruanganTable.nama_ruangan,
        ruanganKelas: ruanganTable.kelas,
        ruanganJumlahBed: ruanganTable.jumlah_bed,
        idKamar: kamarTable.id,
        nomorKamar: kamarTable.nomor_kamar,
        kamarKelas: kamarTable.kelas,
        kamarJumlahBed: kamarTable.jumlah_bed,
      })
      .from(gedungTable)
      .leftJoin(ruanganTable, eq(gedungTable.id, ruanganTable.gedung_id))
      .leftJoin(kamarTable, eq(ruanganTable.id, kamarTable.ruangan_id))
      .orderBy(asc(gedungTable.id), asc(ruanganTable.id), asc(kamarTable.id));

    if (result && result.length > 0) {
      const gedungMap = new Map<number, GedungHierarkis>();
      const ruanganMap = new Map<number, RuanganDetail>();

      for (const row of result) {
        if (!gedungMap.has(row.idGedung)) {
          gedungMap.set(row.idGedung, {
            idGedung: row.idGedung,
            namaGedung: row.namaGedung,
            totalRuangan: 0,
            totalKamar: 0,
            totalBed: 0,
            ruanganList: [],
          });
        }

        const gedungObj = gedungMap.get(row.idGedung)!;

        if (row.idRuangan && row.namaRuangan) {
          if (!ruanganMap.has(row.idRuangan)) {
            const ruanganObj: RuanganDetail = {
              idRuangan: row.idRuangan,
              namaRuangan: row.namaRuangan,
              kelas: row.ruanganKelas || 'Kelas 1',
              jumlahBed: 0,
              gedungId: row.idGedung,
              kamarList: [],
            };
            ruanganMap.set(row.idRuangan, ruanganObj);
            gedungObj.ruanganList.push(ruanganObj);
            gedungObj.totalRuangan += 1;
          }

          const ruanganObj = ruanganMap.get(row.idRuangan)!;

          if (row.idKamar && row.nomorKamar) {
            const bedCount = row.kamarJumlahBed || 2;
            ruanganObj.kamarList.push({
              idKamar: String(row.idKamar),
              nomorKamar: row.nomorKamar,
              jumlahBed: bedCount,
              kelas: row.kamarKelas || ruanganObj.kelas,
            });
            ruanganObj.jumlahBed += bedCount;
            gedungObj.totalKamar += 1;
            gedungObj.totalBed += bedCount;
          }
        }
      }

      // Check if any ruangan has 0 kamars (legacy data), give it a fallback default Kamar 1
      for (const gedung of gedungMap.values()) {
        for (const ruangan of gedung.ruanganList) {
          if (ruangan.kamarList.length === 0) {
            const defaultBed = 6;
            ruangan.kamarList.push({
              idKamar: `kamar-${ruangan.idRuangan}-1`,
              nomorKamar: 'Kamar 1',
              jumlahBed: defaultBed,
              kelas: ruangan.kelas,
            });
            ruangan.jumlahBed = defaultBed;
            gedung.totalKamar += 1;
            gedung.totalBed += defaultBed;
          }
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
      jumlahBed: r.jumlahBed,
      kelas: r.kelas,
      kamarList: r.kamarList,
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
    // Delete all kamars belonging to ruangan in this gedung
    const ruanganInGedung = await db
      .select({ id: ruanganTable.id })
      .from(ruanganTable)
      .where(eq(ruanganTable.gedung_id, idGedung));

    for (const r of ruanganInGedung) {
      await db.delete(kamarTable).where(eq(kamarTable.ruangan_id, r.id));
    }

    await db.delete(ruanganTable).where(eq(ruanganTable.gedung_id, idGedung));
    await db.delete(gedungTable).where(eq(gedungTable.id, idGedung));

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return {
      success: true,
      message: 'Gedung dan seluruh ruangan di dalamnya berhasil dihapus.',
    };
  } catch (error) {
    console.error('Error deleting gedung:', error);
    return { success: false, message: 'Gagal menghapus gedung.' };
  }
}

// -----------------------------------------------------------------------------
// RUANGAN & KAMAR MUTATIONS (Relational Table)
// -----------------------------------------------------------------------------

export async function createRuangan(
  gedungId: number,
  namaRuangan: string,
  kelas: string,
  kamarListOrBedCount?: KamarDetail[] | number,
): Promise<MutationResult> {
  if (!namaRuangan?.trim()) {
    return { success: false, message: 'Nama ruangan tidak boleh kosong.' };
  }

  let finalKamarList: {
    nomorKamar: string;
    jumlahBed: number;
    kelas: string;
  }[];
  let totalBed: number;

  if (Array.isArray(kamarListOrBedCount) && kamarListOrBedCount.length > 0) {
    finalKamarList = kamarListOrBedCount.map((k) => ({
      nomorKamar: k.nomorKamar.trim(),
      jumlahBed: k.jumlahBed > 0 ? k.jumlahBed : 2,
      kelas: k.kelas || kelas || 'Kelas 1',
    }));
    totalBed = finalKamarList.reduce((acc, k) => acc + k.jumlahBed, 0);
  } else {
    const bed =
      typeof kamarListOrBedCount === 'number' && kamarListOrBedCount > 0
        ? kamarListOrBedCount
        : 6;
    finalKamarList = [
      {
        nomorKamar: 'Kamar 1',
        jumlahBed: bed,
        kelas: kelas || 'Kelas 1',
      },
    ];
    totalBed = bed;
  }

  try {
    const [newRuangan] = await db
      .insert(ruanganTable)
      .values({
        nama_ruangan: namaRuangan.trim(),
        gedung_id: gedungId,
        kelas: kelas || 'Kelas 1',
        jumlah_bed: totalBed,
      })
      .returning({ id: ruanganTable.id });

    if (newRuangan && newRuangan.id) {
      await db.insert(kamarTable).values(
        finalKamarList.map((k) => ({
          nomor_kamar: k.nomorKamar,
          ruangan_id: newRuangan.id,
          jumlah_bed: k.jumlahBed,
          kelas: k.kelas,
        })),
      );
    }

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    revalidatePath('/dashboard/ag-rs/data-pasien');
    return {
      success: true,
      message: `Ruangan "${namaRuangan.trim()}" (${finalKamarList.length} kamar/pintu) berhasil ditambahkan.`,
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
  kamarListOrBedCount?: KamarDetail[] | number,
): Promise<MutationResult> {
  if (!namaRuangan?.trim()) {
    return { success: false, message: 'Nama ruangan tidak boleh kosong.' };
  }

  try {
    let totalBed = 6;
    if (Array.isArray(kamarListOrBedCount) && kamarListOrBedCount.length > 0) {
      totalBed = kamarListOrBedCount.reduce(
        (acc, k) => acc + (k.jumlahBed || 0),
        0,
      );
    } else if (typeof kamarListOrBedCount === 'number') {
      totalBed = kamarListOrBedCount;
    }

    await db
      .update(ruanganTable)
      .set({
        nama_ruangan: namaRuangan.trim(),
        kelas: kelas || 'Kelas 1',
        jumlah_bed: totalBed,
      })
      .where(eq(ruanganTable.id, idRuangan));

    if (Array.isArray(kamarListOrBedCount) && kamarListOrBedCount.length > 0) {
      await db.delete(kamarTable).where(eq(kamarTable.ruangan_id, idRuangan));
      await db.insert(kamarTable).values(
        kamarListOrBedCount.map((k) => ({
          nomor_kamar: k.nomorKamar.trim(),
          ruangan_id: idRuangan,
          jumlah_bed: k.jumlahBed > 0 ? k.jumlahBed : 2,
          kelas: k.kelas || kelas || 'Kelas 1',
        })),
      );
    }

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
    await db.delete(kamarTable).where(eq(kamarTable.ruangan_id, idRuangan));
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
  kamarList?: KamarDetail[],
): Promise<MutationResult> {
  if (newJumlahBed < 1) {
    return { success: false, message: 'Jumlah bed minimal 1.' };
  }

  try {
    await db
      .update(ruanganTable)
      .set({ jumlah_bed: newJumlahBed })
      .where(eq(ruanganTable.id, idRuangan));

    if (kamarList && kamarList.length > 0) {
      await db.delete(kamarTable).where(eq(kamarTable.ruangan_id, idRuangan));
      await db.insert(kamarTable).values(
        kamarList.map((k) => ({
          nomor_kamar: k.nomorKamar.trim(),
          ruangan_id: idRuangan,
          jumlah_bed: k.jumlahBed > 0 ? k.jumlahBed : 2,
          kelas: k.kelas || 'Kelas 1',
        })),
      );
    }

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

export async function updateRuanganKamarList(
  idRuangan: number,
  kamarList: KamarDetail[],
): Promise<MutationResult> {
  if (!kamarList || kamarList.length === 0) {
    return {
      success: false,
      message: 'Ruangan harus memiliki minimal 1 kamar/pintu.',
    };
  }

  const totalBed = kamarList.reduce((acc, k) => acc + (k.jumlahBed || 0), 0);

  try {
    // 1. Update total bed in ruanganTable
    await db
      .update(ruanganTable)
      .set({
        jumlah_bed: totalBed,
      })
      .where(eq(ruanganTable.id, idRuangan));

    // 2. Re-sync relational kamarTable
    await db.delete(kamarTable).where(eq(kamarTable.ruangan_id, idRuangan));
    await db.insert(kamarTable).values(
      kamarList.map((k) => ({
        nomor_kamar: k.nomorKamar.trim(),
        ruangan_id: idRuangan,
        jumlah_bed: k.jumlahBed > 0 ? k.jumlahBed : 2,
        kelas: k.kelas || 'Kelas 1',
      })),
    );

    revalidatePath('/dashboard/ag-katering/admin/konfigurasi-ruangan');
    return {
      success: true,
      message: `Konfigurasi kamar berhasil disimpan (${totalBed} total bed).`,
    };
  } catch (error) {
    console.error('Error updating kamar list:', error);
    return { success: false, message: 'Gagal memperbarui konfigurasi kamar.' };
  }
}

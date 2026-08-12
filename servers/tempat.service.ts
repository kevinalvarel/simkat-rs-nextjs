'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/drizzle';
import { gedungTable } from '@/db/schemas/master/gedung';
import { ruanganTable } from '@/db/schemas/master/ruangan';

export type RuanganItem = {
  idRuangan: number;
  namaRuangan: string;
};

export type GedungWithRuangan = {
  idGedung: number;
  namaGedung: string;
  ruanganList: RuanganItem[];
};

export async function getGedungWithRuangan(): Promise<GedungWithRuangan[]> {
  try {
    const result = await db
      .select({
        idGedung: gedungTable.id,
        namaGedung: gedungTable.nama_gedung,
        idRuangan: ruanganTable.id,
        namaRuangan: ruanganTable.nama_ruangan,
      })
      .from(gedungTable)
      .leftJoin(ruanganTable, eq(gedungTable.id, ruanganTable.gedung_id));

    if (result && result.length > 0) {
      const gedungMap = new Map<number, GedungWithRuangan>();

      for (const row of result) {
        if (!gedungMap.has(row.idGedung)) {
          gedungMap.set(row.idGedung, {
            idGedung: row.idGedung,
            namaGedung: row.namaGedung,
            ruanganList: [],
          });
        }

        if (row.idRuangan && row.namaRuangan) {
          gedungMap.get(row.idGedung)?.ruanganList.push({
            idRuangan: row.idRuangan,
            namaRuangan: row.namaRuangan,
          });
        }
      }

      return Array.from(gedungMap.values());
    }
  } catch (error) {
    console.error('Error fetching gedung with ruangan from DB:', error);
  }

  return [
    {
      idGedung: 1,
      namaGedung: 'Gedung Baru',
      ruanganList: [
        { idRuangan: 101, namaRuangan: 'Ruang Anggrek (101)' },
        { idRuangan: 102, namaRuangan: 'Ruang Melati (102)' },
        { idRuangan: 103, namaRuangan: 'Ruang Mawar (103)' },
      ],
    },
    {
      idGedung: 2,
      namaGedung: 'Gedung Lama',
      ruanganList: [
        { idRuangan: 201, namaRuangan: 'Ruang Dahlia (201)' },
        { idRuangan: 202, namaRuangan: 'Ruang Tulip (202)' },
        { idRuangan: 203, namaRuangan: 'Ruang Flamboyan (203)' },
      ],
    },
  ];
}

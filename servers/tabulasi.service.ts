'use server';

import { eq, desc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;

export interface TabulationSummary {
  batch: SnapshotBatch | null;
  totalPortions: number;
  mappedPortions: number;
  unmappedPortions: number;
  details: Omit<SnapshotDetail, 'nama_pasien'>[];
  
  // Tabulation breakdowns
  dietBreakdown: {
    bentuk_makanan: string;
    kategori_diet: string;
    count: number;
  }[];
  extraBreakdown: {
    extra: string;
    count: number;
  }[];
  buahBreakdown: {
    buah: string;
    count: number;
  }[];
  snackBreakdown: {
    snack: string;
    count: number;
  }[];
  ruanganBreakdown: {
    ruangan: string;
    gedung: string;
    count: number;
  }[];
}

/**
 * Fetch all locked/completed snapshot batches
 */
export async function getTabulationBatches(): Promise<SnapshotBatch[]> {
  try {
    return await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot));
  } catch (error) {
    console.error('Error fetching tabulation batches:', error);
    return [];
  }
}

/**
 * Compute tabulations and recap summaries for a specific snapshot batch
 */
export async function getTabulationSummary(batchId: number): Promise<TabulationSummary | null> {
  try {
    // 1. Fetch batch info
    const [batch] = await db
      .select()
      .from(snapshotBatchTable)
      .where(eq(snapshotBatchTable.id, batchId));

    if (!batch) return null;

    // 2. Fetch details (excluding patient names for privacy/requirements)
    const rawDetails = await db
      .select({
        id: snapshotDetailTable.id,
        batch_id: snapshotDetailTable.batch_id,
        no_rm: snapshotDetailTable.no_rm,
        gedung: snapshotDetailTable.gedung,
        ruangan: snapshotDetailTable.ruangan,
        no_bed: snapshotDetailTable.no_bed,
        kelas: snapshotDetailTable.kelas,
        diet_rs_raw: snapshotDetailTable.diet_rs_raw,
        bentuk_makanan: snapshotDetailTable.bentuk_makanan,
        kategori_diet: snapshotDetailTable.kategori_diet,
        extra: snapshotDetailTable.extra,
        buah: snapshotDetailTable.buah,
        snack: snapshotDetailTable.snack,
        status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
        is_emergent: snapshotDetailTable.is_emergent,
      })
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, batchId));

    const totalPortions = rawDetails.length;
    let mappedPortions = 0;
    let unmappedPortions = 0;

    // Map stats & counts
    const dietMap = new Map<string, number>();
    const extraMap = new Map<string, number>();
    const buahMap = new Map<string, number>();
    const snackMap = new Map<string, number>();
    const ruanganMap = new Map<string, { gedung: string; count: number }>();

    for (const d of rawDetails) {
      const isMapped = d.bentuk_makanan && d.kategori_diet;
      if (isMapped) {
        mappedPortions++;
      } else {
        unmappedPortions++;
      }

      // 1. Diet Shape & Category breakdown
      const forms = d.bentuk_makanan || 'BELUM DIMAPPING';
      const cat = d.kategori_diet || 'BELUM DIMAPPING';
      const dietKey = `${forms}||${cat}`;
      dietMap.set(dietKey, (dietMap.get(dietKey) ?? 0) + 1);

      // 2. Extras breakdown
      if (d.extra?.trim()) {
        const extras = d.extra.split(',').map(e => e.trim());
        for (const e of extras) {
          if (e) extraMap.set(e, (extraMap.get(e) ?? 0) + 1);
        }
      }

      // 3. Fruits breakdown
      if (d.buah?.trim()) {
        buahMap.set(d.buah.trim(), (buahMap.get(d.buah.trim()) ?? 0) + 1);
      }

      // 4. Snacks breakdown
      if (d.snack?.trim()) {
        snackMap.set(d.snack.trim(), (snackMap.get(d.snack.trim()) ?? 0) + 1);
      }

      // 5. Rooms/Wards breakdown
      const roomKey = d.ruangan.trim();
      if (roomKey) {
        const existing = ruanganMap.get(roomKey);
        ruanganMap.set(roomKey, {
          gedung: d.gedung,
          count: (existing?.count ?? 0) + 1,
        });
      }
    }

    // Build lists
    const dietBreakdown = Array.from(dietMap.entries()).map(([key, count]) => {
      const [bentuk_makanan, kategori_diet] = key.split('||');
      return { bentuk_makanan, kategori_diet, count };
    }).sort((a, b) => b.count - a.count);

    const extraBreakdown = Array.from(extraMap.entries()).map(([extra, count]) => ({
      extra,
      count,
    })).sort((a, b) => b.count - a.count);

    const buahBreakdown = Array.from(buahMap.entries()).map(([buah, count]) => ({
      buah,
      count,
    })).sort((a, b) => b.count - a.count);

    const snackBreakdown = Array.from(snackMap.entries()).map(([snack, count]) => ({
      snack,
      count,
    })).sort((a, b) => b.count - a.count);

    const ruanganBreakdown = Array.from(ruanganMap.entries()).map(([ruangan, val]) => ({
      ruangan,
      gedung: val.gedung,
      count: val.count,
    })).sort((a, b) => b.count - a.count);

    return {
      batch,
      totalPortions,
      mappedPortions,
      unmappedPortions,
      details: rawDetails,
      dietBreakdown,
      extraBreakdown,
      buahBreakdown,
      snackBreakdown,
      ruanganBreakdown,
    };
  } catch (error) {
    console.error('Error computing tabulation summary:', error);
    return null;
  }
}

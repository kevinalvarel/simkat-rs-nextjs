'use server';

import { eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import type { RevisiPostSnapshotItem } from '@/servers/revisi-snapshot.service';

export interface MonitoringCardData {
  code: string; // e.g. BM, BSS, CAIR, NPO, DM, RG, TIM, TKTP
  name: string; // Display name
  baseline: number; // Count before revision
  active: number; // Current count (baseline + change)
  change: number; // Net change (+1, -1, 0, etc.)
}

export interface MonitoringSummary {
  success: boolean;
  batchId: number | null;
  batchCode: string;
  waktuMakan: string;
  tanggalProduksi: string;
  statusBatch: string;
  cards: MonitoringCardData[];
  lastUpdated: string;
}

// Map database fields to the 8 standard categories
function classifyDiet(
  bentuk: string | null | undefined,
  kategori: string | null | undefined,
  isNpo: boolean = false,
  rawDiet: string = ''
): string {
  const raw = rawDiet.toLowerCase();
  
  if (isNpo || raw.includes('npo') || raw.includes('puasa')) {
    return 'NPO';
  }
  
  const b = bentuk?.toUpperCase() || '';
  const k = kategori?.toUpperCase() || '';

  if (k === 'DM' || raw.includes('dm') || raw.includes('diabetes')) {
    return 'DM';
  }
  if (k === 'RG' || raw.includes('rg') || raw.includes('rendah garam')) {
    return 'RG';
  }
  if (k === 'TKTP' || raw.includes('tktp') || raw.includes('tinggi kalori')) {
    return 'TKTP';
  }
  if (b === 'SAR' || raw.includes('saring') || raw.includes('bubur')) {
    return 'BSS';
  }
  if (b === 'CAI' || raw.includes('cair')) {
    return 'CAIR';
  }
  if (b === 'TM' || raw.includes('tim')) {
    return 'TIM';
  }
  
  // Default to BM (Biasa Makanan / Nasi)
  return 'BM';
}

const MOCK_MONITORING: MonitoringCardData[] = [
  { code: 'BM', name: 'Biasa Nasi / Makanan', baseline: 128, active: 127, change: -1 },
  { code: 'BSS', name: 'Biasa Saring / Bubur', baseline: 43, active: 43, change: 0 },
  { code: 'CAIR', name: 'Nutrisi Cair', baseline: 20, active: 21, change: 1 },
  { code: 'NPO', name: 'Puasa / NPO', baseline: 8, active: 9, change: 1 },
  { code: 'DM', name: 'Diet Diabetes', baseline: 31, active: 31, change: 0 },
  { code: 'RG', name: 'Diet Rendah Garam', baseline: 14, active: 14, change: 0 },
  { code: 'TIM', name: 'Nasi Tim', baseline: 7, active: 7, change: 0 },
  { code: 'TKTP', name: 'Diet TKTP', baseline: 5, active: 5, change: 0 },
];

/**
 * Fetch live overview monitoring data
 */
export async function getLiveMonitoringData(): Promise<MonitoringSummary> {
  try {
    // 1. Fetch latest snapshot batch
    const [latestBatch] = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
      .limit(1);

    if (!latestBatch) {
      return {
        success: true,
        batchId: null,
        batchCode: 'MOCK-BATCH-LATEST',
        waktuMakan: 'PAGI',
        tanggalProduksi: new Date().toISOString().slice(0, 10),
        statusBatch: 'LOCKED',
        cards: MOCK_MONITORING,
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
      };
    }

    // 2. Fetch all baseline details in the snapshot batch
    const details = await db
      .select({
        id: snapshotDetailTable.id,
        bentuk_makanan: snapshotDetailTable.bentuk_makanan,
        kategori_diet: snapshotDetailTable.kategori_diet,
        diet_rs_raw: snapshotDetailTable.diet_rs_raw,
        status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
      })
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, latestBatch.id));

    // Initialize counts
    const categories = ['BM', 'BSS', 'CAIR', 'NPO', 'DM', 'RG', 'TIM', 'TKTP'];
    const baselines: Record<string, number> = {};
    const deltas: Record<string, number> = {};
    
    for (const cat of categories) {
      baselines[cat] = 0;
      deltas[cat] = 0;
    }

    // Populate baselines
    for (const d of details) {
      const isNpo = d.status_saat_snapshot === 'NPO';
      const cat = classifyDiet(d.bentuk_makanan, d.kategori_diet, isNpo, d.diet_rs_raw);
      if (baselines[cat] !== undefined) {
        baselines[cat]++;
      }
    }

    // 3. Fetch approved/completed revisions for this batch
    const revisions = await db
      .select({
        id: otorisasiPerubahanDietTable.id,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
        data_lama: otorisasiPerubahanDietTable.data_lama,
        data_baru: otorisasiPerubahanDietTable.data_baru,
        status: otorisasiPerubahanDietTable.status,
      })
      .from(otorisasiPerubahanDietTable)
      .where(
        and(
          eq(otorisasiPerubahanDietTable.batch_id, latestBatch.id),
          inArray(otorisasiPerubahanDietTable.status, ['APPROVED', 'SELESAI'])
        )
      );

    // Apply revision deltas
    for (const rev of revisions) {
      const type = rev.jenis_perubahan;

      let oldDiet: any = null;
      let newDiet: any = null;

      try {
        if (rev.data_lama) oldDiet = JSON.parse(rev.data_lama);
      } catch (_) {}

      try {
        if (rev.data_baru) newDiet = JSON.parse(rev.data_baru);
      } catch (_) {}

      if (type === 'NEW_PATIENT' && newDiet) {
        // Adds +1 to new diet
        const cat = classifyDiet(newDiet.bentuk_makanan, newDiet.kategori_diet, newDiet.status_pasien === 'NPO', newDiet.diet);
        if (deltas[cat] !== undefined) deltas[cat]++;
      } else if (type === 'DISCHARGE' && oldDiet) {
        // Subtracts -1 from old diet
        const cat = classifyDiet(oldDiet.bentuk_makanan, oldDiet.kategori_diet, oldDiet.status_pasien === 'NPO', oldDiet.diet);
        if (deltas[cat] !== undefined) deltas[cat]--;
      } else if (type === 'NPO' && oldDiet) {
        // Subtracts -1 from old diet, adds +1 to NPO
        const oldCat = classifyDiet(oldDiet.bentuk_makanan, oldDiet.kategori_diet, false, oldDiet.diet);
        if (deltas[oldCat] !== undefined) deltas[oldCat]--;
        if (deltas['NPO'] !== undefined) deltas['NPO']++;
      } else if (type === 'DIET_CHANGE' && oldDiet && newDiet) {
        // Subtracts -1 from old, adds +1 to new
        const oldCat = classifyDiet(oldDiet.bentuk_makanan, oldDiet.kategori_diet, oldDiet.status_pasien === 'NPO', oldDiet.diet);
        const newCat = classifyDiet(newDiet.bentuk_makanan, newDiet.kategori_diet, newDiet.status_pasien === 'NPO', newDiet.diet);
        if (deltas[oldCat] !== undefined) deltas[oldCat]--;
        if (deltas[newCat] !== undefined) deltas[newCat]++;
      }
    }

    // Format card data
    const nameMap: Record<string, string> = {
      BM: 'Biasa Nasi / Makanan',
      BSS: 'Biasa Saring / Bubur',
      CAIR: 'Nutrisi Cair',
      NPO: 'Puasa / NPO',
      DM: 'Diet Diabetes',
      RG: 'Diet Rendah Garam',
      TIM: 'Nasi Tim',
      TKTP: 'Diet TKTP',
    };

    const cards = categories.map((cat) => {
      const base = baselines[cat] || 0;
      const change = deltas[cat] || 0;
      return {
        code: cat,
        name: nameMap[cat] || cat,
        baseline: base,
        active: Math.max(0, base + change),
        change: change,
      };
    });

    return {
      success: true,
      batchId: latestBatch.id,
      batchCode: latestBatch.batch_code,
      waktuMakan: latestBatch.waktu_makan,
      tanggalProduksi: latestBatch.tanggal_produksi,
      statusBatch: latestBatch.status_batch,
      cards,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error fetching live overview data:', error);
    return {
      success: false,
      batchId: null,
      batchCode: 'ERROR-FETCH',
      waktuMakan: 'NONE',
      tanggalProduksi: '',
      statusBatch: 'LOCKED',
      cards: MOCK_MONITORING.map(c => ({ ...c, active: 0, change: 0, baseline: 0 })),
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

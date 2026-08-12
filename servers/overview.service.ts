'use server';

import { eq, desc, ne, and } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';

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
  cutoffTime: string;
  cards: MonitoringCardData[];
  lastUpdated: string;
}

interface NextCycleInfo {
  waktuMakan: string; // PAGI | SIANG | MALAM
  tanggalProduksi: string; // YYYY-MM-DD
  cutoffTime: string; // HH:mm
}

interface WaktuMakanConfig {
  id: number;
  jenis_makan: string;
  waktu: string;
}

function getNextCycle(configs: WaktuMakanConfig[], date: Date = new Date()): NextCycleInfo {
  const defaultTimes = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const pagiTime = configs.find(c => c.jenis_makan === 'PAGI')?.waktu || defaultTimes.PAGI;
  const siangTime = configs.find(c => c.jenis_makan === 'SIANG')?.waktu || defaultTimes.SIANG;
  const malamTime = configs.find(c => c.jenis_makan === 'MALAM')?.waktu || defaultTimes.MALAM;

  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const pagiMin = getMinutes(pagiTime);
  const siangMin = getMinutes(siangTime);
  const malamMin = getMinutes(malamTime);

  let waktuMakan = 'PAGI';
  let dateOffset = 0;
  let cutoffTime = pagiTime;

  if (currentMinutes < pagiMin) {
    waktuMakan = 'PAGI';
    cutoffTime = pagiTime;
  } else if (currentMinutes < siangMin) {
    waktuMakan = 'SIANG';
    cutoffTime = siangTime;
  } else if (currentMinutes < malamMin) {
    waktuMakan = 'MALAM';
    cutoffTime = malamTime;
  } else {
    waktuMakan = 'PAGI';
    cutoffTime = pagiTime;
    dateOffset = 1; // PAGI of tomorrow
  }

  const targetDate = new Date(date);
  if (dateOffset > 0) {
    targetDate.setDate(targetDate.getDate() + dateOffset);
  }

  return {
    waktuMakan,
    tanggalProduksi: targetDate.toISOString().slice(0, 10),
    cutoffTime: cutoffTime.slice(0, 5),
  };
}

function getNextCycleAfter(current: NextCycleInfo, configs: WaktuMakanConfig[]): NextCycleInfo {
  const defaultTimes: Record<string, string> = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const order = ['PAGI', 'SIANG', 'MALAM'];
  const currentIndex = order.indexOf(current.waktuMakan);
  const nextIndex = (currentIndex + 1) % 3;
  const nextWaktuMakan = order[nextIndex];
  
  const nextDate = new Date(current.tanggalProduksi);
  if (currentIndex === 2) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  const nextCutoff = configs.find(c => c.jenis_makan === nextWaktuMakan)?.waktu || defaultTimes[nextWaktuMakan];

  return {
    waktuMakan: nextWaktuMakan,
    tanggalProduksi: nextDate.toISOString().slice(0, 10),
    cutoffTime: nextCutoff.slice(0, 5),
  };
}

/**
 * Fetch live overview monitoring data
 */
export async function getLiveMonitoringData(): Promise<MonitoringSummary> {
  try {
    // 1. Fetch time configurations
    const timeConfigs = await db.select().from(waktuMakanTable);

    // 2. Find next unlocked cycle
    let nextCycle = getNextCycle(timeConfigs);
    
    // Check up to 4 cycles ahead to find the first unlocked one
    for (let i = 0; i < 4; i++) {
      const [existingBatch] = await db
        .select()
        .from(snapshotBatchTable)
        .where(
          and(
            eq(snapshotBatchTable.tanggal_produksi, nextCycle.tanggalProduksi),
            eq(snapshotBatchTable.waktu_makan, nextCycle.waktuMakan)
          )
        )
        .limit(1);

      if (!existingBatch) {
        break;
      }

      nextCycle = getNextCycleAfter(nextCycle, timeConfigs);
    }

    // 3. Fetch all live active patients
    const activePatients = await db
      .select({
        id: pasienTable.id,
        nama_pasien: pasienTable.nama_pasien,
        diet: pasienTable.diet,
        is_npo: pasienTable.is_npo,
        status_pasien: pasienTable.status_pasien,
      })
      .from(pasienTable)
      .where(ne(pasienTable.status_pasien, 'PULANG'));

    // 4. Count diets dynamically
    const dietCounts: Record<string, { active: number; name: string }> = {};

    for (const p of activePatients) {
      let dietName = p.diet.trim();
      const isNpo = p.is_npo || p.status_pasien === 'NPO' || dietName.toLowerCase() === 'npo' || dietName.toLowerCase() === 'puasa';
      
      if (isNpo) {
        dietName = 'NPO';
      } else if (!dietName) {
        dietName = 'Lain-Lain';
      } else {
        // Standardize casing (capitalize first letter of each word)
        dietName = dietName
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }

      if (!dietCounts[dietName]) {
        dietCounts[dietName] = {
          active: 0,
          name: dietName === 'NPO' ? 'Puasa / NPO' : dietName,
        };
      }
      dietCounts[dietName].active++;
    }

    // 5. Fetch baseline counts from the latest LOCKED snapshot batch (to show real-time changes)
    const [latestBatch] = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
      .limit(1);

    const snapshotDietCounts: Record<string, number> = {};
    if (latestBatch) {
      const snapshotDetails = await db
        .select({
          diet_rs_raw: snapshotDetailTable.diet_rs_raw,
          status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
        })
        .from(snapshotDetailTable)
        .where(eq(snapshotDetailTable.batch_id, latestBatch.id));

      for (const sd of snapshotDetails) {
        let dietName = (sd.diet_rs_raw || '').trim();
        const isNpo = sd.status_saat_snapshot === 'NPO' || dietName.toLowerCase() === 'npo' || dietName.toLowerCase() === 'puasa';
        
        if (isNpo) {
          dietName = 'NPO';
        } else if (!dietName) {
          dietName = 'Lain-Lain';
        } else {
          dietName = dietName
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }

        snapshotDietCounts[dietName] = (snapshotDietCounts[dietName] || 0) + 1;
      }
    }

    // 6. Construct cards (only display diets that are currently active / exist)
    const cards = Object.entries(dietCounts).map(([dietName, info]) => {
      const activeCount = info.active;
      const baselineCount = snapshotDietCounts[dietName] || 0;
      const changeCount = activeCount - baselineCount;

      return {
        code: dietName,
        name: info.name,
        baseline: baselineCount,
        active: activeCount,
        change: changeCount,
      };
    });

    // Sort cards alphabetically by code, with 'NPO' always at the end
    cards.sort((a, b) => {
      if (a.code === 'NPO') return 1;
      if (b.code === 'NPO') return -1;
      return a.code.localeCompare(b.code);
    });

    const dateStr = nextCycle.tanggalProduksi.replace(/-/g, '');
    const previewBatchCode = `BATCH-${dateStr}-${nextCycle.waktuMakan}-PREVIEW`;

    return {
      success: true,
      batchId: null,
      batchCode: previewBatchCode,
      waktuMakan: nextCycle.waktuMakan,
      tanggalProduksi: nextCycle.tanggalProduksi,
      statusBatch: 'LIVE',
      cutoffTime: nextCycle.cutoffTime,
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
      cutoffTime: '00:00',
      cards: [],
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

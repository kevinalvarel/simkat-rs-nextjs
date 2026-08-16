'use server';

import { eq, desc, ne, and } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { kategoriMenuTable } from '@/db/schemas/master/kategori-menu';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';

import type {
  MonitoringCardData,
  MonitoringSummary,
} from '@/types/monitoringtypes';

export type { MonitoringCardData, MonitoringSummary };

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

function getNextCycle(
  configs: WaktuMakanConfig[],
  date: Date = new Date(),
): NextCycleInfo {
  const defaultTimes = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const pagiTime =
    configs.find((c) => c.jenis_makan === 'PAGI')?.waktu || defaultTimes.PAGI;
  const siangTime =
    configs.find((c) => c.jenis_makan === 'SIANG')?.waktu || defaultTimes.SIANG;
  const malamTime =
    configs.find((c) => c.jenis_makan === 'MALAM')?.waktu || defaultTimes.MALAM;

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

function getNextCycleAfter(
  current: NextCycleInfo,
  configs: WaktuMakanConfig[],
): NextCycleInfo {
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

  const nextCutoff =
    configs.find((c) => c.jenis_makan === nextWaktuMakan)?.waktu ||
    defaultTimes[nextWaktuMakan];

  return {
    waktuMakan: nextWaktuMakan,
    tanggalProduksi: nextDate.toISOString().slice(0, 10),
    cutoffTime: nextCutoff.slice(0, 5),
  };
}

/**
 * Helper to split and normalize comma or slash separated items
 */
function extractCodes(val: string | null | undefined): string[] {
  if (!val || !val.trim()) return [];
  return val
    .split(/[,;/]+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        Boolean(s) &&
        s.toUpperCase() !== 'TIDAK' &&
        s.toUpperCase() !== 'NON' &&
        s !== '-'
    );
}

/**
 * Fetch live overview monitoring data decomposed into individual mapping components (BN, TKTP, PUTEL, etc.)
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
            eq(snapshotBatchTable.waktu_makan, nextCycle.waktuMakan),
          ),
        )
        .limit(1);

      if (!existingBatch) {
        break;
      }

      nextCycle = getNextCycleAfter(nextCycle, timeConfigs);
    }

    // 3. Fetch Master Menu Categories for human-readable labels (BN -> Biasa Nasi, etc.)
    const masterMenuItems = await db.select().from(kategoriMenuTable);
    const labelMap = new Map<string, string>();
    for (const item of masterMenuItems) {
      labelMap.set(item.kode_item.toUpperCase(), item.label_item);
    }

    // Common default labels for medical diets
    const defaultLabels: Record<string, string> = {
      BN: 'Biasa Nasi',
      BL: 'Biasa Lunak',
      BC: 'Biasa Cincang',
      TIM: 'Nasi Tim',
      TM: 'Nasi Tim',
      SAR: 'Bubur Saring',
      CAIR: 'Makanan Cair',
      CAI: 'Makanan Cair',
      TKTP: 'Tinggi Kalori Tinggi Protein',
      DM: 'Diabetes Melitus',
      RG: 'Rendah Garam',
      RP: 'Rendah Protein',
      RL: 'Rendah Lemak',
      RPU: 'Rendah Purin',
      DH: 'Diet Hati',
      DJ: 'Diet Jantung',
      DL: 'Diet Lambung',
      BIASA: 'Diet Biasa Standar',
      PUTEL: 'Putih Telur Rebus',
      'P-TLR': 'Putih Telur Rebus',
      'TLR-D': 'Telur Dadar',
      'AYM-G': 'Ayam Ungkep Goreng',
      'DND-S': 'Daging Sapi Semur',
      'IKN-B': 'Ikan Bakar',
      'TMP-B': 'Tempe Bacem',
      'TFU-G': 'Tahu Goreng',
      'PSG-A': 'Pisang Ambon',
      'PPY-S': 'Pepaya Potong',
      'JRK-M': 'Jeruk Manis',
      SGP: 'Snack Gula Pasir',
      SRP: 'Snack Rendah Protein',
      NPO: 'Puasa / NPO',
      UNMAPPED: 'Belum Di-mapping',
    };

    // 4. Fetch Master Diet Mappings
    const masterMappings = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.is_active, true));

    const mappingByRaw = new Map<
      string,
      {
        bentuk_makanan: string | null;
        kategori_diet: string | null;
        extra: string | null;
        buah: string | null;
        snack: string | null;
        status_mapping: string;
      }
    >();

    for (const m of masterMappings) {
      mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), {
        bentuk_makanan: m.bentuk_makanan,
        kategori_diet: m.kategori_diet,
        extra: m.extra,
        buah: m.buah,
        snack: m.snack,
        status_mapping: m.status_mapping,
      });
    }

    // 5. Fetch all live active patients (excluding unapproved pending revisions)
    const pendingRevisions = await db
      .select({
        pasien_id: otorisasiPerubahanDietTable.pasien_id,
        jenis_perubahan: otorisasiPerubahanDietTable.jenis_perubahan,
      })
      .from(otorisasiPerubahanDietTable)
      .where(eq(otorisasiPerubahanDietTable.status, 'PENDING'));

    const pendingNewPatientIds = new Set(
      pendingRevisions
        .filter((r) => r.jenis_perubahan === 'NEW_PATIENT')
        .map((r) => r.pasien_id)
    );

    const allPatients = await db
      .select({
        id: pasienTable.id,
        nama_pasien: pasienTable.nama_pasien,
        diet: pasienTable.diet,
        is_npo: pasienTable.is_npo,
        status_pasien: pasienTable.status_pasien,
      })
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        )
      );

    const activePatients = allPatients.filter(
      (p) => !pendingNewPatientIds.has(p.id)
    );

    // 6. Aggregate Live Counts per atomic mapped code (BN, TKTP, PUTEL, etc.)
    const liveCounts: Record<string, { count: number; name: string }> = {};

    function addLiveCount(code: string, customName?: string) {
      if (!code) return;
      const normalizedCode = code.trim().toUpperCase();
      if (
        !normalizedCode ||
        normalizedCode === 'UNMAPPED' ||
        normalizedCode === 'TIDAK' ||
        normalizedCode === 'NON' ||
        normalizedCode === '-'
      )
        return;

      const displayName =
        customName ||
        labelMap.get(normalizedCode) ||
        defaultLabels[normalizedCode] ||
        normalizedCode;

      if (!liveCounts[normalizedCode]) {
        liveCounts[normalizedCode] = { count: 0, name: displayName };
      }
      liveCounts[normalizedCode].count++;
    }

    for (const p of activePatients) {
      const rawDiet = (p.diet || '').trim();
      const isNpo =
        p.is_npo ||
        p.status_pasien === 'NPO' ||
        rawDiet.toLowerCase() === 'npo' ||
        rawDiet.toLowerCase() === 'puasa';

      if (isNpo) {
        addLiveCount('NPO', 'Puasa / NPO');
        continue;
      }

      // Lookup in master diet mapping
      const mapped = mappingByRaw.get(rawDiet.toLowerCase());

      const hasValidMapping =
        mapped &&
        (mapped.status_mapping === 'MAPPED' ||
          mapped.status_mapping === 'PARTIAL') &&
        (mapped.bentuk_makanan ||
          mapped.kategori_diet ||
          mapped.extra ||
          mapped.buah ||
          mapped.snack);

      if (hasValidMapping) {
        // Increment Bentuk Makanan (e.g. BN)
        if (mapped.bentuk_makanan) {
          extractCodes(mapped.bentuk_makanan).forEach((code) =>
            addLiveCount(code),
          );
        }
        // Increment Kategori Diet (e.g. TKTP)
        if (mapped.kategori_diet) {
          extractCodes(mapped.kategori_diet).forEach((code) =>
            addLiveCount(code),
          );
        }
        // Increment Extra (e.g. PUTEL)
        if (mapped.extra) {
          extractCodes(mapped.extra).forEach((code) => addLiveCount(code));
        }
        // Increment Buah
        if (mapped.buah) {
          extractCodes(mapped.buah).forEach((code) => addLiveCount(code));
        }
        // Increment Snack
        if (mapped.snack) {
          extractCodes(mapped.snack).forEach((code) => addLiveCount(code));
        }
      }
    }

    // 7. Fetch baseline counts from the latest LOCKED snapshot batch
    const [latestBatch] = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
      .limit(1);

    const snapshotCounts: Record<string, number> = {};

    function addSnapshotCount(code: string) {
      if (!code) return;
      const normalizedCode = code.trim().toUpperCase();
      if (
        !normalizedCode ||
        normalizedCode === 'UNMAPPED' ||
        normalizedCode === 'TIDAK' ||
        normalizedCode === 'NON' ||
        normalizedCode === '-'
      )
        return;
      snapshotCounts[normalizedCode] =
        (snapshotCounts[normalizedCode] || 0) + 1;
    }

    if (latestBatch) {
      const snapshotDetails = await db
        .select({
          diet_rs_raw: snapshotDetailTable.diet_rs_raw,
          bentuk_makanan: snapshotDetailTable.bentuk_makanan,
          kategori_diet: snapshotDetailTable.kategori_diet,
          extra: snapshotDetailTable.extra,
          buah: snapshotDetailTable.buah,
          snack: snapshotDetailTable.snack,
          status_saat_snapshot: snapshotDetailTable.status_saat_snapshot,
        })
        .from(snapshotDetailTable)
        .where(eq(snapshotDetailTable.batch_id, latestBatch.id));

      for (const sd of snapshotDetails) {
        const rawDiet = (sd.diet_rs_raw || '').trim();
        const isNpo =
          sd.status_saat_snapshot === 'NPO' ||
          rawDiet.toLowerCase() === 'npo' ||
          rawDiet.toLowerCase() === 'puasa';

        if (isNpo) {
          addSnapshotCount('NPO');
          continue;
        }

        // Check if parsed columns already exist on snapshot record
        const hasParsedColumns =
          sd.bentuk_makanan ||
          sd.kategori_diet ||
          sd.extra ||
          sd.buah ||
          sd.snack;

        if (hasParsedColumns) {
          if (sd.bentuk_makanan)
            extractCodes(sd.bentuk_makanan).forEach(addSnapshotCount);
          if (sd.kategori_diet)
            extractCodes(sd.kategori_diet).forEach(addSnapshotCount);
          if (sd.extra) extractCodes(sd.extra).forEach(addSnapshotCount);
          if (sd.buah) extractCodes(sd.buah).forEach(addSnapshotCount);
          if (sd.snack) extractCodes(sd.snack).forEach(addSnapshotCount);
        } else {
          // Fallback to lookup mapping by raw text
          const mapped = mappingByRaw.get(rawDiet.toLowerCase());
          const hasValidMapping =
            mapped &&
            (mapped.status_mapping === 'MAPPED' ||
              mapped.status_mapping === 'PARTIAL') &&
            (mapped.bentuk_makanan ||
              mapped.kategori_diet ||
              mapped.extra ||
              mapped.buah ||
              mapped.snack);

          if (hasValidMapping) {
            if (mapped.bentuk_makanan)
              extractCodes(mapped.bentuk_makanan).forEach(addSnapshotCount);
            if (mapped.kategori_diet)
              extractCodes(mapped.kategori_diet).forEach(addSnapshotCount);
            if (mapped.extra)
              extractCodes(mapped.extra).forEach(addSnapshotCount);
            if (mapped.buah)
              extractCodes(mapped.buah).forEach(addSnapshotCount);
            if (mapped.snack)
              extractCodes(mapped.snack).forEach(addSnapshotCount);
          }
        }
      }
    }

    // 8. Construct unified list of distinct cards (BN, TKTP, PUTEL, etc.)
    const allCodes = new Set([
      ...Object.keys(liveCounts),
      ...Object.keys(snapshotCounts),
    ]);

    const cards: MonitoringCardData[] = Array.from(allCodes)
      .filter(
        (code) =>
          code &&
          code.trim().toUpperCase() !== 'UNMAPPED' &&
          code.trim().toUpperCase() !== 'TIDAK' &&
          code.trim().toUpperCase() !== 'NON' &&
          code.trim() !== '-'
      )
      .map((code) => {
        const liveInfo = liveCounts[code];
        const activeCount = liveInfo?.count || 0;
        const baselineCount = snapshotCounts[code] || 0;
        const changeCount = activeCount - baselineCount;
        const displayName =
          liveInfo?.name ||
          labelMap.get(code) ||
          defaultLabels[code] ||
          code;

        return {
          code,
          name: displayName,
          baseline: baselineCount,
          active: activeCount,
          change: changeCount,
        };
      })
      .filter(
        (card) =>
          (card.active > 0 || card.baseline > 0) &&
          card.code.toUpperCase() !== 'UNMAPPED' &&
          card.code.toUpperCase() !== 'TIDAK' &&
          card.code.toUpperCase() !== 'NON'
      );

    // Sort cards: Standard codes first, UNMAPPED near end, NPO always at the very end
    cards.sort((a, b) => {
      if (a.code === 'NPO') return 1;
      if (b.code === 'NPO') return -1;
      if (a.code === 'UNMAPPED') return 1;
      if (b.code === 'UNMAPPED') return -1;
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

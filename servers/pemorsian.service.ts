'use server';

import { eq, desc, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';
import { masterSiklusTable } from '@/db/schemas/master/siklus-menu';
import { otorisasiPerubahanDietTable } from '@/db/schemas/snapshot/perizinan-revisi';
import type {
  PemorsianBatchOption,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  PemorsianSummaryData,
  PemorsianDietCount,
} from '@/types/pemorsiantypes';

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

const HARI_INDONESIA = [
  'MINGGU',
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
] as const;

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

/**
 * Format string waktu_makan to TitleCase ("Pagi" | "Siang" | "Malam")
 */
function formatWaktuTitle(waktu: string): string {
  const lower = (waktu || '').toLowerCase();
  if (lower.includes('siang')) return 'Siang';
  if (lower.includes('malam')) return 'Malam';
  return 'Pagi';
}

/**
 * Fetch all available snapshot batches
 */
export async function getAvailablePemorsianBatches(): Promise<
  PemorsianBatchOption[]
> {
  try {
    const batches = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot));

    if (batches && batches.length > 0) {
      return batches.map((b) => ({
        id: b.id,
        batch_code: b.batch_code,
        tanggal_produksi: b.tanggal_produksi,
        waktu_makan: b.waktu_makan,
        total_pasien: b.total_pasien,
        status_batch: b.status_batch,
        cutoff_time: b.cutoff_time,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching available snapshot batches:', error);
    return [];
  }
}

/**
 * Main live monitoring data resolver for Live Pemorsian.
 * Directly integrates with raw text input from AG RS (pasienTable)
 * and detects post-snapshot revisions automatically.
 */
export async function getLivePemorsianData(
  batchId?: number,
  filterDate?: string,
  filterWaktuMakan?: string,
): Promise<PemorsianSummaryData> {
  try {
    // 1. Fetch time configs & resolve current cycle
    const timeConfigs = await db.select().from(waktuMakanTable);
    const nextCycle = getNextCycle(timeConfigs);

    // 2. Fetch available snapshot batches from DB
    const availableBatches = await getAvailablePemorsianBatches();

    // 3. Resolve Target Batch:
    // If batchId is provided, use that batch.
    // If filterDate and filterWaktuMakan are provided, find matching batch.
    // Otherwise, check if current cycle (tanggalProduksi + waktuMakan) has a locked batch.
    let selectedBatch: PemorsianBatchOption | null = null;

    if (batchId) {
      selectedBatch = availableBatches.find((b) => b.id === batchId) || null;
    } else if (filterDate && filterWaktuMakan) {
      selectedBatch =
        availableBatches.find(
          (b) =>
            b.tanggal_produksi === filterDate &&
            b.waktu_makan.toUpperCase() === filterWaktuMakan.toUpperCase(),
        ) || null;
    } else {
      const activeBatchForCycle = availableBatches.find(
        (b) =>
          b.tanggal_produksi === nextCycle.tanggalProduksi &&
          b.waktu_makan.toUpperCase() === nextCycle.waktuMakan.toUpperCase(),
      );

      if (activeBatchForCycle) {
        selectedBatch = activeBatchForCycle;
      }
    }

    // 4. Resolve Active Master Siklus for the target date
    const targetDateStr =
      selectedBatch?.tanggal_produksi || filterDate || nextCycle.tanggalProduksi;
    const targetWaktuMakan =
      selectedBatch?.waktu_makan || filterWaktuMakan || nextCycle.waktuMakan;
    const targetDateObj = new Date(targetDateStr);
    const dayIndex = isNaN(targetDateObj.getDay()) ? 1 : targetDateObj.getDay();
    const currentHari = HARI_INDONESIA[dayIndex] || 'SENIN';

    const tanggalFormatted = !isNaN(targetDateObj.getTime())
      ? targetDateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : targetDateStr;

    const allMasterCycles = await db
      .select()
      .from(masterSiklusTable)
      .where(eq(masterSiklusTable.is_active, true))
      .orderBy(asc(masterSiklusTable.nomor_siklus));

    const targetDateIso = targetDateObj.toISOString().split('T')[0];
    let resolvedCycle = allMasterCycles.find(
      (c) => c.tanggal && (c.tanggal === targetDateIso || c.tanggal === targetDateStr),
    );

    if (!resolvedCycle) {
      resolvedCycle = allMasterCycles.find(
        (c) => c.hari?.trim().toUpperCase() === currentHari,
      );
    }

    if (!resolvedCycle && allMasterCycles.length > 0) {
      const dayOfMonth = targetDateObj.getDate();
      const standardCycleNum =
        dayOfMonth === 31 ? 31 : dayOfMonth % 10 === 0 ? 10 : dayOfMonth % 10;
      resolvedCycle =
        allMasterCycles.find((c) => c.nomor_siklus === standardCycleNum) ||
        allMasterCycles[0];
    }

    const activeCycleNumber = resolvedCycle?.nomor_siklus || 1;
    const activeCycleNama =
      resolvedCycle?.nama_siklus || `Siklus ${activeCycleNumber}`;
    const activeCycleDeskripsi =
      resolvedCycle?.deskripsi ||
      `Siklus menu ${activeCycleNama} untuk hari ${currentHari}`;

    // 5. Fetch all currently active patients in hospital (Real-time from AG RS)
    const livePatients = await db
      .select()
      .from(pasienTable)
      .orderBy(asc(pasienTable.ruangan), asc(pasienTable.bed));

    const livePatientMap = new Map<string, typeof livePatients[0]>();
    for (const p of livePatients) {
      livePatientMap.set(p.no_rm.trim(), p);
    }

    // 6. Fetch post-snapshot authorization records from DB
    const otorisasiRevisions = await db
      .select()
      .from(otorisasiPerubahanDietTable)
      .orderBy(desc(otorisasiPerubahanDietTable.requested_at));

    let patientItems: PemorsianPatientItem[] = [];
    const revisiItems: PemorsianRevisiItem[] = [];

    const currentWaktuTitle = formatWaktuTitle(targetWaktuMakan);

    // ─── SCENARIO A: SNAPSHOT IS LOCKED ──────────────────────────────────
    if (selectedBatch && selectedBatch.id > 0) {
      const snapshotDetails = await db
        .select()
        .from(snapshotDetailTable)
        .where(eq(snapshotDetailTable.batch_id, selectedBatch.id));

      const snapshotRmSet = new Set<string>();

      for (const sd of snapshotDetails) {
        snapshotRmSet.add(sd.no_rm.trim());
        const liveP = livePatientMap.get(sd.no_rm.trim());

        // Check for changes between snapshot baseline & current live state
        let isChanged = false;
        let changeType: string = 'DIET_CHANGE';
        let note = '';

        if (!liveP || liveP.status_pasien === 'PULANG') {
          isChanged = true;
          changeType = 'DISCHARGE';
          note = 'Pasien sudah dipulangkan';
        } else if (liveP.is_npo || liveP.status_pasien === 'NPO') {
          if (sd.status_saat_snapshot !== 'NPO') {
            isChanged = true;
            changeType = 'NPO';
            note = 'Pasien beralih puasa (NPO)';
          }
        } else if (
          liveP.diet.trim().toLowerCase() !== sd.diet_rs_raw.trim().toLowerCase()
        ) {
          isChanged = true;
          changeType = 'DIET_CHANGE';
          note = `Diet berubah dari "${sd.diet_rs_raw}" menjadi "${liveP.diet}"`;
        } else if (
          liveP.ruangan.trim().toLowerCase() !== sd.ruangan.trim().toLowerCase() ||
          liveP.bed.trim().toLowerCase() !== sd.no_bed.trim().toLowerCase()
        ) {
          isChanged = true;
          changeType = 'ROOM_TRANSFER';
          note = `Pindah kamar dari ${sd.ruangan} (Bed ${sd.no_bed}) ke ${liveP.ruangan} (Bed ${liveP.bed})`;
        }

        // Also check if there is an approved otorisasi record for this patient
        const otorisasi = otorisasiRevisions.find(
          (o) =>
            o.batch_id === selectedBatch?.id &&
            liveP?.id !== undefined &&
            o.pasien_id === liveP.id &&
            (o.status === 'APPROVED' || o.status === 'PENDING'),
        );

        if (otorisasi) {
          isChanged = true;
          changeType = otorisasi.jenis_perubahan;
          note = otorisasi.alasan || note;
        }

        if (isChanged) {
          // Add to Butuh Revisi section
          revisiItems.push({
            id: sd.id,
            pasien_id: liveP?.id || sd.id,
            no_rm: sd.no_rm,
            nama_pasien: sd.nama_pasien,
            gedung: liveP?.gedung || sd.gedung,
            ruangan: liveP?.ruangan || sd.ruangan,
            kamar: liveP?.gedung || sd.gedung,
            bed: liveP?.bed || sd.no_bed,
            kelas: liveP?.kelas || sd.kelas,
            waktu_makan: selectedBatch.waktu_makan,
            jenis_perubahan: changeType,
            data_lama: {
              diet: sd.diet_rs_raw,
              ruangan: sd.ruangan,
              bed: sd.no_bed,
              kelas: sd.kelas,
            },
            data_baru: {
              diet: liveP?.diet || (liveP?.is_npo ? 'NPO (Puasa)' : 'Pasien Pulang'),
              ruangan: liveP?.ruangan || sd.ruangan,
              bed: liveP?.bed || sd.no_bed,
              kelas: liveP?.kelas || sd.kelas,
            },
            alasan: note || 'Perubahan data pasien oleh AG RS pasca snapshot',
            status: 'APPROVED',
            dampak_dapur:
              changeType === 'DIET_CHANGE'
                ? `Diet Baru: ${liveP?.diet || '-'}`
                : changeType === 'ROOM_TRANSFER'
                ? `Pindah ke: ${liveP?.ruangan} (Bed ${liveP?.bed})`
                : changeType === 'NPO'
                ? 'Puasa / NPO (-1)'
                : 'Pasien Pulang (-1)',
            requested_by: liveP?.updated_by || 'AG RS',
            requested_at: new Date().toLocaleTimeString('id-ID'),
            batch_id: selectedBatch.id,
            batch_code: selectedBatch.batch_code,
          });

          // Add to patient items with BUTUH_REVISI status
          patientItems.push({
            id: sd.id,
            nama_pasien: sd.nama_pasien,
            no_rm: sd.no_rm,
            ruangan: liveP?.ruangan || sd.ruangan,
            kamar: liveP?.gedung || sd.gedung || '',
            gedung: liveP?.gedung || sd.gedung,
            bed: liveP?.bed || sd.no_bed,
            diet: liveP?.diet || sd.diet_rs_raw,
            waktu: currentWaktuTitle,
            status: liveP?.is_npo ? 'NPO' : liveP?.status_pasien || 'AKTIF',
            kelas: liveP?.kelas || sd.kelas,
            batch_id: sd.batch_id,
            batch_code: selectedBatch.batch_code,
            is_emergent: sd.is_emergent,
            extra: sd.extra,
            buah: sd.buah,
            snack: sd.snack,
            print_status: 'BUTUH_REVISI',
            diet_lama: sd.diet_rs_raw,
            revisi_note: note,
          });
        } else {
          // Unchanged Patient -> Available for printing or already printed
          patientItems.push({
            id: sd.id,
            nama_pasien: sd.nama_pasien,
            no_rm: sd.no_rm,
            ruangan: sd.ruangan,
            kamar: sd.gedung || '',
            gedung: sd.gedung,
            bed: sd.no_bed,
            diet: sd.diet_rs_raw || sd.bentuk_makanan || 'Diet Biasa',
            waktu: currentWaktuTitle,
            status: sd.is_emergent ? 'EMERGENT' : sd.status_saat_snapshot || 'AKTIF',
            kelas: sd.kelas,
            batch_id: sd.batch_id,
            batch_code: selectedBatch.batch_code,
            is_emergent: sd.is_emergent,
            extra: sd.extra,
            buah: sd.buah,
            snack: sd.snack,
            print_status: 'BELUM_DICETAK',
          });
        }
      }

      // Check for newly added patients in pasienTable who were NOT in the snapshot batch
      for (const p of livePatients) {
        if (p.status_pasien === 'PULANG') continue;
        if (!snapshotRmSet.has(p.no_rm.trim())) {
          // Pasien Baru Susulan (Post-Snapshot Addition)
          const newRevId = 900000 + p.id;
          revisiItems.push({
            id: newRevId,
            pasien_id: p.id,
            no_rm: p.no_rm,
            nama_pasien: p.nama_pasien,
            gedung: p.gedung,
            ruangan: p.ruangan,
            kamar: p.gedung,
            bed: p.bed,
            kelas: p.kelas,
            waktu_makan: selectedBatch.waktu_makan,
            jenis_perubahan: 'NEW_PATIENT',
            data_lama: null,
            data_baru: {
              diet: p.diet,
              ruangan: p.ruangan,
              bed: p.bed,
              kelas: p.kelas,
            },
            alasan: 'Pasien baru ditambahkan oleh AG RS pasca snapshot dikunci',
            status: 'APPROVED',
            dampak_dapur: `Pasien Baru Susulan (+1 Porsi: ${p.diet})`,
            requested_by: p.updated_by || 'AG RS',
            requested_at: new Date().toLocaleTimeString('id-ID'),
            batch_id: selectedBatch.id,
            batch_code: selectedBatch.batch_code,
          });

          patientItems.push({
            id: p.id,
            nama_pasien: p.nama_pasien,
            no_rm: p.no_rm,
            ruangan: p.ruangan,
            kamar: p.gedung || '',
            gedung: p.gedung,
            bed: p.bed,
            diet: p.diet,
            waktu: currentWaktuTitle,
            status: p.status_pasien,
            kelas: p.kelas,
            batch_id: selectedBatch.id,
            batch_code: selectedBatch.batch_code,
            is_emergent: true,
            print_status: 'BUTUH_REVISI',
            revisi_note: 'Pasien baru susulan pasca snapshot dikunci',
          });
        }
      }
    } else {
      // ─── SCENARIO B: SNAPSHOT IS NOT LOCKED YET (LIVE PREVIEW) ───────────
      // AG RS enters data via Raw Text -> directly visible here without delay!
      const activePatients = livePatients.filter(
        (p) => p.status_pasien !== 'PULANG',
      );

      patientItems = activePatients.map((p) => {
        const isNpo =
          p.is_npo ||
          p.status_pasien === 'NPO' ||
          p.diet.toLowerCase().includes('npo') ||
          p.diet.toLowerCase().includes('puasa');

        return {
          id: p.id,
          nama_pasien: p.nama_pasien,
          no_rm: p.no_rm,
          ruangan: p.ruangan,
          kamar: p.gedung || '',
          gedung: p.gedung,
          bed: p.bed,
          diet: isNpo ? 'NPO (Puasa)' : p.diet,
          waktu: currentWaktuTitle,
          status: isNpo ? 'NPO' : p.status_pasien,
          kelas: p.kelas,
          batch_id: null,
          batch_code: `BATCH-${nextCycle.tanggalProduksi.replace(/-/g, '')}-${nextCycle.waktuMakan}-PREVIEW`,
          is_emergent: false,
          print_status: 'BELUM_DICETAK',
        };
      });
    }

    // 7. Calculate diet summaries & counts
    const dietMap = new Map<string, number>();
    let activeCount = 0;
    let npoCount = 0;

    for (const p of patientItems) {
      const isNpo =
        p.status === 'NPO' ||
        p.diet.toLowerCase().includes('npo') ||
        p.diet.toLowerCase().includes('puasa');

      if (isNpo) {
        npoCount++;
      } else {
        activeCount++;
      }

      const dietKey = p.diet || 'Lain-Lain';
      dietMap.set(dietKey, (dietMap.get(dietKey) || 0) + 1);
    }

    const dietSummary: PemorsianDietCount[] = Array.from(dietMap.entries())
      .map(([diet, count]) => ({ diet, count }))
      .sort((a, b) => b.count - a.count);

    const butuhRevisiCount = revisiItems.length;
    const belumDicetakCount = patientItems.filter(
      (p) => p.print_status === 'BELUM_DICETAK',
    ).length;
    const sudahDicetakCount = patientItems.filter(
      (p) => p.print_status === 'SUDAH_DICETAK',
    ).length;

    const dateStr = targetDateStr.replace(/-/g, '');
    const currentWaktuCode = targetWaktuMakan;
    const resolvedBatchCode =
      selectedBatch?.batch_code ||
      `BATCH-${dateStr}-${currentWaktuCode}-LIVE`;

    return {
      success: true,
      batch: selectedBatch,
      batchId: selectedBatch?.id || null,
      batchCode: resolvedBatchCode,
      waktuMakan: currentWaktuCode,
      tanggalProduksi: targetDateStr,
      statusBatch: selectedBatch ? 'LOCKED' : 'LIVE',
      cutoffTime: selectedBatch?.cutoff_time || nextCycle.cutoffTime,

      // Cycle & Day Info
      siklusKe: activeCycleNumber,
      namaSiklus: activeCycleNama,
      hari: currentHari,
      tanggalFormatted,
      deskripsiSiklus: activeCycleDeskripsi,

      availableBatches,
      patients: patientItems,
      revisiItems,

      totalCount: patientItems.length,
      totalPasien: patientItems.length,
      revisiCount: butuhRevisiCount,
      dietSummary,
      activeCount,
      npoCount,

      belumDicetakCount,
      sudahDicetakCount,
      butuhRevisiCount,

      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error fetching live pemorsian data:', error);
    return {
      success: false,
      batch: null,
      batchId: null,
      batchCode: 'ERROR-FETCH',
      waktuMakan: 'NONE',
      tanggalProduksi: '',
      statusBatch: 'LOCKED',
      cutoffTime: '00:00',

      siklusKe: 1,
      namaSiklus: 'Siklus 1',
      hari: 'SENIN',
      tanggalFormatted: '',
      deskripsiSiklus: '',

      availableBatches: [],
      patients: [],
      revisiItems: [],

      totalCount: 0,
      totalPasien: 0,
      revisiCount: 0,
      dietSummary: [],
      activeCount: 0,
      npoCount: 0,

      belumDicetakCount: 0,
      sudahDicetakCount: 0,
      butuhRevisiCount: 0,

      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

/**
 * Backward compatibility alias for getPemorsianData
 */
export async function getPemorsianData(
  batchId?: number,
  filterDate?: string,
  filterWaktuMakan?: string,
): Promise<PemorsianSummaryData> {
  return getLivePemorsianData(batchId, filterDate, filterWaktuMakan);
}

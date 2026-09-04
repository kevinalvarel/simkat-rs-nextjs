'use server';

import { eq, desc, and, ne } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { isNpoPatient } from '@/lib/npo-utils';
import type {
  DpmpSummaryData,
  DpmpBatchOption,
  DpmpPatientItem,
} from '@/types/dpmptypes';

function formatWaktuTitle(waktu: string): string {
  const lower = (waktu || '').toLowerCase();
  if (lower.includes('siang')) return 'Siang';
  if (lower.includes('malam')) return 'Malam';
  return 'Pagi';
}

/**
 * Fetch all available snapshot batches for DPMP page
 */
export async function getAvailableDpmpBatches(): Promise<DpmpBatchOption[]> {
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
    console.error('Error fetching available batches for DPMP:', error);
    return [];
  }
}

/**
 * Determines which meal time is currently LIVE (not locked) for a given date (defaults to today).
 * Sequence: PAGI -> SIANG -> MALAM
 * If PAGI is locked and SIANG is locked, then MALAM is live.
 * If PAGI is locked, but SIANG is not, then SIANG is live.
 * If PAGI is not locked, then PAGI is live.
 */
export async function getLiveWaktuMakan(
  targetDateStr?: string,
): Promise<'PAGI' | 'SIANG' | 'MALAM'> {
  const targetDate = targetDateStr || new Date().toISOString().slice(0, 10);
  try {
    const lockedBatches = await db
      .select({ waktu_makan: snapshotBatchTable.waktu_makan })
      .from(snapshotBatchTable)
      .where(
        and(
          eq(snapshotBatchTable.tanggal_produksi, targetDate),
          eq(snapshotBatchTable.status_batch, 'LOCKED'),
        ),
      );

    const lockedSet = new Set(
      lockedBatches.map((b) => b.waktu_makan.toUpperCase()),
    );
    const sequence: Array<'PAGI' | 'SIANG' | 'MALAM'> = [
      'PAGI',
      'SIANG',
      'MALAM',
    ];

    for (const w of sequence) {
      if (!lockedSet.has(w)) {
        return w;
      }
    }

    return 'MALAM';
  } catch (err) {
    console.error('Error determining live waktu makan:', err);
    return 'PAGI';
  }
}

/**
 * Fetch patient data and summary for DPMP (Daftar Permintaan Makanan Pasien) distribution & receipt page
 */
export async function getDpmpData(
  targetDateOrBatchId?: number | string,
  targetWaktuMakan?: string,
): Promise<DpmpSummaryData> {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentLiveWaktu = await getLiveWaktuMakan(todayStr);

    const availableBatches = await getAvailableDpmpBatches();
    const availableDatesSet = new Set<string>([todayStr]);
    for (const b of availableBatches) {
      if (b.tanggal_produksi) availableDatesSet.add(b.tanggal_produksi);
    }
    const availableDates = Array.from(availableDatesSet).sort((a, b) =>
      b.localeCompare(a),
    );

    let selectedBatch: DpmpBatchOption | null = null;
    let selectedDate = todayStr;
    let selectedWaktu: 'PAGI' | 'SIANG' | 'MALAM' = currentLiveWaktu;

    if (typeof targetDateOrBatchId === 'number') {
      selectedBatch =
        availableBatches.find((b) => b.id === targetDateOrBatchId) || null;
      if (selectedBatch) {
        selectedDate = selectedBatch.tanggal_produksi;
        selectedWaktu = selectedBatch.waktu_makan.toUpperCase() as
          | 'PAGI'
          | 'SIANG'
          | 'MALAM';
      }
    } else if (typeof targetDateOrBatchId === 'string') {
      if (
        targetDateOrBatchId === 'LIVE_PREVIEW' ||
        targetDateOrBatchId === 'LIVE'
      ) {
        selectedDate = todayStr;
        selectedWaktu = (targetWaktuMakan?.toUpperCase() ||
          currentLiveWaktu) as 'PAGI' | 'SIANG' | 'MALAM';
      } else {
        selectedDate = targetDateOrBatchId;
        selectedWaktu = (targetWaktuMakan?.toUpperCase() ||
          (selectedDate === todayStr ? currentLiveWaktu : 'PAGI')) as
          | 'PAGI'
          | 'SIANG'
          | 'MALAM';
        selectedBatch =
          availableBatches.find(
            (b) =>
              b.tanggal_produksi === selectedDate &&
              b.waktu_makan.toUpperCase() === selectedWaktu,
          ) || null;
      }
    } else {
      // Default: Always default to today and the currently LIVE snapshot meal time!
      selectedDate = todayStr;
      selectedWaktu = currentLiveWaktu;
      selectedBatch =
        availableBatches.find(
          (b) =>
            b.tanggal_produksi === selectedDate &&
            b.waktu_makan.toUpperCase() === selectedWaktu,
        ) || null;
    }

    // Existing batches for this date
    const batchesOnDate = availableBatches.filter(
      (b) => b.tanggal_produksi === selectedDate,
    );
    const existingWaktuForDate = batchesOnDate.map((b) =>
      b.waktu_makan.toUpperCase(),
    );

    let patientItems: DpmpPatientItem[] = [];

    // 2. Fetch snapshot detail if batch ID is valid in DB
    if (selectedBatch && selectedBatch.id > 0) {
      try {
        const details = await db
          .select()
          .from(snapshotDetailTable)
          .where(eq(snapshotDetailTable.batch_id, selectedBatch.id));

        if (details && details.length > 0) {
          patientItems = details.map((d) => {
            const isNpo = isNpoPatient(d);
            return {
              id: d.id,
              nama_pasien: d.nama_pasien,
              no_rm: d.no_rm,
              ruangan: d.ruangan,
              kamar: d.gedung || 'Kamar 1',
              gedung: d.gedung,
              bed: d.no_bed,
              diet: isNpo
                ? 'NPO (Puasa)'
                : d.diet_rs_raw || d.bentuk_makanan || 'Diet Biasa',
              waktu: formatWaktuTitle(
                selectedBatch?.waktu_makan || selectedWaktu,
              ),
              status: isNpo
                ? 'NPO'
                : d.is_emergent
                ? 'EMERGENT'
                : d.status_saat_snapshot || 'AKTIF',
              kelas: d.kelas,
              batch_id: d.batch_id,
              batch_code: selectedBatch?.batch_code,
              is_emergent: d.is_emergent,
              extra: isNpo ? null : d.extra,
              buah: isNpo ? null : d.buah,
              snack: isNpo ? null : d.snack,
            };
          });
        }
      } catch (err) {
        console.error('Error fetching snapshot details for DPMP:', err);
      }
    } else if (selectedDate === todayStr) {
      // 3. Fallback to live active patients if today has no locked batch for this meal time
      try {
        const livePatients = await db
          .select()
          .from(pasienTable)
          .where(
            and(
              ne(pasienTable.status_pasien, 'PULANG'),
              ne(pasienTable.status_pasien, 'PENDING_REVISI'),
            ),
          );

        if (livePatients && livePatients.length > 0) {
          patientItems = livePatients.map((p) => {
            const isNpo = isNpoPatient(p);

            return {
              id: p.id,
              nama_pasien: p.nama_pasien,
              no_rm: p.no_rm,
              ruangan: p.ruangan,
              kamar: p.gedung || 'Kamar 1',
              gedung: p.gedung,
              bed: p.bed,
              diet: isNpo ? 'NPO (Puasa)' : p.diet,
              waktu: formatWaktuTitle(selectedWaktu),
              status: isNpo ? 'NPO' : p.status_pasien,
              kelas: p.kelas,
              batch_id: null,
              batch_code: 'LIVE-PREVIEW',
              is_emergent: false,
            };
          });
        }
      } catch (err) {
        console.error('Error fetching live patients for DPMP:', err);
      }
    }

    // 4. Compute Counts & Formatting
    const totalCount = patientItems.length;
    const npoCount = patientItems.filter((p) => isNpoPatient(p) || p.status === 'NPO').length;
    const activeCount = patientItems.filter((p) => !isNpoPatient(p) && p.status !== 'NPO').length;
    const emergentCount = patientItems.filter(
      (p) => (p.is_emergent || p.status === 'EMERGENT') && !isNpoPatient(p),
    ).length;

    const dateObj = new Date(selectedDate);
    const tanggalFormatted = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : selectedDate;

    const waktuMakanFormatted = formatWaktuTitle(selectedWaktu);
    const dateClean = selectedDate.replace(/-/g, '');
    const dpmpNumber = `DPMP/GZ-RS/${dateClean}/${selectedWaktu}-001`;

    const effectiveBatch: DpmpBatchOption = selectedBatch
      ? {
          ...selectedBatch,
          total_pasien: activeCount, // Permintaan porsi makanan murni pasien makan
        }
      : {
          id: 0,
          batch_code: 'LIVE-PREVIEW',
          tanggal_produksi: selectedDate,
          waktu_makan: selectedWaktu,
          total_pasien: activeCount,
          status_batch: 'LIVE_PREVIEW',
          cutoff_time: null,
        };

    return {
      success: true,
      batch: effectiveBatch,
      availableBatches,
      patients: patientItems,
      totalCount,
      activeCount,
      npoCount,
      emergentCount,
      dpmpNumber,
      kwitansiNumber: dpmpNumber,
      tanggalFormatted,
      waktuMakanFormatted,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
      selectedDate,
      selectedWaktu,
      availableDates,
      existingWaktuForDate,
      currentLiveWaktu,
    };
  } catch (error) {
    console.error('Error in getDpmpData:', error);
    const today = new Date().toISOString().slice(0, 10);
    const fallbackNumber = `DPMP/GZ-RS/${today.replace(/-/g, '')}/PAGI-001`;
    return {
      success: false,
      batch: null,
      availableBatches: [],
      patients: [],
      totalCount: 0,
      activeCount: 0,
      npoCount: 0,
      emergentCount: 0,
      dpmpNumber: fallbackNumber,
      kwitansiNumber: fallbackNumber,
      tanggalFormatted: 'Hari Ini',
      waktuMakanFormatted: 'Pagi',
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
      selectedDate: today,
      selectedWaktu: 'PAGI',
      availableDates: [today],
      existingWaktuForDate: [],
    };
  }
}

// Aliases for backwards compatibility
export const getAvailableKwitansiBatches = getAvailableDpmpBatches;
export const getKwitansiData = getDpmpData;

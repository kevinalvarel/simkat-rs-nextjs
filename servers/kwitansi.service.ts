'use server';

import { eq, desc, and, ne } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import type {
  KwitansiSummaryData,
  KwitansiBatchOption,
  KwitansiPatientItem,
} from '@/types/kwitansitypes';

function formatWaktuTitle(waktu: string): string {
  const lower = (waktu || '').toLowerCase();
  if (lower.includes('siang')) return 'Siang';
  if (lower.includes('malam')) return 'Malam';
  return 'Pagi';
}

/**
 * Fetch all available snapshot batches for Kwitansi page
 */
export async function getAvailableKwitansiBatches(): Promise<
  KwitansiBatchOption[]
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
    console.error('Error fetching available batches for kwitansi:', error);
    return [];
  }
}

/**
 * Fetch patient data and summary for Kwitansi distribution & receipt page
 */
export async function getKwitansiData(
  batchId?: number,
): Promise<KwitansiSummaryData> {
  try {
    const availableBatches = await getAvailableKwitansiBatches();

    // 1. Determine selected batch
    let selectedBatch: KwitansiBatchOption | null = null;
    if (batchId) {
      selectedBatch = availableBatches.find((b) => b.id === batchId) || null;
    }
    if (!selectedBatch && availableBatches.length > 0) {
      selectedBatch = availableBatches[0];
    }

    let patientItems: KwitansiPatientItem[] = [];

    // 2. Fetch snapshot detail if batch ID is valid in DB
    if (selectedBatch && selectedBatch.id > 0) {
      try {
        const details = await db
          .select()
          .from(snapshotDetailTable)
          .where(eq(snapshotDetailTable.batch_id, selectedBatch.id));

        if (details && details.length > 0) {
          patientItems = details.map((d) => ({
            id: d.id,
            nama_pasien: d.nama_pasien,
            no_rm: d.no_rm,
            ruangan: d.ruangan,
            gedung: d.gedung,
            bed: d.no_bed,
            diet: d.diet_rs_raw || d.bentuk_makanan || 'Diet Biasa',
            waktu: formatWaktuTitle(selectedBatch?.waktu_makan || 'PAGI'),
            status: d.is_emergent
              ? 'EMERGENT'
              : d.status_saat_snapshot || 'AKTIF',
            kelas: d.kelas,
            batch_id: d.batch_id,
            batch_code: selectedBatch?.batch_code,
            is_emergent: d.is_emergent,
            extra: d.extra,
            buah: d.buah,
            snack: d.snack,
          }));
        }
      } catch (err) {
        console.error('Error fetching snapshot details for kwitansi:', err);
      }
    }

    // 3. Fallback to live active patients if no batches exist in DB
    if (patientItems.length === 0 && availableBatches.length === 0) {
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
          const currentWaktu = selectedBatch
            ? formatWaktuTitle(selectedBatch.waktu_makan)
            : 'Pagi';

          patientItems = livePatients.map((p) => {
            const isNpo =
              p.is_npo ||
              p.status_pasien === 'NPO' ||
              p.diet.toLowerCase() === 'npo' ||
              p.diet.toLowerCase() === 'puasa';

            return {
              id: p.id,
              nama_pasien: p.nama_pasien,
              no_rm: p.no_rm,
              ruangan: p.ruangan,
              gedung: p.gedung,
              bed: p.bed,
              diet: isNpo ? 'NPO (Puasa)' : p.diet,
              waktu: currentWaktu,
              status: isNpo ? 'NPO' : p.status_pasien,
              kelas: p.kelas,
              batch_id: null,
              batch_code: 'LIVE-PREVIEW',
              is_emergent: false,
            };
          });
        }
      } catch (err) {
        console.error('Error fetching live patients for kwitansi:', err);
      }
    }

    // 4. Compute Counts & Formatting
    const totalCount = patientItems.length;
    const activeCount = patientItems.filter((p) => p.status === 'AKTIF').length;
    const npoCount = patientItems.filter((p) => p.status === 'NPO').length;
    const emergentCount = patientItems.filter((p) => p.is_emergent || p.status === 'EMERGENT').length;

    const targetDateStr = selectedBatch?.tanggal_produksi || new Date().toISOString().slice(0, 10);
    const dateObj = new Date(targetDateStr);
    const tanggalFormatted = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : targetDateStr;

    const waktuMakanFormatted = selectedBatch
      ? formatWaktuTitle(selectedBatch.waktu_makan)
      : 'Pagi';

    const dateClean = targetDateStr.replace(/-/g, '');
    const kwitansiNumber = `KWT/GZ-RS/${dateClean}/${selectedBatch?.waktu_makan?.toUpperCase() || 'PAGI'}-001`;

    return {
      success: true,
      batch: selectedBatch,
      availableBatches,
      patients: patientItems,
      totalCount,
      activeCount,
      npoCount,
      emergentCount,
      kwitansiNumber,
      tanggalFormatted,
      waktuMakanFormatted,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error in getKwitansiData:', error);
    const today = new Date().toISOString().slice(0, 10);
    return {
      success: false,
      batch: null,
      availableBatches: [],
      patients: [],
      totalCount: 0,
      activeCount: 0,
      npoCount: 0,
      emergentCount: 0,
      kwitansiNumber: `KWT/GZ-RS/${today.replace(/-/g, '')}/PAGI-001`,
      tanggalFormatted: 'Hari Ini',
      waktuMakanFormatted: 'Pagi',
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

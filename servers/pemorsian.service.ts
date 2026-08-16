'use server';

import { eq, desc, ne } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { getRevisiPostSnapshot } from '@/servers/revisi-snapshot.service';
import type {
  PemorsianBatchOption,
  PemorsianPatientItem,
  PemorsianRevisiItem,
  PemorsianSummaryData,
  PemorsianDietCount,
} from '@/types/pemorsiantypes';

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
 * Fetch snapshot patient data, post-snapshot revisions, and summaries for the Pemorsian page
 */
export async function getPemorsianData(
  batchId?: number,
): Promise<PemorsianSummaryData> {
  try {
    const availableBatches = await getAvailablePemorsianBatches();

    // 1. Determine target batch
    let selectedBatch: PemorsianBatchOption | null = null;
    if (batchId) {
      selectedBatch = availableBatches.find((b) => b.id === batchId) || null;
    }
    if (!selectedBatch && availableBatches.length > 0) {
      selectedBatch = availableBatches[0];
    }

    let patientItems: PemorsianPatientItem[] = [];

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
        console.error('Error fetching snapshot details from DB:', err);
      }
    }

    // 3. Fallback to live active patients ONLY if there are NO batches in the DB at all
    if (patientItems.length === 0 && availableBatches.length === 0) {
      try {
        const livePatients = await db
          .select()
          .from(pasienTable)
          .where(eq(pasienTable.status_pasien, 'AKTIF'));

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
        console.error('Error fetching live patients for pemorsian:', err);
      }
    }

    // 4. Fetch post-snapshot revisions for this meal cycle (ONLY APPROVED & SELESAI)
    let revisiItems: PemorsianRevisiItem[] = [];
    try {
      const rawRevisi = await getRevisiPostSnapshot(
        selectedBatch?.waktu_makan,
        selectedBatch?.id,
      );

      if (rawRevisi && rawRevisi.length > 0) {
        revisiItems = rawRevisi
          .filter((r) => r.status === 'APPROVED' || r.status === 'SELESAI')
          .map((r) => ({
            id: r.id,
            pasien_id: r.pasien_id,
            no_rm: r.no_rm,
            nama_pasien: r.nama_pasien,
            gedung: r.gedung,
            ruangan: r.ruangan,
            bed: r.bed,
            kelas: r.kelas,
            waktu_makan: r.waktu_makan,
            jenis_perubahan: r.jenis_perubahan,
            data_lama: r.data_lama,
            data_baru: r.data_baru,
            alasan: r.alasan,
            status: r.status,
            dampak_dapur: r.dampak_dapur,
            requested_by: r.requested_by,
            requested_at: r.requested_at,
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at,
            review_notes: r.review_notes,
            batch_id: r.batch_id,
            batch_code: r.batch_code,
          }));
      }
    } catch (err) {
      console.error('Error fetching revisi post snapshot in pemorsian:', err);
    }

    // 5. Calculate summary metrics
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

    return {
      success: true,
      batch: selectedBatch,
      availableBatches,
      patients: patientItems,
      revisiItems: revisiItems,
      totalCount: patientItems.length,
      revisiCount: revisiItems.length,
      dietSummary,
      activeCount,
      npoCount,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  } catch (error) {
    console.error('Error in getPemorsianData:', error);
    return {
      success: false,
      batch: null,
      availableBatches: [],
      patients: [],
      revisiItems: [],
      totalCount: 0,
      revisiCount: 0,
      dietSummary: [],
      activeCount: 0,
      npoCount: 0,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

'use server';

import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';

// ---------- Types ----------

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;

export type WaktuMakanConfig = {
  id: number;
  jenis_makan: string; // PAGI | SIANG | MALAM
  waktu: string; // HH:mm format
};

export type MutationResult = {
  success: boolean;
  message: string;
};

// ---------- Queries ----------

/**
 * Fetch all snapshot batches sorted by latest snapshot timestamp
 */
export async function getSnapshotBatches(): Promise<SnapshotBatch[]> {
  try {
    const batches = await db
      .select()
      .from(snapshotBatchTable)
      .orderBy(desc(snapshotBatchTable.timestamp_snapshot));

    return batches;
  } catch (error) {
    console.error('Error fetching snapshot batches:', error);
    return [];
  }
}

/**
 * Fetch cut-off time configuration for meal times
 */
export async function getWaktuMakanConfig(): Promise<WaktuMakanConfig[]> {
  try {
    const configs = await db.select().from(waktuMakanTable);

    if (configs && configs.length > 0) {
      // Map and deduplicate by jenis_makan to prevent duplicate cards
      const uniqueMap = new Map<string, WaktuMakanConfig>();
      for (const c of configs) {
        if (!uniqueMap.has(c.jenis_makan)) {
          uniqueMap.set(c.jenis_makan, {
            id: c.id,
            jenis_makan: c.jenis_makan,
            waktu: c.waktu ? c.waktu.slice(0, 5) : '00:00',
          });
        }
      }

      // Ensure standard order: PAGI, SIANG, MALAM
      const order = ['PAGI', 'SIANG', 'MALAM'];
      const defaultTimes: Record<string, string> = {
        PAGI: '05:30',
        SIANG: '10:30',
        MALAM: '16:00',
      };

      return order.map((jm) => {
        if (uniqueMap.has(jm)) {
          return uniqueMap.get(jm)!;
        }
        return {
          id: 0,
          jenis_makan: jm,
          waktu: defaultTimes[jm] || '12:00',
        };
      });
    }
  } catch (error) {
    console.error('Error fetching waktu makan config:', error);
  }

  // Fallback defaults if table is empty or error
  return [
    { id: 1, jenis_makan: 'PAGI', waktu: '05:30' },
    { id: 2, jenis_makan: 'SIANG', waktu: '10:30' },
    { id: 3, jenis_makan: 'MALAM', waktu: '16:00' },
  ];
}

/**
 * Fetch details of patients included in a specific snapshot batch
 */
export async function getSnapshotDetailsByBatchId(
  batchId: number,
): Promise<SnapshotDetail[]> {
  try {
    const details = await db
      .select()
      .from(snapshotDetailTable)
      .where(eq(snapshotDetailTable.batch_id, batchId));

    return details;
  } catch (error) {
    console.error('Error fetching snapshot details:', error);
    return [];
  }
}

// ---------- Mutations ----------

/**
 * Update cut-off time for a specific meal time
 */
export async function updateWaktuMakanConfig(
  jenisMakan: string,
  newWaktu: string,
): Promise<MutationResult> {
  try {
    const existing = await db
      .select()
      .from(waktuMakanTable)
      .where(eq(waktuMakanTable.jenis_makan, jenisMakan));

    if (existing && existing.length > 0) {
      // Update the first record
      await db
        .update(waktuMakanTable)
        .set({ waktu: newWaktu })
        .where(eq(waktuMakanTable.id, existing[0].id));

      // If duplicate records exist for the same jenis_makan, delete the duplicates
      if (existing.length > 1) {
        for (let i = 1; i < existing.length; i++) {
          await db
            .delete(waktuMakanTable)
            .where(eq(waktuMakanTable.id, existing[i].id));
        }
      }
    } else {
      await db.insert(waktuMakanTable).values({
        jenis_makan: jenisMakan,
        waktu: newWaktu,
      });
    }

    revalidatePath('/dashboard/ag-katering/status-snapshot');
    revalidatePath('/dashboard/ag-katering/overview');
    return {
      success: true,
      message: `Waktu cut-off ${jenisMakan} berhasil diperbarui menjadi ${newWaktu}.`,
    };
  } catch (error) {
    console.error('Error updating waktu makan config:', error);
    return { success: false, message: 'Gagal memperbarui waktu cut-off.' };
  }
}

/**
 * Trigger manual snapshot generation for a meal time
 */
export async function triggerManualSnapshot(
  waktuMakan: string,
  cutoffTime: string,
): Promise<MutationResult> {
  try {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const batchCode = `BATCH-${dateStr}-${waktuMakan}-${Date.now()
      .toString()
      .slice(-4)}`;

    // 1. Fetch active patients
    const activePatients = await db
      .select()
      .from(pasienTable)
      .where(eq(pasienTable.status_pasien, 'AKTIF'));

    // 2. Create batch record
    const [insertedBatch] = await db
      .insert(snapshotBatchTable)
      .values({
        batch_code: batchCode,
        tanggal_produksi: now.toISOString().slice(0, 10),
        waktu_makan: waktuMakan,
        timestamp_snapshot: now,
        total_pasien: activePatients.length,
        status_batch: 'LOCKED',
        created_by: 'Ahli Gizi Katering (Manual Trigger)',
        cutoff_time: cutoffTime,
      })
      .returning({ id: snapshotBatchTable.id });

    if (insertedBatch && activePatients.length > 0) {
      // 3. Insert snapshot detail records
      const snapshotDetails = activePatients.map((p) => ({
        batch_id: insertedBatch.id,
        no_rm: p.no_rm,
        nama_pasien: p.nama_pasien,
        gedung: p.gedung,
        ruangan: p.ruangan,
        no_bed: p.bed,
        kelas: p.kelas,
        diet_rs_raw: p.diet,
        status_saat_snapshot: p.status_pasien,
        is_emergent: false,
      }));

      await db.insert(snapshotDetailTable).values(snapshotDetails);
    }

    revalidatePath('/dashboard/ag-katering/status-snapshot');
    revalidatePath('/dashboard/ag-katering/overview');
    return {
      success: true,
      message: `Batch snapshot ${batchCode} berhasil dibuat dengan ${activePatients.length} pasien ter-lock.`,
    };
  } catch (error) {
    console.error('Error triggering manual snapshot:', error);
    return { success: false, message: 'Gagal membuat snapshot batch.' };
  }
}

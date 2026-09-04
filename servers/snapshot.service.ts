'use server';

import { eq, desc, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/drizzle';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { pasienTable } from '@/db/schemas/patient/pasien';
import { waktuMakanTable } from '@/db/schemas/patient/waktu-makan';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import { isNpoPatient } from '@/lib/npo-utils';

import type { WaktuMakanConfig, MealCycleStatus } from '@/lib/snapshot-cycle';

export type { WaktuMakanConfig, MealCycleStatus };

// ---------- Types ----------

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;

export type MutationResult = {
  success: boolean;
  message: string;
};

// ---------- Queries ----------

/**
 * Fetch all snapshot batches sorted by latest snapshot timestamp.
 * Automatically checks and triggers auto-lock for any past-due cut-off times for today.
 */
export async function getSnapshotBatches(): Promise<SnapshotBatch[]> {
  try {
    // Auto-check and trigger snapshot for any meal cycle whose cutoff time has passed today
    await checkAndAutoLockSnapshots();

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

// ---------- Mutations & Auto-Lock ----------

/**
 * Automatically check cut-off times for today and trigger snapshot if past due.
 * Disables revalidatePath during RSC rendering to avoid Next.js render error.
 */
export async function checkAndAutoLockSnapshots(): Promise<{
  autoLockedCount: number;
  message: string;
}> {
  try {
    const configs = await getWaktuMakanConfig();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Fetch existing snapshot batches for today
    const todayBatches = await db
      .select()
      .from(snapshotBatchTable)
      .where(eq(snapshotBatchTable.tanggal_produksi, todayStr));

    const existingWaktuSet = new Set(todayBatches.map((b) => b.waktu_makan));
    let autoLockedCount = 0;

    for (const config of configs) {
      const [h, m] = config.waktu.split(':').map(Number);
      const cutoffMinutes = h * 60 + m;

      // If current time has reached or passed cutoff AND today's snapshot doesn't exist yet
      if (
        currentMinutes >= cutoffMinutes &&
        !existingWaktuSet.has(config.jenis_makan)
      ) {
        // Skip revalidatePath during RSC render and lock explicitly for today's batch
        const res = await triggerManualSnapshot(
          config.jenis_makan,
          config.waktu,
          true, // skipRevalidate = true
          todayStr, // targetDateStr = todayStr
        );
        if (res.success) {
          autoLockedCount++;
        }
      }
    }

    return {
      autoLockedCount,
      message:
        autoLockedCount > 0
          ? `${autoLockedCount} batch snapshot otomatis ter-lock karena jam cut-off telah tercapai.`
          : 'Seluruh batch snapshot sudah sesuai jadwal.',
    };
  } catch (error) {
    console.error('Error auto-locking snapshots:', error);
    return {
      autoLockedCount: 0,
      message: 'Gagal mengeksekusi auto-lock snapshot.',
    };
  }
}

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

    try {
      revalidatePath('/dashboard/ag-katering/status-snapshot');
      revalidatePath('/dashboard/ag-katering/overview');
      revalidatePath('/dashboard/ag-katering/overview/produksi');
      revalidatePath('/dashboard/ag-katering/overview/pemorsian');
    } catch {
      // Ignore if called in render context
    }

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
 * Trigger manual snapshot generation for a meal time.
 * Accepts optional skipRevalidate parameter to prevent revalidatePath during RSC rendering.
 * Accepts optional targetDateStr parameter (YYYY-MM-DD) to support tomorrow's cycle snapshot.
 */
export async function triggerManualSnapshot(
  waktuMakan: string,
  cutoffTime: string,
  skipRevalidate: boolean = false,
  targetDateStr?: string,
): Promise<MutationResult> {
  try {
    const now = new Date();
    let prodDate = targetDateStr;

    if (!prodDate) {
      const todayStr = now.toISOString().slice(0, 10);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const configs = await getWaktuMakanConfig();
      const malamCutoff =
        configs.find((c) => c.jenis_makan === 'MALAM')?.waktu || '16:00';
      const [malamH, malamM] = malamCutoff.split(':').map(Number);
      const malamMinutes = malamH * 60 + malamM;

      // Check if malam batch exists today
      const todayMalamBatch = await db
        .select()
        .from(snapshotBatchTable)
        .where(
          and(
            eq(snapshotBatchTable.tanggal_produksi, todayStr),
            eq(snapshotBatchTable.waktu_makan, 'MALAM'),
          ),
        );

      if (
        waktuMakan === 'PAGI' &&
        (currentMinutes >= malamMinutes || todayMalamBatch.length > 0)
      ) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        prodDate = tomorrow.toISOString().slice(0, 10);
      } else {
        prodDate = todayStr;
      }
    }

    const dateStr = prodDate.replace(/-/g, '');
    const batchCode = `BATCH-${dateStr}-${waktuMakan}-${Date.now()
      .toString()
      .slice(-4)}`;

    // 1. Fetch active patients and master diet mappings
    const activePatients = await db
      .select()
      .from(pasienTable)
      .where(
        and(
          ne(pasienTable.status_pasien, 'PULANG'),
          ne(pasienTable.status_pasien, 'PENDING_REVISI'),
        ),
      );

    const masterMappings = await db
      .select()
      .from(dietMappingTable)
      .where(eq(dietMappingTable.is_active, true));

    const mappingByRaw = new Map<string, typeof masterMappings[0]>();
    for (const m of masterMappings) {
      mappingByRaw.set(m.diet_rs_raw.trim().toLowerCase(), m);
    }

    // Determine feeding patients (excluding NPO)
    const feedingPatients = activePatients.filter((p) => {
      const mapped = mappingByRaw.get((p.diet || '').trim().toLowerCase());
      return !isNpoPatient({
        is_npo: p.is_npo,
        status_pasien: p.status_pasien,
        diet: p.diet,
        bentuk_makanan: mapped?.bentuk_makanan,
        kategori_diet: mapped?.kategori_diet,
      });
    });

    // 2. Create batch record with total_pasien reflecting feeding portions
    const [insertedBatch] = await db
      .insert(snapshotBatchTable)
      .values({
        batch_code: batchCode,
        tanggal_produksi: prodDate,
        waktu_makan: waktuMakan,
        timestamp_snapshot: now,
        total_pasien: feedingPatients.length,
        status_batch: 'LOCKED',
        created_by: 'Ahli Gizi Katering (Cut-off Lock)',
        cutoff_time: cutoffTime,
      })
      .returning({ id: snapshotBatchTable.id });

    if (insertedBatch && activePatients.length > 0) {
      // 3. Insert snapshot detail records with exact mapped dietary fields and NPO status
      const snapshotDetails = activePatients.map((p) => {
        const rawDiet = (p.diet || '').trim();
        const mapped = mappingByRaw.get(rawDiet.toLowerCase());
        const isNpo = isNpoPatient({
          is_npo: p.is_npo,
          status_pasien: p.status_pasien,
          diet: p.diet,
          bentuk_makanan: mapped?.bentuk_makanan,
          kategori_diet: mapped?.kategori_diet,
        });

        return {
          batch_id: insertedBatch.id,
          no_rm: p.no_rm,
          nama_pasien: p.nama_pasien,
          gedung: p.gedung,
          ruangan: p.ruangan,
          no_bed: p.bed,
          kelas: p.kelas,
          diet_rs_raw: p.diet,
          bentuk_makanan: isNpo ? 'NPO' : mapped?.bentuk_makanan || null,
          kategori_diet: isNpo ? 'NPO' : mapped?.kategori_diet || null,
          extra: isNpo ? null : mapped?.extra || null,
          buah: isNpo ? null : mapped?.buah || null,
          snack: isNpo ? null : mapped?.snack || null,
          status_saat_snapshot: isNpo ? 'NPO' : p.status_pasien,
          is_emergent: false,
        };
      });

      await db.insert(snapshotDetailTable).values(snapshotDetails);
    }

    if (!skipRevalidate) {
      try {
        revalidatePath('/dashboard/ag-katering/status-snapshot');
        revalidatePath('/dashboard/ag-katering/overview');
        revalidatePath('/dashboard/ag-katering/overview/produksi');
        revalidatePath('/dashboard/ag-katering/overview/pemorsian');
      } catch {
        // Ignore if called in render context
      }
    }

    return {
      success: true,
      message: `Batch snapshot ${batchCode} (Produksi: ${prodDate}) berhasil dibuat dengan ${activePatients.length} pasien ter-lock.`,
    };
  } catch (error) {
    console.error('Error triggering manual snapshot:', error);
    return { success: false, message: 'Gagal membuat snapshot batch.' };
  }
}

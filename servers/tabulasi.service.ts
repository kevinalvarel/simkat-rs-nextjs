'use server';

import { revalidatePath } from 'next/cache';
import { getWibTodayKey } from '@/lib/wib';
import { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import {
  getTabulationBatches as _getTabulationBatches,
  getTabulasiDashboardData as _getTabulasiDashboardData,
} from './tabulasi-makan.service';
import {
  getTabulasiSupplementData as _getTabulasiSupplementData,
  getTabulasiSnackData as _getTabulasiSnackData,
  getTabulasiBuahData as _getTabulasiBuahData,
  getTabulasiSnackBuahData as _getTabulasiSnackBuahData,
} from './tabulasi-snack-buah.service';
import type { TabulasiSupplementKind } from './tabulasi-snack-buah.service';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';

// Re-export inferred DB types
export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type SnapshotDetail = typeof snapshotDetailTable.$inferSelect;
export type { TabulasiSupplementKind };

/** Fetch all snapshot batches ordered by most recent first. */
export async function getTabulationBatches(): Promise<SnapshotBatch[]> {
  return _getTabulationBatches();
}

/** Main dashboard data for Tabulasi Makan Rekapitulasi. */
export async function getTabulasiDashboardData(
  batchId?: number,
  selectedDate?: string,
  mealTime?: string,
): Promise<TabulasiDashboardData> {
  return _getTabulasiDashboardData(batchId, selectedDate, mealTime);
}

/** Core supplement engine for snack or buah tabulation. */
export async function getTabulasiSupplementData(
  kind: TabulasiSupplementKind,
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  return _getTabulasiSupplementData(kind, selectedDate, slot);
}

/** Snack portions from patient's mapped snack field. */
export async function getTabulasiSnackData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  return _getTabulasiSnackData(selectedDate, slot);
}

/** Buah portions from patient's mapped buah field. */
export async function getTabulasiBuahData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  return _getTabulasiBuahData(selectedDate, slot);
}

/** Fetch snack & buah tabulation in one shared round-trip. */
export async function getTabulasiSnackBuahData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<{ snack: TabulasiDashboardData; buah: TabulasiDashboardData }> {
  return _getTabulasiSnackBuahData(selectedDate, slot);
}

/**
 * Server action to generate / refresh tabulasi snapshot.
 */
export async function generateTabulasiAction(
  tanggal: string,
  waktuMakan: string,
): Promise<{ success: boolean; message: string; batchCode?: string }> {
  try {
    const cleanDate = tanggal
      ? tanggal.replace(/-/g, '')
      : getWibTodayKey().replace(/-/g, '');
    const cleanWaktu = (waktuMakan || 'PAGI').toUpperCase();
    const batchCode = `BATCH-${cleanDate}-${cleanWaktu}`;

    revalidatePath('/dashboard/ag-katering/tabulasi');
    return {
      success: true,
      message: `Tabulasi untuk ${cleanWaktu} (${tanggal || 'Hari Ini'}) berhasil di-generate dengan kode ${batchCode}.`,
      batchCode,
    };
  } catch (error) {
    console.error('Error generating tabulasi:', error);
    return {
      success: false,
      message: 'Gagal melakukan generate tabulasi.',
    };
  }
}

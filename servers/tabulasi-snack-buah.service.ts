'use server';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { snapshotDetailTable } from '@/db/schemas/snapshot/snapshot-detail';
import { masterSiklusMenuTable } from '@/db/schemas/master/siklus-menu';
import { dietMappingTable } from '@/db/schemas/master/mapping-diet';
import type { TabulasiDashboardData } from '@/types/tabulasitypes';
import {
  buildRoomBuildingMap,
  resolveTabulasiPatients,
  buildSupplementResult,
} from '@/helper/tabulasi';
import type { TabulasiSupplementKind } from '@/helper/tabulasi';
import { getTabulasiDashboardData } from './tabulasi-makan.service';

export type { TabulasiSupplementKind };

/**
 * Core supplement engine — resolves patient records, mappings, cycle items,
 * and snapshot field data in one round-trip, then delegates to buildSupplementResult.
 *
 * @param kind  'SNACK' | 'BUAH'
 * @param slot  'PAGI' | 'SIANG'
 */
export async function getTabulasiSupplementData(
  kind: TabulasiSupplementKind,
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
  const base = await getTabulasiDashboardData(undefined, targetDate, slot);
  if (!base.success)
    return { ...base, hospitalData: { ...base.hospitalData, waktuMakan: slot } };

  try {
    const { patientRecords } = await resolveTabulasiPatients(
      base.batch,
      targetDate,
      slot,
    );

    const [mappings, cycleItems, roomBuildingMap, snapshotDetails] =
      await Promise.all([
        db
          .select()
          .from(dietMappingTable)
          .where(eq(dietMappingTable.is_active, true)),
        db
          .select()
          .from(masterSiklusMenuTable)
          .where(
            and(
              eq(
                masterSiklusMenuTable.siklus_ke,
                base.hospitalData.siklusNomor,
              ),
              eq(masterSiklusMenuTable.is_active, true),
            ),
          )
          .orderBy(asc(masterSiklusMenuTable.id)),
        buildRoomBuildingMap(),
        base.batch
          ? db
              .select({
                id: snapshotDetailTable.id,
                snack: snapshotDetailTable.snack,
                buah: snapshotDetailTable.buah,
              })
              .from(snapshotDetailTable)
              .where(eq(snapshotDetailTable.batch_id, base.batch.id))
          : Promise.resolve([]),
      ]);

    const snapshotById = new Map(
      snapshotDetails.map((detail) => [
        detail.id,
        kind === 'SNACK' ? detail.snack : detail.buah,
      ]),
    );

    return buildSupplementResult(
      base,
      patientRecords,
      mappings,
      cycleItems,
      roomBuildingMap,
      snapshotById,
      kind,
      slot,
    );
  } catch (error) {
    console.error(`Error in getTabulasiSupplementData (${kind}):`, error);
    return {
      ...base,
      success: false,
      hospitalData: { ...base.hospitalData, categoryGroups: [], allItems: [] },
    };
  }
}

/**
 * Snack portions come from the patient's mapped snack field, not meal dish totals.
 */
export async function getTabulasiSnackData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  return getTabulasiSupplementData('SNACK', selectedDate, slot);
}

/**
 * Buah portions come from the patient's mapped buah field, not meal dish totals.
 */
export async function getTabulasiBuahData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<TabulasiDashboardData> {
  return getTabulasiSupplementData('BUAH', selectedDate, slot);
}

/**
 * Fetch snack & buah tabulation in one round-trip (shared base query).
 * Filter tanggal & slot PAGI/SIANG berlaku untuk keduanya.
 */
export async function getTabulasiSnackBuahData(
  selectedDate?: string,
  slot: 'PAGI' | 'SIANG' = 'PAGI',
): Promise<{ snack: TabulasiDashboardData; buah: TabulasiDashboardData }> {
  const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
  const base = await getTabulasiDashboardData(undefined, targetDate, slot);
  if (!base.success) {
    const empty = {
      ...base,
      hospitalData: { ...base.hospitalData, waktuMakan: slot },
    };
    return { snack: empty, buah: empty };
  }

  try {
    const { patientRecords } = await resolveTabulasiPatients(
      base.batch,
      targetDate,
      slot,
    );

    const [mappings, cycleItems, roomBuildingMap, snapshotDetails] =
      await Promise.all([
        db
          .select()
          .from(dietMappingTable)
          .where(eq(dietMappingTable.is_active, true)),
        db
          .select()
          .from(masterSiklusMenuTable)
          .where(
            and(
              eq(
                masterSiklusMenuTable.siklus_ke,
                base.hospitalData.siklusNomor,
              ),
              eq(masterSiklusMenuTable.is_active, true),
            ),
          )
          .orderBy(asc(masterSiklusMenuTable.id)),
        buildRoomBuildingMap(),
        base.batch
          ? db
              .select({
                id: snapshotDetailTable.id,
                snack: snapshotDetailTable.snack,
                buah: snapshotDetailTable.buah,
              })
              .from(snapshotDetailTable)
              .where(eq(snapshotDetailTable.batch_id, base.batch.id))
          : Promise.resolve([]),
      ]);

    const snackById = new Map(
      snapshotDetails.map((detail) => [detail.id, detail.snack]),
    );
    const buahById = new Map(
      snapshotDetails.map((detail) => [detail.id, detail.buah]),
    );

    return {
      snack: buildSupplementResult(
        base,
        patientRecords,
        mappings,
        cycleItems,
        roomBuildingMap,
        snackById,
        'SNACK',
        slot,
      ),
      buah: buildSupplementResult(
        base,
        patientRecords,
        mappings,
        cycleItems,
        roomBuildingMap,
        buahById,
        'BUAH',
        slot,
      ),
    };
  } catch (error) {
    console.error('Error in getTabulasiSnackBuahData:', error);
    const failed = {
      ...base,
      success: false,
      hospitalData: { ...base.hospitalData, categoryGroups: [], allItems: [] },
    };
    return { snack: failed, buah: failed };
  }
}

import { eq, asc } from 'drizzle-orm';
import { db } from '@/drizzle';
import { masterSiklusTable } from '@/db/schemas/master/siklus-menu';
import { resolveActiveCycleForDate } from '@/lib/siklus-menu-utils';

/**
 * Automatically determine the active menu cycle from a target date
 * using master_siklus rules (rolling rotation + Day-31 special rule).
 */
export async function determineAutomaticMenuCycle(targetDate: string): Promise<{
  activeCycleNum: number;
  activeCycleNama: string;
  availableSiklus: Array<{ nomor_siklus: number; nama_siklus: string }>;
}> {
  const masterCycles = await db
    .select()
    .from(masterSiklusTable)
    .where(eq(masterSiklusTable.is_active, true))
    .orderBy(asc(masterSiklusTable.nomor_siklus));

  const resolved = resolveActiveCycleForDate(targetDate, masterCycles);
  const activeCycleNum = resolved.activeCycleNum;
  const activeCycleNama = resolved.activeCycleNama;

  const availableSiklus =
    masterCycles.length > 0
      ? masterCycles.map((c) => ({
          nomor_siklus: c.nomor_siklus,
          nama_siklus: c.nama_siklus,
        }))
      : Array.from({ length: 10 }, (_, i) => ({
          nomor_siklus: i + 1,
          nama_siklus: `Siklus ${i + 1}`,
        }));

  return { activeCycleNum, activeCycleNama, availableSiklus };
}

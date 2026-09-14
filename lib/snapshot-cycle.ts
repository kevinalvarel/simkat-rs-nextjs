import type { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;
export type MealName = 'PAGI' | 'SIANG' | 'MALAM';
export type WaktuMakanConfig = { id: number; jenis_makan: string; waktu: string };
export type MealCycleStatus = {
  id: number;
  jenis_makan: MealName;
  waktu: string;
  isLocked: boolean;
  isAvailable: boolean;
  isTomorrow: boolean;
  targetDate: string;
  targetDateDisplay: string;
  remainingSeconds: number;
  batch: SnapshotBatch | null;
};

const MEALS: MealName[] = ['PAGI', 'SIANG', 'MALAM'];
const DEFAULT_TIMES: Record<MealName, string> = { PAGI: '05:30', SIANG: '10:30', MALAM: '16:00' };

export function getWibDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getWibMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value || 0);
  return part('hour') * 60 + part('minute');
}

export function addCalendarDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function getNextMealSlot(date: string, meal: MealName): { date: string; meal: MealName } {
  const index = MEALS.indexOf(meal);
  return index === 2 ? { date: addCalendarDays(date, 1), meal: 'PAGI' }
    : { date, meal: MEALS[index + 1] };
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00m 00s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return hrs > 0 ? `${hrs}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
    : `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export function computeMealCycleStatuses(
  configs: WaktuMakanConfig[], batches: SnapshotBatch[] = [], now: Date = new Date(),
): { statuses: MealCycleStatus[]; activeCycle: MealCycleStatus | null; isMalamLocked: boolean; summaryText: string } {
  const today = getWibDate(now);
  const yesterday = addCalendarDays(today, -1);
  const tomorrow = addCalendarDays(today, 1);
  const minutes = getWibMinutes(now);
  const timeFor = (meal: MealName) => configs.find((config) => config.jenis_makan === meal)?.waktu || DEFAULT_TIMES[meal];
  const cutoffMinutes = (meal: MealName) => {
    const [h, m] = timeFor(meal).split(':').map(Number);
    return h * 60 + m;
  };
  const lockedBatch = (date: string, meal: MealName) => batches.find((batch) =>
    batch.tanggal_produksi === date && batch.waktu_makan === meal && batch.status_batch === 'LOCKED',
  ) || null;

  const isMalamLocked = Boolean(lockedBatch(today, 'MALAM'));
  const tomorrowPagiLocked = Boolean(lockedBatch(tomorrow, 'PAGI'));
  const tomorrowSiangLocked = Boolean(lockedBatch(tomorrow, 'SIANG'));
  const tomorrowMalamLocked = Boolean(lockedBatch(tomorrow, 'MALAM'));
  let active: { date: string; meal: MealName };
  if (tomorrowMalamLocked) active = { date: addCalendarDays(tomorrow, 1), meal: 'PAGI' };
  else if (tomorrowSiangLocked) active = { date: tomorrow, meal: 'MALAM' };
  else if (tomorrowPagiLocked) active = { date: tomorrow, meal: 'SIANG' };
  else if (isMalamLocked) active = { date: tomorrow, meal: 'PAGI' };
  else if (lockedBatch(today, 'SIANG')) active = { date: today, meal: 'MALAM' };
  else if (lockedBatch(today, 'PAGI')) active = { date: today, meal: 'SIANG' };
  else if (lockedBatch(yesterday, 'MALAM')) active = { date: today, meal: 'PAGI' };
  else {
    // Bootstrap when there is no recent locked batch.
    active = { date: today, meal: minutes < cutoffMinutes('PAGI') ? 'PAGI'
      : minutes < cutoffMinutes('SIANG') ? 'SIANG' : 'MALAM' };
  }

  const statuses = MEALS.map((meal): MealCycleStatus => {
    const date = tomorrowPagiLocked || tomorrowSiangLocked || tomorrowMalamLocked
      ? active.date === addCalendarDays(tomorrow, 1) && meal === 'PAGI' ? active.date : tomorrow
      : meal === 'PAGI' && isMalamLocked ? tomorrow : today;
    const batch = lockedBatch(date, meal);
    const isAvailable = !batch && active.date === date && active.meal === meal;
    const cutoff = new Date(`${date}T${timeFor(meal).slice(0, 5)}:00+07:00`);
    const remainingSeconds = isAvailable ? Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000)) : 0;
    return {
      id: configs.find((config) => config.jenis_makan === meal)?.id || 0,
      jenis_makan: meal, waktu: timeFor(meal), isLocked: Boolean(batch), isAvailable,
      isTomorrow: date > today, targetDate: date,
      targetDateDisplay: new Date(`${date}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }),
      remainingSeconds, batch,
    };
  });
  const activeCycle = statuses.find((status) => status.isAvailable) || null;
  return { statuses, activeCycle, isMalamLocked,
    summaryText: activeCycle ? `Siklus Aktif Saat Ini: Makan ${activeCycle.jenis_makan}${activeCycle.isTomorrow ? ' (Besok)' : ''}`
      : 'Menunggu batch snapshot sebelumnya terkunci',
  };
}

import type { snapshotBatchTable } from '@/db/schemas/snapshot/snapshot-batch';

export type SnapshotBatch = typeof snapshotBatchTable.$inferSelect;

export type WaktuMakanConfig = {
  id: number;
  jenis_makan: string; // PAGI | SIANG | MALAM
  waktu: string; // HH:mm format
};

export type MealCycleStatus = {
  id: number;
  jenis_makan: string; // 'PAGI' | 'SIANG' | 'MALAM'
  waktu: string; // HH:mm
  isLocked: boolean;
  isTomorrow: boolean;
  targetDate: string; // YYYY-MM-DD
  targetDateDisplay: string; // e.g. "19 Agu 2026"
  remainingSeconds: number;
  batch: SnapshotBatch | null;
};

// Format seconds into readable countdown string (e.g. "08j 24m 12s" or "24m 12s")
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00m 00s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

/**
 * Pure calculation helper for 3 meal cycles (PAGI, SIANG, MALAM).
 * Safe to execute on both client and server (no 'use server' boundary).
 * When today's MALAM cycle is locked (cutoff passed or batch created),
 * the PAGI cycle automatically rolls over to TOMORROW and becomes OPEN/ACTIVE (unlocked).
 */
export function computeMealCycleStatuses(
  configs: WaktuMakanConfig[],
  batches: SnapshotBatch[] = [],
  now: Date = new Date(),
): {
  statuses: MealCycleStatus[];
  activeCycle: MealCycleStatus | null;
  isMalamLocked: boolean;
  summaryText: string;
} {
  const defaultTimes: Record<string, string> = {
    PAGI: '05:30',
    SIANG: '10:30',
    MALAM: '16:00',
  };

  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getCutoffMinutes = (timeStr: string) => {
    const [h, m] = (timeStr || '12:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const malamTime =
    configs.find((c) => c.jenis_makan === 'MALAM')?.waktu || defaultTimes.MALAM;
  const malamCutoffMin = getCutoffMinutes(malamTime);

  // Check if today's MALAM is locked (either passed cutoff or batch exists for today's MALAM)
  const hasTodayMalamBatch = batches.some(
    (b) => b.tanggal_produksi === todayStr && b.waktu_makan === 'MALAM',
  );
  const isMalamLocked = currentMinutes >= malamCutoffMin || hasTodayMalamBatch;

  const formatDateDisplay = (dateObj: Date) => {
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statuses: MealCycleStatus[] = configs.map((config) => {
    const [h, m] = (config.waktu || '12:00').split(':').map(Number);
    const cutoffMinutes = (h || 0) * 60 + (m || 0);

    if (config.jenis_makan === 'PAGI') {
      if (isMalamLocked) {
        // PAGI advances to TOMORROW
        const targetDateObj = new Date(tomorrow);
        targetDateObj.setHours(h || 5, m || 0, 0, 0);

        const tomorrowBatch =
          batches.find(
            (b) =>
              b.tanggal_produksi === tomorrowStr && b.waktu_makan === 'PAGI',
          ) || null;

        const remainingSeconds = Math.max(
          0,
          Math.floor((targetDateObj.getTime() - now.getTime()) / 1000),
        );

        return {
          id: config.id,
          jenis_makan: 'PAGI',
          waktu: config.waktu,
          isLocked: Boolean(tomorrowBatch),
          isTomorrow: true,
          targetDate: tomorrowStr,
          targetDateDisplay: formatDateDisplay(tomorrow),
          remainingSeconds,
          batch: tomorrowBatch,
        };
      } else {
        // PAGI is for TODAY
        const targetDateObj = new Date(now);
        targetDateObj.setHours(h || 5, m || 0, 0, 0);

        const todayBatch =
          batches.find(
            (b) => b.tanggal_produksi === todayStr && b.waktu_makan === 'PAGI',
          ) || null;

        const isCutoffPassed = currentMinutes >= cutoffMinutes;
        const isLocked = isCutoffPassed || Boolean(todayBatch);
        const remainingSeconds = isLocked
          ? 0
          : Math.max(
              0,
              Math.floor((targetDateObj.getTime() - now.getTime()) / 1000),
            );

        return {
          id: config.id,
          jenis_makan: 'PAGI',
          waktu: config.waktu,
          isLocked,
          isTomorrow: false,
          targetDate: todayStr,
          targetDateDisplay: formatDateDisplay(now),
          remainingSeconds,
          batch: todayBatch,
        };
      }
    }

    if (config.jenis_makan === 'SIANG') {
      const targetDateObj = new Date(now);
      targetDateObj.setHours(h || 10, m || 0, 0, 0);

      const todayBatch =
        batches.find(
          (b) => b.tanggal_produksi === todayStr && b.waktu_makan === 'SIANG',
        ) || null;

      const isCutoffPassed = currentMinutes >= cutoffMinutes;
      const isLocked = isCutoffPassed || Boolean(todayBatch);
      const remainingSeconds = isLocked
        ? 0
        : Math.max(
            0,
            Math.floor((targetDateObj.getTime() - now.getTime()) / 1000),
          );

      return {
        id: config.id,
        jenis_makan: 'SIANG',
        waktu: config.waktu,
        isLocked,
        isTomorrow: false,
        targetDate: todayStr,
        targetDateDisplay: formatDateDisplay(now),
        remainingSeconds,
        batch: todayBatch,
      };
    }

    // MALAM
    const targetDateObj = new Date(now);
    targetDateObj.setHours(h || 16, m || 0, 0, 0);

    const todayBatch =
      batches.find(
        (b) => b.tanggal_produksi === todayStr && b.waktu_makan === 'MALAM',
      ) || null;

    const isCutoffPassed = currentMinutes >= cutoffMinutes;
    const isLocked = isCutoffPassed || Boolean(todayBatch);
    const remainingSeconds = isLocked
      ? 0
      : Math.max(
          0,
          Math.floor((targetDateObj.getTime() - now.getTime()) / 1000),
        );

    return {
      id: config.id,
      jenis_makan: 'MALAM',
      waktu: config.waktu,
      isLocked,
      isTomorrow: false,
      targetDate: todayStr,
      targetDateDisplay: formatDateDisplay(now),
      remainingSeconds,
      batch: todayBatch,
    };
  });

  const activeCycle = statuses.find((s) => !s.isLocked) || null;

  return {
    statuses,
    activeCycle,
    isMalamLocked,
    summaryText: isMalamLocked
      ? 'Siklus Malam Terkunci — Siklus Makan Pagi (Besok) Terbuka'
      : activeCycle
        ? `Siklus Aktif Saat Ini: Makan ${activeCycle.jenis_makan}`
        : 'Seluruh Siklus Terkunci',
  };
}

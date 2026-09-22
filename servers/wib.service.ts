'use server';

import { getWibTodayKey, getWibParts } from '@/lib/wib';

/**
 * Jam server sebagai sumber kebenaran tunggal (anti CMOS/browser ngaco).
 * Client pakai ini untuk sinkronisasi awal + re-sync berkala.
 */
export async function getServerWibNow(): Promise<{
  todayKey: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  serverTime: number;
}> {
  const now = new Date();
  const p = getWibParts(now);
  return {
    todayKey: getWibTodayKey(now),
    ...p,
    serverTime: now.getTime(),
  };
}

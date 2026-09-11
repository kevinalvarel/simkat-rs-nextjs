import type { masterSiklusTable } from '@/db/schemas/master/siklus-menu';

export type MasterSiklusRow = typeof masterSiklusTable.$inferSelect;

export interface SimplifiedMasterSiklus {
  id?: number;
  nomor_siklus: number;
  nama_siklus: string;
  hari?: string | null;
  tanggal?: string | null;
  deskripsi?: string | null;
  is_active?: boolean | null;
}

export interface ResolvedCycleResult {
  activeCycleNum: number;
  activeCycleNama: string;
  activeCycleDeskripsi: string;
  isSpecialDay31: boolean;
  cycleIteration: number;
  matchedCycle: SimplifiedMasterSiklus;
}

/**
 * Normalizes dish name: trims, converts to lower case, collapses extra spaces and special punctuation.
 */
export function normalizeDishName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Parses YYYY-MM-DD date string or Date object into year, month (1-12), and day (1-31) in local time.
 */
function extractYearMonthDay(dateInput: Date | string): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
} {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    const dObj = new Date(dateInput);
    return {
      year: dObj.getFullYear(),
      month: dObj.getMonth() + 1,
      day: dObj.getDate(),
    };
  }

  return {
    year: dateInput.getFullYear(),
    month: dateInput.getMonth() + 1,
    day: dateInput.getDate(),
  };
}

/**
 * Automatically determine active menu cycle from target date using continuous auto-looping
 * and PGRS Day 31 special rule (using Siklus 11).
 *
 * Rules:
 * 1. Day 31: If date is 31st of the month, immediately use Siklus 11 (or 31 if numbered 31).
 * 2. Regular rotation: For days 1-30, continuously loops across regular cycles (Siklus 1 - 10)
 *    using calendar day difference from Cycle 1 start date:
 *    cycleIndex = ((diffDays % N) + N) % N
 */
export function resolveActiveCycleForDate(
  targetDate: Date | string,
  allMasterCycles: SimplifiedMasterSiklus[],
): ResolvedCycleResult {
  const { year: tYear, month: tMonth, day: tDay } =
    extractYearMonthDay(targetDate);

  // 1. Day 31 Special Rule: Use Siklus 11 (or Siklus 31 if numbered 31)
  if (tDay === 31) {
    const specialDay31Cycle =
      allMasterCycles.find((c) => c.nomor_siklus === 11) ||
      allMasterCycles.find((c) => c.nomor_siklus === 31);

    if (specialDay31Cycle) {
      return {
        activeCycleNum: specialDay31Cycle.nomor_siklus,
        activeCycleNama: specialDay31Cycle.nama_siklus,
        activeCycleDeskripsi:
          specialDay31Cycle.deskripsi ||
          `Menu khusus tanggal 31 (${specialDay31Cycle.nama_siklus})`,
        isSpecialDay31: true,
        cycleIteration: 1,
        matchedCycle: specialDay31Cycle,
      };
    }
  }

  // 2. Regular Rotation Cycles (filter out special 11 / 31 if regular cycles exist)
  const regularCycles = allMasterCycles
    .filter(
      (c) =>
        c.nomor_siklus !== 11 &&
        c.nomor_siklus !== 31 &&
        c.is_active !== false,
    )
    .sort((a, b) => a.nomor_siklus - b.nomor_siklus);

  // If no regular cycles configured, fallback gracefully
  if (regularCycles.length === 0) {
    const fallback = allMasterCycles[0] || {
      id: 1,
      nomor_siklus: 1,
      nama_siklus: 'Siklus 1',
      deskripsi: 'Siklus Default',
      is_active: true,
    };
    return {
      activeCycleNum: fallback.nomor_siklus,
      activeCycleNama: fallback.nama_siklus,
      activeCycleDeskripsi: fallback.deskripsi || 'Siklus Default',
      isSpecialDay31: false,
      cycleIteration: 1,
      matchedCycle: fallback,
    };
  }

  // 3. Find Anchor Start Date (Cycle 1's starting date)
  let anchorDate: { year: number; month: number; day: number } | null = null;
  const cycle1 = regularCycles.find((c) => c.nomor_siklus === 1);

  if (cycle1?.tanggal) {
    anchorDate = extractYearMonthDay(cycle1.tanggal);
  } else {
    // If Cycle 1 has no date, check any regular cycle with a date
    const anyCycleWithDate = regularCycles.find((c) => Boolean(c.tanggal));
    if (anyCycleWithDate?.tanggal) {
      const parsed = extractYearMonthDay(anyCycleWithDate.tanggal);
      const cycleOffsetDays = anyCycleWithDate.nomor_siklus - 1;
      const refDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
      refDate.setUTCDate(refDate.getUTCDate() - cycleOffsetDays);
      anchorDate = {
        year: refDate.getUTCFullYear(),
        month: refDate.getUTCMonth() + 1,
        day: refDate.getUTCDate(),
      };
    } else {
      // Fallback: Day 1 of target month
      anchorDate = { year: tYear, month: tMonth, day: 1 };
    }
  }

  // 4. Calculate exact day difference between target date and anchor date
  const targetUtc = Date.UTC(tYear, tMonth - 1, tDay);
  const anchorUtc = Date.UTC(anchorDate.year, anchorDate.month - 1, anchorDate.day);
  const diffDays = Math.round((targetUtc - anchorUtc) / (1000 * 60 * 60 * 24));

  const N = regularCycles.length;
  const cycleIndex = ((diffDays % N) + N) % N;
  const cycleIteration = Math.floor(diffDays / N) + 1;
  const matchedCycle = regularCycles[cycleIndex];

  return {
    activeCycleNum: matchedCycle.nomor_siklus,
    activeCycleNama: matchedCycle.nama_siklus,
    activeCycleDeskripsi:
      matchedCycle.deskripsi ||
      `Siklus menu ${matchedCycle.nama_siklus} (Rotasi Berulang #${cycleIteration})`,
    isSpecialDay31: false,
    cycleIteration,
    matchedCycle,
  };
}

export interface ConsolidableMenuItem {
  id: number | string;
  siklus_ke: number;
  kelas: string;
  jenis_makanan: string;
  waktu_makan: string;
  nama_makanan: string;
  kategori_menu?: string | null;
  catatan?: string | null;
  urutan?: number | null;
  is_active?: boolean | null;
}

/**
 * Consolidates slot menu items where identical dishes span multiple categories
 * (e.g. LOAF AYAM TAHU entered in both HEWANI and NABATI slots for the same class).
 * Merges them into a single entry with combined category (e.g. "HEWANI & NABATI").
 */
export function consolidateSlotMenuItems<T extends ConsolidableMenuItem>(items: T[]): T[] {
  if (!items || items.length === 0) return [];

  const mergedItems: T[] = [];
  const handledIds = new Set<string | number>();

  for (let i = 0; i < items.length; i++) {
    const itemA = items[i];
    if (handledIds.has(itemA.id)) continue;

    const normNameA = normalizeDishName(itemA.nama_makanan);
    const jmA = (itemA.jenis_makanan || '').toUpperCase().trim();
    const klA = (itemA.kelas || '').toUpperCase().trim();

    // Only look for pairs if this is one of HEWANI, NABATI, SAYUR
    if (jmA === 'HEWANI' || jmA === 'NABATI') {
      const partnerIndex = items.findIndex((itemB, idx) => {
        if (idx === i || handledIds.has(itemB.id)) return false;
        const jmB = (itemB.jenis_makanan || '').toUpperCase().trim();
        const klB = (itemB.kelas || '').toUpperCase().trim();
        const normNameB = normalizeDishName(itemB.nama_makanan);

        const isPairCategory =
          (jmA === 'HEWANI' && jmB === 'NABATI') ||
          (jmA === 'NABATI' && jmB === 'SAYUR') ||
          (jmA === 'HEWANI' && jmB === 'SAYUR');

        if (!isPairCategory) return false;
        if (normNameA !== normNameB) return false;
        if (klA !== klB) return false;

        return true;
      });

      if (partnerIndex !== -1) {
        const itemB = items[partnerIndex];
        handledIds.add(itemA.id);
        handledIds.add(itemB.id);

        const jmB = (itemB.jenis_makanan || '').toUpperCase().trim();
        let combinedCategory = `${jmA} & ${jmB}`;
        if (jmA === 'HEWANI' && jmB === 'NABATI') combinedCategory = 'HEWANI & NABATI';
        else if (jmA === 'NABATI' && jmB === 'SAYUR') combinedCategory = 'NABATI & SAYUR';
        else if (jmA === 'HEWANI' && jmB === 'SAYUR') combinedCategory = 'HEWANI & SAYUR';

        mergedItems.push({
          ...itemA,
          id: `${itemA.id}_${itemB.id}`,
          jenis_makanan: combinedCategory,
          catatan: itemA.catatan || itemB.catatan || `Lauk gabungan ${combinedCategory}`,
        });
        continue;
      }
    }

    handledIds.add(itemA.id);
    mergedItems.push(itemA);
  }

  return mergedItems;
}

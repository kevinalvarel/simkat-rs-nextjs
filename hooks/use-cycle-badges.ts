'use client';

import * as React from 'react';
import { getMasterSiklusList } from '@/servers/siklus-menu.service';
import {
  getCycleNumForDate,
  type SimplifiedMasterSiklus,
} from '@/lib/siklus-menu-utils';

/**
 * Menyediakan resolver tanggal → nomor siklus untuk badge `Calendar`.
 * - Jika `externalCycles` diberikan (mis. halaman konfigurasi), dipakai langsung.
 * - Jika tidak, fetch sekali dari `getMasterSiklusList()` (DPMP / Etiket).
 * Mengikuti anchor Siklus 1 yang customizable karena memakai
 * `resolveActiveCycleForDate` di setiap pemanggilan.
 */
export function useCycleBadges(
  externalCycles?: SimplifiedMasterSiklus[] | null,
) {
  const [fetchedCycles, setFetchedCycles] = React.useState<
    SimplifiedMasterSiklus[] | null
  >(null);

  React.useEffect(() => {
    if (externalCycles && externalCycles.length > 0) return;
    let cancelled = false;
    getMasterSiklusList()
      .then((rows) => {
        if (!cancelled) setFetchedCycles(rows);
      })
      .catch(() => {
        if (!cancelled) setFetchedCycles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [externalCycles]);

  const cycles =
    externalCycles && externalCycles.length > 0
      ? externalCycles
      : (fetchedCycles ?? []);

  const getCycleForDate = React.useCallback(
    (date: Date) => getCycleNumForDate(date, cycles),
    [cycles],
  );

  return { cycles, getCycleForDate, isLoaded: cycles.length > 0 };
}

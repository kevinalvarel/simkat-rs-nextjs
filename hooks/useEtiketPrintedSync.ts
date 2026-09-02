'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export function getEtiketStorageKey(batchCode?: string | null): string {
  const code = batchCode || 'LIVE';
  return `simkat_etiket_printed_${code}`;
}

export const ETIKET_PRINTED_SYNC_EVENT = 'simkat-etiket-printed-updated';

function readPrintedIdsFromStorage(key: string): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to read printed status from localStorage:', e);
  }
  return new Set();
}

export function useEtiketPrintedSync(batchCode?: string | null) {
  const storageKey = useMemo(() => getEtiketStorageKey(batchCode), [batchCode]);
  const [printedPatientIds, setPrintedPatientIds] = useState<Set<number>>(() =>
    readPrintedIdsFromStorage(storageKey),
  );

  const loadFromStorage = useCallback(() => {
    const ids = readPrintedIdsFromStorage(storageKey);
    setPrintedPatientIds(ids);
  }, [storageKey]);

  useEffect(() => {
    // Sync on mount or when storageKey changes
    const timer = setTimeout(() => {
      loadFromStorage();
    }, 0);

    // Listen for storage events across browser tabs/windows
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loadFromStorage();
      }
    };

    // Listen for custom events across page navigation within the same tab
    const handleCustomSync = () => {
      loadFromStorage();
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener(ETIKET_PRINTED_SYNC_EVENT, handleCustomSync);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener(ETIKET_PRINTED_SYNC_EVENT, handleCustomSync);
    };
  }, [storageKey, loadFromStorage]);

  const savePrintedIds = useCallback(
    (newSet: Set<number>) => {
      setPrintedPatientIds(newSet);
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
        window.dispatchEvent(new Event(ETIKET_PRINTED_SYNC_EVENT));
      } catch (e) {
        console.warn('Failed to save printed status to localStorage:', e);
      }
    },
    [storageKey],
  );

  const markIdsAsPrinted = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      setPrintedPatientIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
            window.dispatchEvent(new Event(ETIKET_PRINTED_SYNC_EVENT));
          } catch (e) {
            console.warn('Failed to save printed status to localStorage:', e);
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  const togglePrintedStatus = useCallback(
    (id: number) => {
      setPrintedPatientIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
            window.dispatchEvent(new Event(ETIKET_PRINTED_SYNC_EVENT));
          } catch (e) {
            console.warn('Failed to save printed status to localStorage:', e);
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  return {
    printedPatientIds,
    setPrintedPatientIds,
    savePrintedIds,
    markIdsAsPrinted,
    togglePrintedStatus,
    storageKey,
  };
}

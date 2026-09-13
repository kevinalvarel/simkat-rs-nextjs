'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  MonitoringSummary,
  OverviewProductionClientProps,
} from '@/types/monitoringtypes';
import { getLiveMonitoringData } from '@/servers/overview.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import OverviewProductionHeader from './OverviewProductionHeader';
import OverviewProductionCardsGrid from './OverviewProductionCardsGrid';

const AUTO_SYNC_INTERVAL_MS = 60000; // 60 seconds background keep-fresh interval

export default function OverviewProductionClient({
  initialData,
}: OverviewProductionClientProps) {
  const [data, setData] = useState<MonitoringSummary>(initialData);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Keep a ref to prevent concurrent background fetch calls
  const isFetchingRef = useRef(false);

  // 1. Digital Clock update interval (1 second)
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch live data helper (silent background sync, tanpa tombol manual)
  const fetchLiveData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const live = await getLiveMonitoringData();
      if (live && live.success !== false) {
        setData(live);
      }
    } catch (err) {
      console.error('Error fetching live monitoring data:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Keep local state in sync if parent RSC passes new initialData
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // 3. Periodic Background Auto-Sync Polling
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll in background if document is visible to save battery/bandwidth
      if (document.visibilityState === 'visible') {
        fetchLiveData();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // 4. Tab Visibility & Window Focus Handlers (instant sync when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveData();
      }
    };

    const handleWindowFocus = () => {
      fetchLiveData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchLiveData]);

  // 5. Cross-Tab Synchronization Subscription (BroadcastChannel)
  useEffect(() => {
    const unsubscribe = listenProductionUpdate((msg) => {
      console.debug('Received real-time production sync message:', msg);
      fetchLiveData();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLiveData]);

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* Banner TV: waktu makan + siklus + jam sekarang + jam kunci */}
      <OverviewProductionHeader
        waktuMakan={data.waktuMakan}
        hari={data.hari}
        tanggalProduksi={data.tanggalProduksi}
        tanggalFormatted={data.tanggalFormatted}
        siklusKe={data.siklusKe}
        namaSiklus={data.namaSiklus}
        currentTime={currentTime}
        cutoffTime={data.cutoffTime}
        totalPasien={data.totalPasien}
        totalPorsi={data.totalPorsi}
      />

      {/* Grid hidangan sederhana untuk TV */}
      <OverviewProductionCardsGrid cards={data.cards} />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  MonitoringSummary,
  OverviewProductionClientProps,
} from '@/types/monitoringtypes';
import { getLiveMonitoringData } from '@/servers/overview.service';
import { listenProductionUpdate } from '@/lib/realtime-sync';
import OverviewProductionHeader from './OverviewProductionHeader';
import OverviewProductionSidebar from './OverviewProductionSidebar';
import OverviewProductionCardsGrid from './OverviewProductionCardsGrid';
import OverviewProductionLegend from './OverviewProductionLegend';

const AUTO_SYNC_INTERVAL_MS = 60000; // 60 seconds background keep-fresh interval

export default function OverviewProductionClient({
  initialData,
}: OverviewProductionClientProps) {
  const [data, setData] = useState<MonitoringSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    initialData.lastUpdated || new Date().toLocaleTimeString('id-ID'),
  );

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

  // 2. Fetch live data helper (supports both manual & silent background sync)
  const fetchLiveData = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) {
      setIsRefreshing(true);
    }

    try {
      const live = await getLiveMonitoringData();
      if (live && live.success !== false) {
        setData(live);
        setLastSyncedAt(
          live.lastUpdated || new Date().toLocaleTimeString('id-ID'),
        );
      }
    } catch (err) {
      console.error('Error fetching live monitoring data:', err);
    } finally {
      isFetchingRef.current = false;
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Keep local state in sync if parent RSC passes new initialData
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLastSyncedAt(
        initialData.lastUpdated || new Date().toLocaleTimeString('id-ID'),
      );
    }
  }, [initialData]);

  // 3. Periodic Background Auto-Sync Polling (every 5 seconds)
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const interval = setInterval(() => {
      // Only poll in background if document is visible to save battery/bandwidth
      if (document.visibilityState === 'visible') {
        fetchLiveData(false);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, fetchLiveData]);

  // 4. Tab Visibility & Window Focus Handlers (instant sync when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveData(false);
      }
    };

    const handleWindowFocus = () => {
      fetchLiveData(false);
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
      fetchLiveData(false);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLiveData]);

  // 6. Manual Refresh Handler
  async function handleRefresh() {
    await fetchLiveData(true);
  }

  // 7. Toggle Auto-Sync
  function handleToggleAutoSync() {
    setIsAutoSyncEnabled((prev) => !prev);
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header & Live Indicator with Real-Time Controls */}
      <OverviewProductionHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        isAutoSyncEnabled={isAutoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
        lastSyncedAt={lastSyncedAt}
      />

      {/* 2. Main Live Production Dashboard Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-5 items-start w-full'>
        {/* Left Side: Live Production Sidebar */}
        <OverviewProductionSidebar
          waktuMakan={data.waktuMakan}
          currentTime={currentTime}
          cutoffTime={data.cutoffTime}
          tanggalProduksi={data.tanggalProduksi}
          siklusKe={data.siklusKe}
          namaSiklus={data.namaSiklus}
          hari={data.hari}
          tanggalFormatted={data.tanggalFormatted}
          totalPasien={data.totalPasien}
          totalPorsi={data.totalPorsi}
        />

        {/* Right Side: Mapped Diet Distribution Cards Grid */}
        <OverviewProductionCardsGrid
          cards={data.cards}
          cutoffTime={data.cutoffTime}
        />
      </div>

      {/* 3. Legend & Help Section */}
      <OverviewProductionLegend
        lastUpdated={lastSyncedAt || data.lastUpdated}
      />
    </div>
  );
}

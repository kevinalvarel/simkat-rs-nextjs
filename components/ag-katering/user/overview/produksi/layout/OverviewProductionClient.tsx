'use client';

import React, { useState, useEffect } from 'react';
import type {
  MonitoringSummary,
  OverviewProductionClientProps,
} from '@/types/monitoringtypes';
import { getLiveMonitoringData } from '@/servers/overview.service';
import OverviewProductionHeader from './OverviewProductionHeader';
import OverviewProductionSidebar from './OverviewProductionSidebar';
import OverviewProductionCardsGrid from './OverviewProductionCardsGrid';
import OverviewProductionLegend from './OverviewProductionLegend';

export default function OverviewProductionClient({
  initialData,
}: OverviewProductionClientProps) {
  const [data, setData] = useState<MonitoringSummary>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

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

  // Keep local state in sync with server-revalidated initialData prop
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const live = await getLiveMonitoringData();
      setData(live);
    } catch (err) {
      console.error('Error polling monitoring data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header & Live Indicator */}
      <OverviewProductionHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* 2. Main Live Production Dashboard Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full'>
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
      <OverviewProductionLegend lastUpdated={data.lastUpdated} />
    </div>
  );
}

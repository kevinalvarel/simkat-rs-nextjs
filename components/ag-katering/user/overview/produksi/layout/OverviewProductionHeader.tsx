'use client';

import React from 'react';
import { Activity, RefreshCw, Pause, Play, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OverviewProductionHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  lastSyncedAt?: string;
}

export default function OverviewProductionHeader({
  isRefreshing,
  onRefresh,
  isAutoSyncEnabled = true,
  onToggleAutoSync,
  lastSyncedAt,
}: OverviewProductionHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      <div className='space-y-1'>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          <Activity className='w-6 h-6 text-primary animate-pulse' />
          Dashboard Pemantauan Live - Produksi
        </h1>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Layar monitoring real-time akumulasi porsi hidangan dari Siklus Menu
          aktif berdasarkan diet & kelas pasien.
        </p>
      </div>

      {/* Live Status indicator & Sync Controls */}
      <div className='flex items-center flex-wrap gap-2.5 self-start sm:self-auto shrink-0'>
        {/* Manual Refresh Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='h-8 px-2.5 text-xs rounded-xl gap-1.5 bg-background hover:bg-muted cursor-pointer shadow-2xs disabled:opacity-50'
          title='Perbarui data sekarang'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-primary ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span className='hidden sm:inline text-[11px] font-medium'>
            Refresh
          </span>
        </Button>
      </div>
    </div>
  );
}

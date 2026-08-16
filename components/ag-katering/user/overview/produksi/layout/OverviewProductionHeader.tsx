import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface OverviewProductionHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function OverviewProductionHeader({
  isRefreshing,
  onRefresh,
}: OverviewProductionHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      <div className='space-y-1'>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          <Activity className='w-6 h-6 text-primary animate-pulse' />
          Dashboard Pemantauan Live - Produksi
        </h1>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Layar monitoring real-time akumulasi porsi menu & diet aktif pasien
          berdasarkan hasil mapping.
        </p>
      </div>

      {/* Live Status indicator */}
      <div className='flex items-center gap-2.5 bg-background border rounded-xl px-4 py-2 self-start sm:self-auto shrink-0 shadow-2xs'>
        <div className='relative flex h-2 w-2'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
        </div>
        <span className='text-xs text-muted-foreground font-medium'>
          Live Monitoring
        </span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className='p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors ml-1 cursor-pointer disabled:opacity-50'
          title='Refresh manual'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

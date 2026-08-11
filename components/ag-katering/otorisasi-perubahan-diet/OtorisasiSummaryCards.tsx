'use client';

import React from 'react';
import type { OtorisasiStats } from '@/servers/otorisasi-diet.service';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, CheckCircle2, XCircle, PlusCircle } from 'lucide-react';

interface OtorisasiSummaryCardsProps {
  stats: OtorisasiStats;
}

export default function OtorisasiSummaryCards({ stats }: OtorisasiSummaryCardsProps) {
  return (
    <div className='grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0'>
      {/* 1. Menunggu Otorisasi (Pending Queue) */}
      <Card className='border-l-4 border-l-amber-500 shadow-xs transition-all hover:shadow-md min-w-0 w-full bg-amber-500/5 dark:bg-amber-950/20'>
        <CardContent className='p-3.5 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider truncate'>
              Menunggu Otorisasi
            </p>
            <h3 className='text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 truncate'>
              {stats.pendingCount}
            </h3>
            <p className='text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5 truncate'>
              Antrean persetujuan Admin
            </p>
          </div>
          <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200'>
            <ShieldAlert className='w-4 h-4 sm:w-5 sm:h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 2. Disetujui (Approved) */}
      <Card className='border-l-4 border-l-emerald-500 shadow-xs transition-all hover:shadow-md min-w-0 w-full'>
        <CardContent className='p-3.5 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate'>
              Disetujui (Approved)
            </p>
            <h3 className='text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate'>
              {stats.approvedTodayCount}
            </h3>
            <p className='text-[11px] text-emerald-700/75 dark:text-emerald-400/80 mt-0.5 truncate'>
              Diteruskan ke produksi
            </p>
          </div>
          <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
            <CheckCircle2 className='w-4 h-4 sm:w-5 sm:h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 3. Ditolak (Rejected) */}
      <Card className='border-l-4 border-l-rose-500 shadow-xs transition-all hover:shadow-md min-w-0 w-full'>
        <CardContent className='p-3.5 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate'>
              Ditolak (Rejected)
            </p>
            <h3 className='text-xl sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1 truncate'>
              {stats.rejectedTodayCount}
            </h3>
            <p className='text-[11px] text-rose-700/75 dark:text-rose-400/80 mt-0.5 truncate'>
              Pengajuan tidak valid
            </p>
          </div>
          <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0'>
            <XCircle className='w-4 h-4 sm:w-5 sm:h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Emergent Request */}
      <Card className='border-l-4 border-l-blue-500 shadow-xs transition-all hover:shadow-md min-w-0 w-full'>
        <CardContent className='p-3.5 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate'>
              Emergent Pasien Baru
            </p>
            <h3 className='text-xl sm:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 truncate'>
              +{stats.totalEmergentCount}
            </h3>
            <p className='text-[11px] text-muted-foreground mt-0.5 truncate'>
              Tambahan porsi darurat
            </p>
          </div>
          <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
            <PlusCircle className='w-4 h-4 sm:w-5 sm:h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

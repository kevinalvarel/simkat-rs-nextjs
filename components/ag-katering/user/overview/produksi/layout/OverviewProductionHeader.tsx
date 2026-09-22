'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Lock, Soup, Users } from 'lucide-react';
import { formatIndoFull } from '@/lib/wib';

interface OverviewProductionHeaderProps {
  waktuMakan: string;
  hari: string;
  tanggalProduksi: string;
  tanggalFormatted?: string;
  siklusKe?: number;
  namaSiklus?: string;
  currentTime: string;
  cutoffTime: string;
  totalPasien?: number;
  totalPorsi?: number;
}

export default function OverviewProductionHeader({
  waktuMakan,
  hari,
  tanggalProduksi,
  tanggalFormatted,
  siklusKe = 1,
  namaSiklus = 'Siklus 1',
  currentTime,
  cutoffTime,
  totalPasien = 0,
  totalPorsi = 0,
}: OverviewProductionHeaderProps) {
  const displayDate =
    tanggalFormatted || (tanggalProduksi ? formatIndoFull(tanggalProduksi) : '-');

  return (
    <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 rounded-2xl border border-primary/20 shadow-xs'>
      <div className='flex flex-col xl:flex-row xl:items-center gap-5 justify-between'>
        {/* Kiri: waktu makan + siklus */}
        <div className='space-y-2 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='inline-flex items-center gap-1.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground uppercase'>
              <Soup className='w-7 h-7 text-primary' />
              Makan {waktuMakan}
            </span>
            <Badge
              variant='secondary'
              className='text-xs font-bold bg-primary/10 text-primary border border-primary/20'
            >
              {namaSiklus} (#{siklusKe})
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground font-medium'>
            {hari} • {displayDate}
          </p>
          {(totalPasien > 0 || totalPorsi > 0) && (
            <p className='text-xs text-muted-foreground font-medium flex items-center gap-1.5'>
              <Users className='w-3.5 h-3.5' />
              {totalPasien} pasien • {totalPorsi} porsi
            </p>
          )}
        </div>

        {/* Kanan: jam sekarang + jam kunci */}
        <div className='grid grid-cols-2 gap-3 w-full xl:w-auto xl:min-w-[420px]'>
          <div className='bg-background/80 border rounded-2xl p-4 text-center shadow-2xs'>
            <span className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground'>
              <Clock className='w-3.5 h-3.5' />
              Jam Saat Ini
            </span>
            <div className='font-mono text-2xl sm:text-3xl font-black text-foreground mt-1'>
              {currentTime || '00:00:00'}
            </div>
            <div className='text-[11px] text-muted-foreground font-medium'>
              WIB
            </div>
          </div>

          <div className='bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-center shadow-2xs'>
            <span className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300'>
              <Lock className='w-3.5 h-3.5' />
              Kunci Snapshot
            </span>
            <div className='font-mono text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1'>
              {cutoffTime} WIB
            </div>
            <div className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium'>
              Makan {waktuMakan}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

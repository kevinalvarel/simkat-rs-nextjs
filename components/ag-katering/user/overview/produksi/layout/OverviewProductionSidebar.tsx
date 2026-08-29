'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Soup,
  CalendarDays,
  UtensilsCrossed,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import OverviewClockCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewClockCard';
import OverviewNextSnapshotCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewNextSnapshotCard';

interface OverviewProductionSidebarProps {
  waktuMakan: string;
  currentTime: string;
  cutoffTime: string;
  tanggalProduksi: string;
  siklusKe?: number;
  namaSiklus?: string;
  hari?: string;
  tanggalFormatted?: string;
  totalPasien?: number;
  totalPorsi?: number;
}

export default function OverviewProductionSidebar({
  waktuMakan,
  currentTime,
  cutoffTime,
  tanggalProduksi,
  siklusKe = 1,
  namaSiklus = 'Siklus 1',
  hari = 'SENIN',
  tanggalFormatted,
  totalPasien = 0,
  totalPorsi = 0,
}: OverviewProductionSidebarProps) {
  const displayDate =
    tanggalFormatted ||
    (tanggalProduksi
      ? new Date(tanggalProduksi).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-');

  return (
    <Card className='lg:col-span-1 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs rounded-2xl flex flex-col justify-between p-5 text-center'>
      <div className='space-y-4'>
        {/* Title & Waktu Makan */}
        <div className='space-y-1'>
          <span className='inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'>
            <Sparkles className='w-3 h-3 text-emerald-500' /> Live Produksi
          </span>
          <h3 className='text-sm font-extrabold text-foreground uppercase tracking-wider leading-tight'>
            Makan {waktuMakan}
          </h3>
        </div>

        {/* Icon Animation */}
        <div className='flex justify-center py-1 text-emerald-600 dark:text-emerald-400'>
          <Soup
            className='w-10 h-10 stroke-[1.5] animate-bounce'
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* ─── Keterangan Hari & Siklus Menu Saat Ini ─── */}
        <div className='bg-background/80 dark:bg-background/40 backdrop-blur-xs border border-emerald-500/25 rounded-xl p-3 text-left space-y-2.5 shadow-2xs'>
          {/* Hari & Tanggal */}
          <div className='flex items-start gap-2.5'>
            <div className='w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5'>
              <CalendarDays className='w-4 h-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block leading-tight'>
                Hari Produksi
              </span>
              <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                <span className='text-xs font-bold text-foreground'>
                  {hari}
                </span>
                <span className='text-[11px] text-muted-foreground truncate'>
                  ({displayDate.split(',')[1]?.trim() || displayDate})
                </span>
              </div>
            </div>
          </div>

          {/* Siklus Menu Aktif */}
          <div className='flex items-start gap-2.5 pt-2 border-t border-dashed border-emerald-500/20'>
            <div className='w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5'>
              <UtensilsCrossed className='w-4 h-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block leading-tight'>
                Siklus Menu Aktif
              </span>
              <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                <span className='text-xs font-extrabold text-primary'>
                  {namaSiklus}
                </span>
                <Badge
                  variant='secondary'
                  className='text-[9px] px-1.5 py-0 h-4 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                >
                  Siklus #{siklusKe}
                </Badge>
              </div>
            </div>
          </div>

          {/* Patient summary badge */}
          {totalPasien > 0 && (
            <div className='flex items-center justify-between text-[11px] pt-2 border-t border-dashed border-emerald-500/20 text-muted-foreground font-medium'>
              <span className='flex items-center gap-1'>
                <Users className='w-3 h-3 text-emerald-600 dark:text-emerald-400' />
                Pasien Terlayani:
              </span>
              <span className='font-bold text-foreground'>
                {totalPasien} orang
              </span>
            </div>
          )}
        </div>

        {/* Jam Saat Ini */}
        <OverviewClockCard currentTime={currentTime} />

        {/* Snapshot Selanjutnya */}
        <OverviewNextSnapshotCard
          cutoffTime={cutoffTime}
          waktuMakan={waktuMakan}
          tanggalProduksi={tanggalProduksi}
        />
      </div>

      <div className='mt-4 pt-4 border-t border-dashed border-emerald-500/20 space-y-2'>
        <div className='inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 w-fit mx-auto'>
          <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse'></span>
          LIVE MONITORING
        </div>

        <p className='text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto'>
          Data hidangan disesuaikan otomatis mengikuti siklus menu & perubahan diet pasien
        </p>
      </div>
    </Card>
  );
}

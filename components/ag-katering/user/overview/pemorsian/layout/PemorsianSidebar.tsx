'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatIndoFull } from '@/lib/wib';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  CalendarDays,
  UtensilsCrossed,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PemorsianSidebarProps {
  waktuMakan: string;
  tanggalProduksi?: string;
  siklusKe?: number;
  namaSiklus?: string;
  hari?: string;
  tanggalFormatted?: string;
  sudahDicetakCount?: number;
  belumDicetakCount?: number;
  butuhRevisiCount?: number;
  statusBatch?: 'LIVE' | 'LOCKED';
  onFilterStatusClick?: (
    status: 'ALL' | 'BELUM_DICETAK' | 'SUDAH_DICETAK' | 'BUTUH_REVISI',
  ) => void;
  activeStatusFilter?: string;
}

export default function PemorsianSidebar({
  waktuMakan,
  tanggalProduksi,
  siklusKe = 1,
  namaSiklus = 'Siklus 1',
  hari = 'SENIN',
  tanggalFormatted,
  sudahDicetakCount = 0,
  belumDicetakCount = 0,
  butuhRevisiCount = 0,
  statusBatch = 'LIVE',
  onFilterStatusClick,
  activeStatusFilter = 'ALL',
}: PemorsianSidebarProps) {
  const displayDate =
    tanggalFormatted || (tanggalProduksi ? formatIndoFull(tanggalProduksi) : '-');

  return (
    <Card className='lg:col-span-1 border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-xs rounded-2xl flex flex-col justify-between p-4 sm:p-5 text-center'>
      <div className='space-y-4'>
        {/* Title & Waktu Makan */}
        <div className='space-y-1.5'>
          <span className='inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20'>
            <Sparkles className='w-3 h-3 text-primary' /> Live Pemorsian
          </span>
          <h3 className='text-sm font-extrabold text-foreground uppercase tracking-wider leading-tight'>
            Makan {waktuMakan}
          </h3>
          <div className='flex justify-center'>
            {statusBatch === 'LOCKED' ? (
              <Badge
                variant='outline'
                className='text-[10px] font-semibold text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 bg-blue-500/10'
              >
                <Lock className='w-2.5 h-2.5' /> Snapshot Terkunci
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 bg-emerald-500/10'
              >
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />{' '}
                Live Pre-Snapshot
              </Badge>
            )}
          </div>
        </div>

        {/* Animated Icon */}
        <div className='flex justify-center py-1 text-primary'>
          <Printer
            className='w-9 h-9 stroke-[1.5] animate-bounce'
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* ─── Keterangan Hari & Siklus Menu Saat Ini ─── */}
        <div className='bg-background/80 dark:bg-background/40 backdrop-blur-xs border border-primary/25 rounded-xl p-3 text-left space-y-2.5 shadow-2xs'>
          {/* Hari & Tanggal */}
          <div className='flex items-start gap-2.5'>
            <div className='w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5'>
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
          <div className='flex items-start gap-2.5 pt-2 border-t border-dashed border-primary/20'>
            <div className='w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5'>
              <UtensilsCrossed className='w-4 h-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <span className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block leading-tight'>
                Siklus Menu Aktif
              </span>
              <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                <span className='text-xs font-extrabold text-foreground'>
                  {namaSiklus}
                </span>
                <Badge
                  variant='secondary'
                  className='text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30'
                >
                  Siklus #{siklusKe}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3 CARD KETERANGAN: SUDAH CETAK, BELUM CETAK, BUTUH REVISI (SHADCN) ─── */}
        <div className='space-y-2.5 pt-1'>
          {/* 1. Card Sudah Cetak */}
          <Card
            role='button'
            tabIndex={0}
            onClick={() =>
              onFilterStatusClick?.(
                activeStatusFilter === 'SUDAH_DICETAK' ? 'ALL' : 'SUDAH_DICETAK',
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFilterStatusClick?.(
                  activeStatusFilter === 'SUDAH_DICETAK' ? 'ALL' : 'SUDAH_DICETAK',
                );
              }
            }}
            className={`cursor-pointer transition-all duration-200 border text-left p-3.5 rounded-xl shadow-2xs hover:shadow-xs select-none ${
              activeStatusFilter === 'SUDAH_DICETAK'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40'
                : 'bg-background/90 dark:bg-background/50 hover:bg-emerald-500/5 border-border/80 hover:border-emerald-500/40'
            }`}
          >
            <CardContent className='p-0 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2.5 min-w-0'>
                <div className='w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
                  <CheckCircle2 className='w-4 h-4' />
                </div>
                <div className='min-w-0'>
                  <span className='text-xs font-bold text-foreground block truncate'>
                    Sudah Cetak
                  </span>
                  <span className='text-[10px] text-muted-foreground block truncate'>
                    Etiket selesai dicetak
                  </span>
                </div>
              </div>
              <div className='text-right shrink-0'>
                <span className='text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400'>
                  {sudahDicetakCount}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. Card Belum Cetak */}
          <Card
            role='button'
            tabIndex={0}
            onClick={() =>
              onFilterStatusClick?.(
                activeStatusFilter === 'BELUM_DICETAK' ? 'ALL' : 'BELUM_DICETAK',
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFilterStatusClick?.(
                  activeStatusFilter === 'BELUM_DICETAK' ? 'ALL' : 'BELUM_DICETAK',
                );
              }
            }}
            className={`cursor-pointer transition-all duration-200 border text-left p-3.5 rounded-xl shadow-2xs hover:shadow-xs select-none ${
              activeStatusFilter === 'BELUM_DICETAK'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 dark:bg-amber-950/40'
                : 'bg-background/90 dark:bg-background/50 hover:bg-amber-500/5 border-border/80 hover:border-amber-500/40'
            }`}
          >
            <CardContent className='p-0 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2.5 min-w-0'>
                <div className='w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0'>
                  <Clock className='w-4 h-4' />
                </div>
                <div className='min-w-0'>
                  <span className='text-xs font-bold text-foreground block truncate'>
                    Belum Cetak
                  </span>
                  <span className='text-[10px] text-muted-foreground block truncate'>
                    Menunggu proses cetak
                  </span>
                </div>
              </div>
              <div className='text-right shrink-0'>
                <span className='text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400'>
                  {belumDicetakCount}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Card Butuh Revisi */}
          <Card
            role='button'
            tabIndex={0}
            onClick={() =>
              onFilterStatusClick?.(
                activeStatusFilter === 'BUTUH_REVISI' ? 'ALL' : 'BUTUH_REVISI',
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFilterStatusClick?.(
                  activeStatusFilter === 'BUTUH_REVISI' ? 'ALL' : 'BUTUH_REVISI',
                );
              }
            }}
            className={`cursor-pointer transition-all duration-200 border text-left p-3.5 rounded-xl shadow-2xs hover:shadow-xs select-none ${
              activeStatusFilter === 'BUTUH_REVISI'
                ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30 dark:bg-rose-950/40'
                : 'bg-background/90 dark:bg-background/50 hover:bg-rose-500/5 border-border/80 hover:border-rose-500/40'
            }`}
          >
            <CardContent className='p-0 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2.5 min-w-0'>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    butuhRevisiCount > 0
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <AlertTriangle className='w-4 h-4' />
                </div>
                <div className='min-w-0'>
                  <span className='text-xs font-bold text-foreground block truncate'>
                    Butuh Revisi
                  </span>
                  <span className='text-[10px] text-muted-foreground block truncate'>
                    Perubahan diet pasca-snapshot
                  </span>
                </div>
              </div>
              <div className='text-right shrink-0'>
                <span
                  className={`text-xl sm:text-2xl font-extrabold font-mono ${
                    butuhRevisiCount > 0
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {butuhRevisiCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Pill */}
      <div className='mt-4 pt-3 border-t border-dashed border-primary/20 space-y-1.5'>
        <div className='inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 w-fit mx-auto'>
          <span className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse'></span>
          LIVE MONITORING PEMORSIAN
        </div>

        <p className='text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto'>
          Status etiket dipantau real-time pasca snapshot untuk mendeteksi revisi
          diet
        </p>
      </div>
    </Card>
  );
}

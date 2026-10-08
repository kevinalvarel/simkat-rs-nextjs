'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TriangleAlert } from 'lucide-react';
import type { MonitoringCardData } from '@/types/monitoringtypes';

interface OverviewDietCardProps {
  card: MonitoringCardData;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; bgBadge: string; borderBadge: string }
> = {
  POKOK: {
    label: 'Makanan Pokok',
    bgBadge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    borderBadge: 'border-indigo-500/20',
  },
  HEWANI: {
    label: 'Lauk Hewani',
    bgBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    borderBadge: 'border-amber-500/20',
  },
  NABATI: {
    label: 'Lauk Nabati',
    bgBadge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    borderBadge: 'border-teal-500/20',
  },
  SAYUR: {
    label: 'Sayuran',
    bgBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    borderBadge: 'border-emerald-500/20',
  },
  'HEWANI & NABATI': {
    label: 'Lauk Hewani & Nabati',
    bgBadge: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
    borderBadge: 'border-amber-500/30',
  },
  'NABATI & SAYUR': {
    label: 'Lauk Nabati & Sayur',
    bgBadge: 'bg-teal-500/15 text-teal-800 dark:text-teal-200',
    borderBadge: 'border-teal-500/30',
  },
  'HEWANI & SAYUR': {
    label: 'Lauk Hewani & Sayur',
    bgBadge: 'bg-orange-500/15 text-orange-800 dark:text-orange-200',
    borderBadge: 'border-orange-500/30',
  },
  SARING: {
    label: 'Makanan Saring',
    bgBadge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    borderBadge: 'border-blue-500/20',
  },
  BUAH: {
    label: 'Buah',
    bgBadge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    borderBadge: 'border-rose-500/20',
  },
  SNACK: {
    label: 'Snack',
    bgBadge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    borderBadge: 'border-cyan-500/20',
  },
  LAINNYA: {
    label: 'Hidangan',
    bgBadge: 'bg-muted text-muted-foreground',
    borderBadge: 'border-border',
  },
};

export default function OverviewDietCard({ card }: OverviewDietCardProps) {
  // Sembunyikan kartu non-produksi + kategori EXTRA (dihapus dari layar TV/produksi)
  const code = (card.code || '').toUpperCase();
  const categoryKey = (card.category || 'LAINNYA').toUpperCase();
  if (
    !card.code ||
    code === 'TIDAK' ||
    code === 'NON' ||
    code === 'NPO' ||
    categoryKey === 'NPO' ||
    categoryKey === 'EXTRA'
  ) {
    return null;
  }

  const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.LAINNYA;

  const isMissingFromCycleMenu =
    (card.name || '').toLowerCase().includes('tidak terdaftar pada siklus menu') ||
    (card.name || '').toLowerCase().includes('tidak ada di siklus menu') ||
    code.startsWith('MISSING-');

  const isDiitCard =
    card.isDiit === true || code.startsWith('DIIT-MENU-');

  const showDietTag = card.dietTag && card.dietTag !== '-';

  return (
    <Card className='border bg-card flex flex-col justify-between overflow-hidden rounded-2xl shadow-xs'>
      {/* Kategori */}
      <div className='pt-4 pb-2 px-4 text-center flex items-center justify-center gap-1.5 flex-wrap'>
        <Badge
          variant='outline'
          className={`text-xs font-bold px-3 py-1 ${categoryStyle.bgBadge} ${categoryStyle.borderBadge}`}
        >
          {categoryStyle.label}
        </Badge>
        {isDiitCard && (
          <Badge
            variant='outline'
            title='Menu penampung DIIT: diet ini tidak punya hidangan spesifik di slot jam ini'
            className='text-[10px] font-extrabold px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40'
          >
            DIIT
          </Badge>
        )}
      </div>

      {/* Nama hidangan */}
      <div className='px-4 pb-1 text-center'>
        {isMissingFromCycleMenu ? (
          <div className='flex items-center justify-center gap-1.5 min-h-[3rem]'>
            <Badge
              variant='secondary'
              className='text-xs font-medium gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30'
            >
              <TriangleAlert className='w-3.5 h-3.5 shrink-0' />
              Tidak terdaftar pada siklus menu
            </Badge>
          </div>
        ) : (
          <h4 className='font-extrabold text-lg sm:text-xl tracking-tight leading-snug line-clamp-2 min-h-[3rem] text-foreground'>
            {card.name}
          </h4>
        )}
      </div>

      {/* Keterangan diet */}
      <div className='px-4 pb-2 text-center min-h-[1.75rem]'>
        {showDietTag ? (
          <span className='inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-mono font-bold bg-primary/10 text-primary border border-primary/20'>
            {card.dietTag}
          </span>
        ) : (
          <span className='text-xs text-muted-foreground'>—</span>
        )}
      </div>

      {/* Jumlah porsi */}
      <CardContent className='pb-5 pt-1 flex flex-col items-center justify-center text-center'>
        <div className='flex items-baseline gap-2'>
          <span className='text-5xl font-black tracking-tight text-foreground font-sans'>
            {card.active}
          </span>
          <span className='text-sm text-muted-foreground font-semibold'>
            porsi
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

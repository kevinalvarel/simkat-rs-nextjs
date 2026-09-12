'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TriangleAlert,
} from 'lucide-react';
import type { MonitoringCardData } from '@/types/monitoringtypes';

interface OverviewDietCardProps {
  card: MonitoringCardData;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; bgBadge: string; textBadge: string; borderBadge: string }
> = {
  POKOK: {
    label: 'Makanan Pokok',
    bgBadge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    textBadge: 'text-indigo-700 dark:text-indigo-300',
    borderBadge: 'border-indigo-500/20',
  },
  HEWANI: {
    label: 'Lauk Hewani',
    bgBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    textBadge: 'text-amber-700 dark:text-amber-300',
    borderBadge: 'border-amber-500/20',
  },
  NABATI: {
    label: 'Lauk Nabati',
    bgBadge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    textBadge: 'text-teal-700 dark:text-teal-300',
    borderBadge: 'border-teal-500/20',
  },
  SAYUR: {
    label: 'Sayuran',
    bgBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    textBadge: 'text-emerald-700 dark:text-emerald-300',
    borderBadge: 'border-emerald-500/20',
  },
  'HEWANI & NABATI': {
    label: 'Lauk Hewani & Nabati',
    bgBadge: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
    textBadge: 'text-amber-700 dark:text-amber-300',
    borderBadge: 'border-amber-500/30 ring-1 ring-teal-500/30',
  },
  'NABATI & SAYUR': {
    label: 'Lauk Nabati & Sayur',
    bgBadge: 'bg-teal-500/15 text-teal-800 dark:text-teal-200',
    textBadge: 'text-teal-700 dark:text-teal-300',
    borderBadge: 'border-teal-500/30 ring-1 ring-emerald-500/30',
  },
  'HEWANI & SAYUR': {
    label: 'Lauk Hewani & Sayur',
    bgBadge: 'bg-orange-500/15 text-orange-800 dark:text-orange-200',
    textBadge: 'text-orange-700 dark:text-orange-300',
    borderBadge: 'border-orange-500/30 ring-1 ring-emerald-500/30',
  },
  SARING: {
    label: 'Makanan Saring',
    bgBadge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    textBadge: 'text-blue-700 dark:text-blue-300',
    borderBadge: 'border-blue-500/20',
  },
  EXTRA: {
    label: 'Ekstra Diet',
    bgBadge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    textBadge: 'text-purple-700 dark:text-purple-300',
    borderBadge: 'border-purple-500/20',
  },
  BUAH: {
    label: 'Buah',
    bgBadge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    textBadge: 'text-rose-700 dark:text-rose-300',
    borderBadge: 'border-rose-500/20',
  },
  SNACK: {
    label: 'Snack',
    bgBadge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    textBadge: 'text-cyan-700 dark:text-cyan-300',
    borderBadge: 'border-cyan-500/20',
  },
  NPO: {
    label: 'Puasa / NPO',
    bgBadge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
    textBadge: 'text-slate-700 dark:text-slate-300',
    borderBadge: 'border-slate-500/20',
  },
  LAINNYA: {
    label: 'Hidangan',
    bgBadge: 'bg-muted text-muted-foreground',
    textBadge: 'text-muted-foreground',
    borderBadge: 'border-border',
  },
};

export default function OverviewDietCard({ card }: OverviewDietCardProps) {
  // Do not render cards with code 'TIDAK' or 'NON'
  if (
    !card.code ||
    card.code.toUpperCase() === 'TIDAK' ||
    card.code.toUpperCase() === 'NON'
  ) {
    return null;
  }

  const change = card.change;
  const categoryKey = (card.category || 'LAINNYA').toUpperCase();
  const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.LAINNYA;

  // Penanda eksplisit: kode mapping-diet tidak terdaftar di siklus menu aktif.
  const isMissingFromCycleMenu =
    (card.name || '').toLowerCase().includes('tidak terdaftar pada siklus menu') ||
    (card.name || '').toLowerCase().includes('tidak ada di siklus menu') ||
    (card.code || '').startsWith('MISSING-');

  const styles = (() => {
    if (change > 0) {
      return {
        bg: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        bgAccent: 'bg-emerald-100 dark:bg-emerald-950/80',
        icon: ArrowUpRight,
        label: `▲ ${change}`,
        delta: `(+${change})`,
      };
    }
    if (change < 0) {
      return {
        bg: 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        bgAccent: 'bg-rose-100 dark:bg-rose-950/80',
        icon: ArrowDownRight,
        label: `▼ ${Math.abs(change)}`,
        delta: `(${change})`,
      };
    }
    return {
      bg: 'bg-card border-border',
      text: 'text-muted-foreground',
      bgAccent: 'bg-secondary',
      icon: Minus,
      label: '—',
      delta: '(0)',
    };
  })();

  const DeltaIcon = styles.icon;

  return (
    <Card
      className={`transition-all duration-300 border hover:shadow-md flex flex-col justify-between overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200 ${
        isMissingFromCycleMenu
          ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40 border-dashed ring-1 ring-amber-500/20'
          : styles.bg
      } ${change !== 0 && !isMissingFromCycleMenu ? 'ring-1 ring-primary/15' : ''}`}
      title={card.catatan || card.name}
    >
      {/* Header with Category Badge & Dish Name */}
      <div className='border-b border-border/60 p-2.5 text-left bg-muted/30 space-y-1.5'>
        <div className='flex items-center justify-center gap-1.5 flex-wrap'>
          <Badge
            variant='outline'
            className={`text-[10px] font-semibold px-2 py-0.5 ${categoryStyle.bgBadge} ${categoryStyle.borderBadge}`}
          >
            {categoryStyle.label}
          </Badge>
          {/* Special Diet or Kelas Tag */}
          {card.dietTag && card.dietTag !== '-' && (
            <span className='inline-flex items-center px-1.5 py-0.2 rounded text-[13px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20'>
              {card.dietTag}
            </span>
          )}
        </div>

        {/* Dish Name */}
        {isMissingFromCycleMenu ? (
          <div className='flex flex-col items-center justify-center gap-1 min-h-[2rem] py-0.5'>
            <Badge
              variant='secondary'
              className='text-[11px] font-medium gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30'
            >
              <TriangleAlert className='w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
              Tidak terdaftar pada siklus menu
            </Badge>
          </div>
        ) : (
          <h4
            className='font-bold text-xs sm:text-sm tracking-tight leading-snug line-clamp-2 min-h-[2rem] text-center text-foreground'
            title={card.catatan || card.name}
          >
            {card.name}
          </h4>
        )}

        {card.kelas && card.kelas !== 'Semua Kelas' && (
          <span className='text-[10px] text-muted-foreground block truncate text-center'>
            Khusus: <strong>{card.kelas}</strong>
          </span>
        )}
      </div>

      {/* Main Count & Delta Status */}
      <CardContent className='p-3.5 flex flex-col items-center justify-center text-center space-y-1'>
        <div className='flex items-baseline gap-1'>
          <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans'>
            {card.active}
          </h2>
          <span className='text-[11px] text-muted-foreground font-medium'>
            porsi
          </span>
        </div>

        {/* Change Delta Indicator */}
        <div className='flex items-center gap-1.5 pt-0.5'>
          {change !== 0 ? (
            <div
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${styles.bgAccent} ${styles.text}`}
            >
              <DeltaIcon className='w-3.5 h-3.5 shrink-0' />
              <span>{Math.abs(change)}</span>
            </div>
          ) : (
            <span className='text-[11px] text-muted-foreground font-medium'>
              Tetap
            </span>
          )}

          {/* Baseline detail */}
          <span className='text-[10px] font-mono font-semibold text-muted-foreground/80'>
            {styles.delta}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

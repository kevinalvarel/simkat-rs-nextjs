'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Sunrise, Sun, Sunset, Coffee, Layers, ChefHat, Sparkles } from 'lucide-react';
import type { SiklusMenuItem } from '@/servers/siklus-menu.service';

interface SiklusStatsProps {
  items: SiklusMenuItem[];
  activeSiklus: number;
}

export default function SiklusStats({ items, activeSiklus }: SiklusStatsProps) {
  const pagiCount = items.filter((i) => i.waktu_makan === 'PAGI').length;
  const siangCount = items.filter((i) => i.waktu_makan === 'SIANG').length;
  const soreCount = items.filter((i) => i.waktu_makan === 'SORE').length;
  const saringCount = items.filter(
    (i) =>
      (i.waktu_makan || '').trim().toUpperCase() === 'SARING' ||
      (i.jenis_makanan || '').trim().toUpperCase() === 'SARING',
  ).length;

  const hewaniCount = items.filter((i) => i.jenis_makanan === 'HEWANI').length;
  const nabatiCount = items.filter((i) => i.jenis_makanan === 'NABATI').length;
  const sayurCount = items.filter((i) => i.jenis_makanan === 'SAYUR').length;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
      {/* Total Siklus */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-primary/10 text-primary shrink-0'>
            <ChefHat className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              Total Menu Siklus #{activeSiklus}
            </p>
            <h3 className='text-lg font-bold tracking-tight text-foreground font-mono'>
              {items.length} <span className='text-xs font-normal text-muted-foreground'>item</span>
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Makan Pagi */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0'>
            <Sunrise className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              Makan Pagi
            </p>
            <h3 className='text-lg font-bold tracking-tight text-foreground font-mono'>
              {pagiCount} <span className='text-xs font-normal text-muted-foreground'>variasi</span>
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Makan Siang */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0'>
            <Sun className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              Makan Siang
            </p>
            <h3 className='text-lg font-bold tracking-tight text-foreground font-mono'>
              {siangCount} <span className='text-xs font-normal text-muted-foreground'>variasi</span>
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Makan Sore */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0'>
            <Sunset className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              Makan Sore
            </p>
            <h3 className='text-lg font-bold tracking-tight text-foreground font-mono'>
              {soreCount} <span className='text-xs font-normal text-muted-foreground'>variasi</span>
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Saring (Siang) */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
            <Coffee className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              Saring
            </p>
            <h3 className='text-lg font-bold tracking-tight text-foreground font-mono'>
              {saringCount} <span className='text-xs font-normal text-muted-foreground'>item</span>
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Proporsi Lauk */}
      <Card className='border bg-card shadow-2xs hover:shadow-xs transition-all'>
        <CardContent className='p-3.5 flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0'>
            <Layers className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] font-medium text-muted-foreground truncate'>
              H / N / S
            </p>
            <h3 className='text-xs font-bold tracking-tight text-foreground font-mono truncate'>
              <span className='text-indigo-600'>{hewaniCount}H</span> • <span className='text-teal-600'>{nabatiCount}N</span> • <span className='text-green-600'>{sayurCount}S</span>
            </h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

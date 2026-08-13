'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, DoorOpen, Bed, Layers } from 'lucide-react';

interface KonfigurasiStatsProps {
  totalGedung: number;
  totalRuangan: number;
  totalBed: number;
  avgBedPerRuangan: string;
}

export function KonfigurasiStats({
  totalGedung,
  totalRuangan,
  totalBed,
  avgBedPerRuangan,
}: KonfigurasiStatsProps) {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
      {/* Total Gedung */}
      <Card className='border shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              Total Gedung
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight'>
              {totalGedung}
            </h3>
          </div>
          <div className='p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400'>
            <Building className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Total Ruangan */}
      <Card className='border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>
              Total Ruangan
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300'>
              {totalRuangan}
            </h3>
          </div>
          <div className='p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400'>
            <DoorOpen className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Total Kapasitas Bed */}
      <Card className='border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-purple-700 dark:text-purple-400'>
              Kapasitas Total Bed
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-purple-800 dark:text-purple-300'>
              {totalBed}
            </h3>
          </div>
          <div className='p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400'>
            <Bed className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* Rata-rata Bed per Ruangan */}
      <Card className='border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-amber-700 dark:text-amber-400'>
              Rerata Bed/Ruangan
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-amber-800 dark:text-amber-300'>
              {avgBedPerRuangan}
            </h3>
          </div>
          <div className='p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400'>
            <Layers className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

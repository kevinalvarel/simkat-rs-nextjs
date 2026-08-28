'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, DoorOpen, DoorClosed, Bed } from 'lucide-react';

interface KonfigurasiStatsProps {
  totalGedung: number;
  totalRuangan: number;
  totalKamar: number;
  totalBed: number;
  avgBedPerRuangan: string;
}

export function KonfigurasiStats({
  totalGedung,
  totalRuangan,
  totalKamar,
  totalBed,
  avgBedPerRuangan,
}: KonfigurasiStatsProps) {
  const avgBedPerKamar =
    totalKamar > 0 ? (totalBed / totalKamar).toFixed(1) : '0';

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
      {/* 1. Total Gedung */}
      <Card className='border shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground'>
              Total Gedung
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-foreground'>
              {totalGedung}
            </h3>
            <p className='text-[10px] text-muted-foreground'>
              Unit Bangunan Terdaftar
            </p>
          </div>
          <div className='p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0'>
            <Building className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Ruangan */}
      <Card className='border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>
              Total Ruangan
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300'>
              {totalRuangan}
            </h3>
            <p className='text-[10px] text-emerald-600/80 dark:text-emerald-400/70'>
              Bangsal / Ruang Perawatan
            </p>
          </div>
          <div className='p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0'>
            <DoorOpen className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Kamar / Nomor Pintu */}
      <Card className='border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-amber-700 dark:text-amber-400'>
              Total Kamar / Pintu
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-amber-800 dark:text-amber-300'>
              {totalKamar}
            </h3>
            <p className='text-[10px] text-amber-600/80 dark:text-amber-400/70'>
              ~{avgBedPerKamar} Bed / Kamar
            </p>
          </div>
          <div className='p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0'>
            <DoorClosed className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Kapasitas Bed */}
      <Card className='border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 shadow-2xs hover:shadow-xs transition-shadow'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-purple-700 dark:text-purple-400'>
              Total Kapasitas Bed
            </p>
            <h3 className='text-2xl font-extrabold tracking-tight text-purple-800 dark:text-purple-300'>
              {totalBed}
            </h3>
            <p className='text-[10px] text-purple-600/80 dark:text-purple-400/70'>
              ~{avgBedPerRuangan} Bed / Ruangan
            </p>
          </div>
          <div className='p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 shrink-0'>
            <Bed className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

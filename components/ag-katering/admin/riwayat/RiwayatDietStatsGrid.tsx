'use client';

import React from 'react';
import type { RiwayatDietStats } from '@/servers/riwayat-history.service';
import { Card, CardContent } from '@/components/ui/card';
import { History, Users, Utensils, AlertTriangle } from 'lucide-react';

interface RiwayatDietStatsGridProps {
  stats: RiwayatDietStats;
}

export function RiwayatDietStatsGrid({ stats }: RiwayatDietStatsGridProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
      {/* 1. Total Perubahan Diet */}
      <Card className='border border-border/70 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200'>
        <CardContent className='p-4 sm:p-5 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Total Histori Diet
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold tracking-tight text-foreground'>
                {stats.totalRiwayat}
              </span>
              <span className='text-xs text-primary font-semibold'>
                ({stats.hariIniCount} Hari Ini)
              </span>
            </div>
          </div>
          <div className='p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'>
            <History className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 2. Staf Gizi-RS Aktif Terdaftar */}
      <Card className='border border-border/70 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200'>
        <CardContent className='p-4 sm:p-5 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Staf Gizi-RS Pencatat
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold tracking-tight text-foreground'>
                {stats.giziRsCount}
              </span>
              <span className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                Akun Terdaftar
              </span>
            </div>
          </div>
          <div className='p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
            <Users className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 3. Modifikasi Diet & Emergent */}
      <Card className='border border-border/70 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200'>
        <CardContent className='p-4 sm:p-5 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Modifikasi Diet
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold tracking-tight text-foreground'>
                {stats.dietChangeCount}
              </span>
              <span className='text-xs text-muted-foreground'>
                Perubahan Menu
              </span>
            </div>
          </div>
          <div className='p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'>
            <Utensils className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>

      {/* 4. Puasa NPO & Emergent */}
      <Card className='border border-border/70 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200'>
        <CardContent className='p-4 sm:p-5 flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              NPO & Instruksi Khusus
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold tracking-tight text-foreground'>
                {stats.npoEmergentCount}
              </span>
              <span className='text-xs text-amber-600 dark:text-amber-400 font-medium'>
                Puasa / Emergent
              </span>
            </div>
          </div>
          <div className='p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'>
            <AlertTriangle className='w-5 h-5' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


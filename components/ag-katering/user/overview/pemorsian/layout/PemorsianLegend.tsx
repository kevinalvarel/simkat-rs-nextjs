'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface PemorsianLegendProps {
  lastUpdated?: string;
}

export default function PemorsianLegend({ lastUpdated }: PemorsianLegendProps) {
  return (
    <Card className='border border-border/80 bg-card/60 backdrop-blur-xs rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3'>
        <div className='flex items-center gap-2'>
          <Info className='w-4 h-4 text-primary' />
          <h4 className='text-xs sm:text-sm font-bold text-foreground'>
            Panduan Status Data & Alur Cetak Etiket Pemorsian
          </h4>
        </div>
        {lastUpdated && (
          <span className='text-[11px] text-muted-foreground font-mono'>
            Sinkronisasi terakhir: <strong>{lastUpdated}</strong>
          </span>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5'>
        {/* Legend 1: Belum Dicetak */}
        <div className='flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5'>
          <div className='w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5'>
            <Clock className='w-4 h-4' />
          </div>
          <div className='space-y-1 text-xs'>
            <div className='font-bold text-foreground flex items-center gap-1.5'>
              <span>1. Belum Dicetak</span>
              <Badge variant='outline' className='text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 border-amber-500/30'>
                Card View
              </Badge>
            </div>
            <p className='text-muted-foreground text-[11px] leading-relaxed'>
              Pasien aktif dalam siklus atau snapshot berjalan yang etiketnya belum
              dicetak. Tampil dalam bentuk card untuk pemorsian makanan.
            </p>
          </div>
        </div>

        {/* Legend 2: Sudah Dicetak */}
        <div className='flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5'>
          <div className='w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5'>
            <CheckCircle2 className='w-4 h-4' />
          </div>
          <div className='space-y-1 text-xs'>
            <div className='font-bold text-foreground flex items-center gap-1.5'>
              <span>2. Sudah Dicetak</span>
              <Badge variant='outline' className='text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/30'>
                Card View
              </Badge>
            </div>
            <p className='text-muted-foreground text-[11px] leading-relaxed'>
              Pasien yang etiket makannya telah berhasil dicetak. Tetap dapat
              dicetak ulang jika etiket fisik rusak atau hilang.
            </p>
          </div>
        </div>

        {/* Legend 3: Butuh Revisi */}
        <div className='flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5'>
          <div className='w-7 h-7 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5'>
            <AlertTriangle className='w-4 h-4' />
          </div>
          <div className='space-y-1 text-xs'>
            <div className='font-bold text-foreground flex items-center gap-1.5'>
              <span>3. Butuh Revisi</span>
              <Badge variant='outline' className='text-[9px] px-1 py-0 bg-rose-500/10 text-rose-700 border-rose-500/30'>
                Tabel Khusus
              </Badge>
            </div>
            <p className='text-muted-foreground text-[11px] leading-relaxed'>
              Terjadi jika AG RS mengubah data pasien setelah snapshot terkunci.
              Tampil pada tabel perbandingan khusus untuk cetak etiket revisi baru.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

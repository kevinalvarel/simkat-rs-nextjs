'use client';

import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface OverviewProductionLegendProps {
  lastUpdated: string;
}

export default function OverviewProductionLegend({
  lastUpdated,
}: OverviewProductionLegendProps) {
  return (
    <div className='bg-muted/40 border border-border/80 rounded-2xl p-4 sm:p-5 flex gap-3.5 text-xs text-muted-foreground shadow-2xs'>
      <LayoutGrid className='w-5 h-5 text-primary shrink-0 mt-0.5' />
      <div className='space-y-1.5'>
        <strong className='text-foreground text-sm font-bold block'>
          Legenda & Panduan Pemantauan Produksi:
        </strong>
        <p className='leading-relaxed'>
          Tiap kartu merepresentasikan <strong>hidangan makanan konkret</strong> yang diterjemahkan dari <strong>Siklus Menu</strong> aktif untuk jadwal makan target serta disesuaikan dengan <strong>diet dan kelas pasien</strong> (misal: Lauk Hewani Ayam/Ikan, Lauk Nabati Tempe/Tahu, Sayuran, Makanan Pokok, Ekstra Putih Telur, Buah, dan Snack).
        </p>
        <p className='leading-relaxed'>
          Angka tebal pada kartu menunjukkan{' '}
          <strong className='text-foreground'>jumlah porsi aktif saat ini</strong>{' '}
          secara real-time. Indikator segitiga merah (
          <strong className='text-rose-500 font-bold'>▼</strong>) atau hijau (
          <strong className='text-emerald-500 font-bold'>▲</strong>) menunjukkan
          perubahan jumlah porsi dibandingkan data snapshot batch produksi yang terakhir dikunci.
        </p>
        <p className='text-[10px] text-muted-foreground/80 font-mono pt-1'>
          Terakhir diperbarui: {lastUpdated} WIB
        </p>
      </div>
    </div>
  );
}

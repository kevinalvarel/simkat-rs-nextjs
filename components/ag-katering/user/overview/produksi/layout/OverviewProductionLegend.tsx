import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface OverviewProductionLegendProps {
  lastUpdated: string;
}

export default function OverviewProductionLegend({
  lastUpdated,
}: OverviewProductionLegendProps) {
  return (
    <div className='bg-muted/40 border border-border/80 rounded-xl p-4 flex gap-3 text-xs text-muted-foreground'>
      <LayoutGrid className='w-5 h-5 text-primary shrink-0' />
      <div className='space-y-1'>
        <strong className='text-foreground'>
          Legenda Keterangan Pemantauan:
        </strong>
        <p>
          Tiap kotak merepresentasikan item komponen menu hasil mapping diet
          (misal: <strong>BN</strong> = Biasa Nasi, <strong>TKTP</strong> =
          Tinggi Kalori Tinggi Protein, <strong>PUTEL</strong> = Putih Telur).
          Jumlah angka tebal di atas merupakan{' '}
          <strong className='text-foreground'>jumlah porsi aktif saat ini</strong>{' '}
          secara real-time. Indikator segitiga merah (
          <strong className='text-rose-500'>▼</strong>) atau hijau (
          <strong className='text-emerald-500'>▲</strong>) menunjukkan
          perubahan dibandingkan dengan data snapshot produksi yang terakhir
          dikunci.
        </p>
        <p className='text-[10px] text-muted-foreground/80 mt-1'>
          Terakhir diperbarui: {lastUpdated} WIB
        </p>
      </div>
    </div>
  );
}

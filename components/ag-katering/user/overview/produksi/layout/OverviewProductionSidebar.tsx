import React from 'react';
import { Card } from '@/components/ui/card';
import { Soup } from 'lucide-react';
import OverviewClockCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewClockCard';
import OverviewNextSnapshotCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewNextSnapshotCard';

interface OverviewProductionSidebarProps {
  waktuMakan: string;
  currentTime: string;
  cutoffTime: string;
  tanggalProduksi: string;
}

export default function OverviewProductionSidebar({
  waktuMakan,
  currentTime,
  cutoffTime,
  tanggalProduksi,
}: OverviewProductionSidebarProps) {
  return (
    <Card className='lg:col-span-1 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs rounded-2xl flex flex-col justify-between p-5 text-center'>
      <div className='space-y-4'>
        <h3 className='text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-tight'>
          Tabulasi Produksi Makan {waktuMakan}
        </h3>

        <div className='flex justify-center py-2 text-emerald-600 dark:text-emerald-400'>
          <Soup
            className='w-12 h-12 stroke-[1.5] animate-bounce'
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* Jam Saat Ini */}
        <OverviewClockCard currentTime={currentTime} />

        {/* Snapshot Selanjutnya */}
        <OverviewNextSnapshotCard
          cutoffTime={cutoffTime}
          waktuMakan={waktuMakan}
          tanggalProduksi={tanggalProduksi}
        />
      </div>

      <div className='mt-4 pt-4 border-t border-dashed border-emerald-500/20 space-y-3'>
        <div className='inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 w-fit mx-auto'>
          <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse'></span>
          LIVE
        </div>

        <p className='text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto'>
          Data berubah otomatis mengikuti input AG RS
        </p>
      </div>
    </Card>
  );
}

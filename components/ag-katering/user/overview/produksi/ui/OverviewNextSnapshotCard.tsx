import React from 'react';

interface OverviewNextSnapshotCardProps {
  cutoffTime: string;
  waktuMakan: string;
  tanggalProduksi: string;
}

export default function OverviewNextSnapshotCard({
  cutoffTime,
  waktuMakan,
  tanggalProduksi,
}: OverviewNextSnapshotCardProps) {
  const formattedDate = tanggalProduksi
    ? new Date(tanggalProduksi).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
      })
    : '-';

  return (
    <div className='space-y-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5'>
      <span className='text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block font-semibold'>
        Snapshot Selanjutnya
      </span>
      <div className='font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-400'>
        {cutoffTime} WIB
      </div>
      <div className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium'>
        Siklus {waktuMakan} ({formattedDate})
      </div>
    </div>
  );
}

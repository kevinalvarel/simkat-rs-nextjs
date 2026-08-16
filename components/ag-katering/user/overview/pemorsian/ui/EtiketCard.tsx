import React from 'react';
import type { EtiketData } from '@/types/pemorsiantypes';

interface EtiketCardProps {
  data: EtiketData;
  className?: string;
}

export default function EtiketCard({ data, className = '' }: EtiketCardProps) {
  const mealTimeUpper = (data.waktu || 'PAGI').toUpperCase();

  return (
    <div
      className={`etiket-card etiket-card-print bg-white text-black p-3.5 sm:p-4 rounded-md shadow-xs border-2 border-black font-sans w-[360px] h-[180px] shrink-0 select-none flex flex-col justify-between ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      {/* 1. Header: E-TICKET MAKAN [WAKTU] */}
      <div className='text-center pb-0.5'>
        <div className='flex items-center justify-center gap-1.5'>
          <h2 className='text-sm sm:text-base font-bold tracking-tight text-black font-sans uppercase m-0 leading-tight'>
            E-TICKET MAKAN {mealTimeUpper}
          </h2>
          {data.is_revisi && (
            <span className='text-[9px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-400 leading-none'>
              {data.keterangan_revisi || 'Revisi'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Divider Line */}
      <hr className='border-0 border-t-2 border-black my-0 mb-1' />

      {/* 3. Patient & Diet Details */}
      <div className='space-y-1 text-xs sm:text-[13px] leading-tight text-black font-normal flex-1 flex flex-col justify-around'>
        <div className='grid grid-cols-[68px_1fr] items-baseline gap-1'>
          <span className='font-semibold'>Nama</span>
          <span className='font-bold truncate' title={data.nama}>
            : {data.nama}
          </span>
        </div>

        <div className='grid grid-cols-[68px_1fr] items-baseline gap-1'>
          <span className='font-semibold'>Ruangan</span>
          <span className='font-normal truncate'>: {data.ruangan}</span>
        </div>

        <div className='grid grid-cols-[68px_1fr] items-baseline gap-1'>
          <span className='font-semibold'>Bed</span>
          <span className='font-normal'>: {data.bed || '-'}</span>
        </div>

        <div className='grid grid-cols-[68px_1fr] items-baseline gap-1'>
          <span className='font-semibold'>Diet</span>
          <span className='font-bold break-words line-clamp-2'>: {data.diet}</span>
        </div>

        <div className='grid grid-cols-[68px_1fr] items-baseline gap-1'>
          <span className='font-semibold'>Waktu</span>
          <span className='font-normal'>: {data.waktu}</span>
        </div>
      </div>
    </div>
  );
}

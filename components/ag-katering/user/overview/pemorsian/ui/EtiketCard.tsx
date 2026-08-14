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
      className={`etiket-card etiket-card-print bg-white text-black p-5 sm:p-6 rounded-lg shadow-xs border-2 border-black font-sans w-[320px] max-w-[320px] shrink-0 select-none ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      {/* 1. Header: E-TICKET MAKAN [WAKTU] */}
      <div className='text-center pb-2'>
        <h2 className='text-lg sm:text-xl font-bold tracking-tight text-black font-sans uppercase m-0 leading-tight'>
          E-TICKET MAKAN {mealTimeUpper}
        </h2>
        {data.is_revisi && (
          <div className='mt-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-400 inline-block'>
            {data.keterangan_revisi || 'Etiket Revisi'}
          </div>
        )}
      </div>

      {/* 2. Divider Line */}
      <hr className='border-0 border-t-2 border-black my-0 mb-3.5' />

      {/* 3. Patient & Diet Details */}
      <div className='space-y-2.5 text-base sm:text-lg leading-snug text-black font-normal'>
        <div className='grid grid-cols-[85px_1fr] items-baseline gap-2'>
          <span className='font-semibold'>Nama:</span>
          <span className='font-normal truncate' title={data.nama}>
            {data.nama}
          </span>
        </div>

        <div className='grid grid-cols-[85px_1fr] items-baseline gap-2'>
          <span className='font-semibold'>Ruangan:</span>
          <span className='font-normal'>{data.ruangan}</span>
        </div>

        <div className='grid grid-cols-[85px_1fr] items-baseline gap-2'>
          <span className='font-semibold'>Bed:</span>
          <span className='font-normal'>{data.bed || '-'}</span>
        </div>

        <div className='grid grid-cols-[85px_1fr] items-baseline gap-2'>
          <span className='font-semibold'>Diet:</span>
          <span className='font-normal break-words'>{data.diet}</span>
        </div>

        <div className='grid grid-cols-[85px_1fr] items-baseline gap-2'>
          <span className='font-semibold'>Waktu:</span>
          <span className='font-normal'>{data.waktu}</span>
        </div>
      </div>
    </div>
  );
}

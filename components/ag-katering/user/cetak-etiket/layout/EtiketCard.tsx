'use client';

import React from 'react';
import type { EtiketData } from '@/types/pemorsiantypes';
import Image from 'next/image';

interface EtiketCardProps {
  data: EtiketData;
  className?: string;
  isDraggable?: boolean;
}

export default function EtiketCard({ data, className = '' }: EtiketCardProps) {
  const mealTimeUpper = (data.waktu || 'SIANG').toUpperCase();

  return (
    <div
      className={`etiket-card etiket-card-print bg-white text-black rounded-md shadow-xs border-2 border-black font-sans w-[360px] h-[180px] shrink-0 select-none relative overflow-hidden p-3 flex flex-col justify-between ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '360px',
        height: '180px',
      }}
    >
      {/* 1. Header: Logo Kiri, Judul, Logo Kanan */}
      <div className='flex items-center justify-between gap-2 pb-1.5 border-b-[1.5px] border-black'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/icons/logo-rsud.png'
          alt='Logo RSUD'
          className='w-7 h-7 object-contain shrink-0 pointer-events-none'
        />

        <div className='flex items-center justify-center gap-1.5 flex-1 min-w-0 text-center'>
          <h2 className='text-xs sm:text-sm font-bold tracking-tight text-black font-sans uppercase m-0 leading-tight truncate'>
            E-TICKET MAKAN {mealTimeUpper}
          </h2>
          {data.is_revisi && (
            <span className='text-[8px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-400 leading-none shrink-0'>
              {data.keterangan_revisi || 'Revisi'}
            </span>
          )}
        </div>

        <img
          src='/icons/logo-tradco.png'
          alt='Logo Katering'
          className='w-7 h-7 object-contain shrink-0 pointer-events-none'
        />
      </div>

      {/* 2. Body Details Pasien */}
      <div className='flex-1 flex flex-col justify-center py-1 space-y-1 text-xs sm:text-[13px] leading-tight text-black'>
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1'>
          <span className='font-semibold text-black'>Nama</span>
          <span className='font-bold truncate text-black' title={data.nama}>
            : {data.nama}
          </span>
        </div>

        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1'>
          <span className='font-semibold text-black'>Ruangan</span>
          <span className='font-normal truncate text-black'>
            : {data.ruangan}
          </span>
        </div>

        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1'>
          <span className='font-semibold text-black'>Bed</span>
          <span className='font-normal text-black'>: {data.bed || '-'}</span>
        </div>

        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1'>
          <span className='font-semibold text-black'>Diet</span>
          <span className='font-bold break-words line-clamp-2 text-black'>
            : {data.diet}
          </span>
        </div>

        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1'>
          <span className='font-semibold text-black'>Waktu</span>
          <span className='font-normal text-black'>: {data.waktu}</span>
        </div>
      </div>
    </div>
  );
}

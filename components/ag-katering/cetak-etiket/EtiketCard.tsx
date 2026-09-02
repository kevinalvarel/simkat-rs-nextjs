'use client';

import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import type { EtiketData } from '@/types/pemorsiantypes';
import Image from 'next/image';

export interface EtiketElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EtiketTemplateLayout {
  logoKiri: EtiketElementLayout;
  headerTitle: EtiketElementLayout;
  logoKanan: EtiketElementLayout;
  divider: EtiketElementLayout;
  nama: EtiketElementLayout;
  ruangan: EtiketElementLayout;
  bed: EtiketElementLayout;
  diet: EtiketElementLayout;
  waktu: EtiketElementLayout;
}

const DEFAULT_LAYOUT: EtiketTemplateLayout = {
  logoKiri: { x: 10, y: 7, width: 26, height: 26 },
  headerTitle: { x: 40, y: 8, width: 280, height: 24 },
  logoKanan: { x: 324, y: 7, width: 26, height: 26 },
  divider: { x: 10, y: 36, width: 340, height: 4 },
  nama: { x: 12, y: 44, width: 336, height: 20 },
  ruangan: { x: 12, y: 68, width: 336, height: 20 },
  bed: { x: 12, y: 90, width: 336, height: 20 },
  diet: { x: 12, y: 112, width: 336, height: 28 },
  waktu: { x: 12, y: 142, width: 336, height: 22 },
};

interface EtiketCardProps {
  data: EtiketData;
  className?: string;
  isDraggable?: boolean;
}

export default function EtiketCard({
  data,
  className = '',
  isDraggable = true,
}: EtiketCardProps) {
  const mealTimeUpper = (data.waktu || 'PAGI').toUpperCase();
  const [layout, setLayout] = useState<EtiketTemplateLayout>(DEFAULT_LAYOUT);

  const updatePosition = (
    key: keyof EtiketTemplateLayout,
    x: number,
    y: number,
  ) => {
    setLayout((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        x,
        y,
      },
    }));
  };

  const updateSize = (
    key: keyof EtiketTemplateLayout,
    width: number,
    height: number,
    x: number,
    y: number,
  ) => {
    setLayout((prev) => ({
      ...prev,
      [key]: {
        x,
        y,
        width,
        height,
      },
    }));
  };

  return (
    <div
      className={`etiket-card etiket-card-print bg-white text-black rounded-md shadow-xs border-2 border-black font-sans w-[360px] h-[180px] shrink-0 select-none relative overflow-hidden ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '360px',
        height: '180px',
        position: 'relative',
      }}
    >
      {/* 1. Logo Kiri */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.logoKiri.width, height: layout.logoKiri.height }}
        position={{ x: layout.logoKiri.x, y: layout.logoKiri.y }}
        onDragStop={(_, d) => updatePosition('logoKiri', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize(
            'logoKiri',
            ref.offsetWidth,
            ref.offsetHeight,
            pos.x,
            pos.y,
          )
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10'
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/icons/logo-rsud.png'
          alt='Logo Kiri'
          className='w-full h-full object-contain pointer-events-none'
        />
      </Rnd>

      {/* 2. Judul Header E-Ticket Makan */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{
          width: layout.headerTitle.width,
          height: layout.headerTitle.height,
        }}
        position={{ x: layout.headerTitle.x, y: layout.headerTitle.y }}
        onDragStop={(_, d) => updatePosition('headerTitle', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize(
            'headerTitle',
            ref.offsetWidth,
            ref.offsetHeight,
            pos.x,
            pos.y,
          )
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center justify-center'
      >
        <div className='flex items-center justify-center gap-1.5 w-full text-center'>
          <h2 className='text-xs sm:text-sm font-bold tracking-tight text-black font-sans uppercase m-0 leading-tight truncate'>
            E-TICKET MAKAN {mealTimeUpper}
          </h2>
          {data.is_revisi && (
            <span className='text-[8px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-400 leading-none shrink-0'>
              {data.keterangan_revisi || 'Revisi'}
            </span>
          )}
        </div>
      </Rnd>

      {/* 3. Logo Kanan */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{
          width: layout.logoKanan.width,
          height: layout.logoKanan.height,
        }}
        position={{ x: layout.logoKanan.x, y: layout.logoKanan.y }}
        onDragStop={(_, d) => updatePosition('logoKanan', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize(
            'logoKanan',
            ref.offsetWidth,
            ref.offsetHeight,
            pos.x,
            pos.y,
          )
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10'
      >
        <Image
          height={50}
          width={50}
          src='/icons/logo-tradco.png'
          alt='Logo Katering'
          className='w-full h-full object-contain pointer-events-none'
        />
      </Rnd>

      {/* 4. Garis Pembatas (Divider) */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.divider.width, height: layout.divider.height }}
        position={{ x: layout.divider.x, y: layout.divider.y }}
        onDragStop={(_, d) => updatePosition('divider', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('divider', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed cursor-move z-10 flex items-center'
      >
        <div className='w-full h-[1.5px] bg-black pointer-events-none' />
      </Rnd>

      {/* 5. Baris Nama Pasien */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.nama.width, height: layout.nama.height }}
        position={{ x: layout.nama.x, y: layout.nama.y }}
        onDragStop={(_, d) => updatePosition('nama', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('nama', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center'
      >
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1 w-full text-xs sm:text-[13px] leading-tight text-black'>
          <span className='font-semibold'>Nama</span>
          <span className='font-bold truncate' title={data.nama}>
            : {data.nama}
          </span>
        </div>
      </Rnd>

      {/* 6. Baris Ruangan */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.ruangan.width, height: layout.ruangan.height }}
        position={{ x: layout.ruangan.x, y: layout.ruangan.y }}
        onDragStop={(_, d) => updatePosition('ruangan', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('ruangan', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center'
      >
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1 w-full text-xs sm:text-[13px] leading-tight text-black'>
          <span className='font-semibold'>Ruangan</span>
          <span className='font-normal truncate'>: {data.ruangan}</span>
        </div>
      </Rnd>

      {/* 7. Baris Bed */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.bed.width, height: layout.bed.height }}
        position={{ x: layout.bed.x, y: layout.bed.y }}
        onDragStop={(_, d) => updatePosition('bed', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('bed', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center'
      >
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1 w-full text-xs sm:text-[13px] leading-tight text-black'>
          <span className='font-semibold'>Bed</span>
          <span className='font-normal'>: {data.bed || '-'}</span>
        </div>
      </Rnd>

      {/* 8. Baris Diet */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.diet.width, height: layout.diet.height }}
        position={{ x: layout.diet.x, y: layout.diet.y }}
        onDragStop={(_, d) => updatePosition('diet', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('diet', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center'
      >
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1 w-full text-xs sm:text-[13px] leading-tight text-black'>
          <span className='font-semibold'>Diet</span>
          <span className='font-bold break-words line-clamp-2'>
            : {data.diet}
          </span>
        </div>
      </Rnd>

      {/* 9. Baris Waktu */}
      <Rnd
        bounds='parent'
        disableDragging={!isDraggable}
        size={{ width: layout.waktu.width, height: layout.waktu.height }}
        position={{ x: layout.waktu.x, y: layout.waktu.y }}
        onDragStop={(_, d) => updatePosition('waktu', d.x, d.y)}
        onResizeStop={(_, __, ref, ___, pos) =>
          updateSize('waktu', ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
        }
        className='group/rnd hover:ring-1 hover:ring-blue-500/60 hover:ring-dashed rounded-xs cursor-move z-10 flex items-center'
      >
        <div className='grid grid-cols-[64px_1fr] items-baseline gap-1 w-full text-xs sm:text-[13px] leading-tight text-black'>
          <span className='font-semibold'>Waktu</span>
          <span className='font-normal'>: {data.waktu}</span>
        </div>
      </Rnd>
    </div>
  );
}

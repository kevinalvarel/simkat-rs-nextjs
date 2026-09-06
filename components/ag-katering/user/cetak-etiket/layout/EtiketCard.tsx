'use client';

import React from 'react';
import type { EtiketData, EtiketVariant } from '@/types/pemorsiantypes';
import { Badge } from '@/components/ui/badge';

export interface EtiketCardProps {
  data: EtiketData;
  className?: string;
  isDraggable?: boolean;
  variant?: EtiketVariant;
  customHeaderTitle?: string;
  customQuote?: string;
  customNotice?: string;
  customDateLabel?: string;
  customDateValue?: string;
  mealTimeFormat?: 'slash' | 'single';
  showQuote?: boolean;
  showNotice?: boolean;
  showBedWithRuangan?: boolean;
}

export default function EtiketCard({
  data,
  className = '',
  variant = 'diet-focus',
  customHeaderTitle,
  customQuote,
  customNotice,
  customDateLabel,
  customDateValue,
  mealTimeFormat = 'slash',
  showQuote = true,
  showNotice = true,
  showBedWithRuangan = true,
}: EtiketCardProps) {
  const mealTimeUpper = (data.waktu || 'SIANG').toUpperCase().trim();

  // Active Quote
  const activeQuote =
    customQuote !== undefined
      ? customQuote
      : data.quote || 'Setiap suapan adalah langkah menuju sehat';

  // Default notice based on variant if not customized
  const defaultVariantNotice =
    variant === 'diet-focus'
      ? '*Alat makan diambil 1 jam setelah pengantaran'
      : '*Makanan dikonsumsi maksimal 1 jam setelah disajikan';

  const activeNotice =
    customNotice !== undefined
      ? customNotice
      : data.catatan_alat || defaultVariantNotice;

  // Header Title
  const activeHeaderTitle =
    customHeaderTitle !== undefined && customHeaderTitle.trim() !== ''
      ? customHeaderTitle
      : 'ETIKET DIET PASIEN';

  // Formatted display date (for TGL PRODUKSI or Tanggal Order)
  const displayDate = React.useMemo(() => {
    if (customDateValue && customDateValue.trim() !== '') {
      return customDateValue;
    }
    if (data.exp_date && data.exp_date.trim() !== '') {
      return data.exp_date;
    }
    // Fallback to today's date formatted (DD-MM-YYYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, [customDateValue, data.exp_date]);

  // Display Room
  const displayRoom = showBedWithRuangan && data.bed && data.bed !== '-'
    ? `${data.ruangan} (${data.bed})`
    : data.ruangan || '-';

  // Keterangan text (e.g. Kelas or Revisi reason)
  const keteranganText =
    data.keterangan ||
    (data.is_revisi
      ? data.keterangan_revisi || 'Revisi Diet'
      : data.kelas
        ? `Kelas ${data.kelas}`
        : '-');

  return (
    <div
      className={`etiket-card etiket-card-print bg-white text-black font-sans w-[390px] min-h-[225px] shrink-0 select-none relative overflow-hidden p-3.5 flex flex-col justify-between border border-black rounded-xs shadow-xs ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '390px',
        minHeight: '225px',
      }}
    >
      {/* 1. Header: Logo RSUD Kiri, Judul ETIKET DIET PASIEN, Logo Tradco Kanan */}
      <div>
        <div className='flex items-center justify-between gap-2 pb-1'>
          {/* Logo RSUD Garut */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/icons/logo-rsud.png'
            alt='Logo RSUD'
            className='w-9 h-9 object-contain shrink-0 pointer-events-none'
          />

          {/* Judul Utama Tengah */}
          <div className='flex flex-col items-center justify-center flex-1 min-w-0 text-center'>
            <div className='flex items-center gap-1.5 justify-center flex-wrap'>
              <h2 className='text-[13px] sm:text-[14px] font-bold tracking-wider text-black font-serif uppercase m-0 leading-tight underline underline-offset-3 decoration-1'>
                {activeHeaderTitle}
              </h2>
              {data.is_revisi && (
                <Badge
                  variant='outline'
                  className='text-[8px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200 border-amber-500 h-4 px-1 py-0 leading-none shrink-0 rounded-xs'
                >
                  REVISI
                </Badge>
              )}
            </div>
          </div>

          {/* Logo Tradco Energy */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/icons/logo-tradco.png'
            alt='Logo Tradco'
            className='w-9 h-9 object-contain shrink-0 pointer-events-none'
          />
        </div>

        {/* Garis Horizontal Pembatas Header */}
        <div className='w-full border-t border-black' />
      </div>

      {/* 2. Body Berdasarkan Varian */}
      {variant === 'diet-focus' ? (
        /* =========================================================================
           VARIAN 1: FOKUS DIET (Gambar 1 - Subjudul Nama Diet & Garis Pembatas Kolom)
           ========================================================================= */
        <div className='flex-1 flex flex-col justify-between py-1'>
          {/* Subjudul Tengah: NAMA DIET */}
          <div className='text-center py-0.5'>
            <h3 className='text-[12.5px] sm:text-[13px] font-bold tracking-wider uppercase text-black font-serif truncate px-2'>
              {data.diet || 'NAMA DIET'}
            </h3>
          </div>

          {/* Grid Konten 2 Kolom dengan Garis Horizontal */}
          <div className='grid grid-cols-2 gap-x-3 gap-y-1.5 text-black'>
            {/* Kolom Kiri: NAMA, TTL */}
            <div className='flex flex-col gap-1'>
              {/* Field NAMA dengan garis bawah penuh */}
              <div className='border-b border-black pb-0.5 flex items-baseline justify-between gap-1 overflow-hidden'>
                <span className='text-[10px] font-bold uppercase tracking-wide shrink-0 text-black'>
                  NAMA
                </span>
                <span
                  className='text-[11px] font-bold uppercase text-black truncate text-right'
                  title={data.nama}
                >
                  {data.nama}
                </span>
              </div>

              {/* Field TTL */}
              <div className='flex items-baseline text-[10px] gap-1'>
                <span className='font-bold uppercase tracking-wide shrink-0 text-black w-8'>
                  TTL
                </span>
                <span className='text-black truncate'>
                  : {data.tgl_lahir || '-'}
                </span>
              </div>
            </div>

            {/* Kolom Kanan: NRM, RUANGAN */}
            <div className='flex flex-col gap-1'>
              {/* Field NRM dengan garis bawah penuh */}
              <div className='border-b border-black pb-0.5 flex items-baseline justify-between gap-1 overflow-hidden'>
                <span className='text-[10px] font-bold uppercase tracking-wide shrink-0 text-black'>
                  NRM
                </span>
                <span
                  className='text-[11px] font-bold text-black truncate text-right'
                  title={data.no_rm}
                >
                  {data.no_rm || '-'}
                </span>
              </div>

              {/* Field RUANGAN */}
              <div className='flex items-baseline text-[10px] gap-1'>
                <span className='font-bold uppercase tracking-wide shrink-0 text-black w-14'>
                  RUANGAN
                </span>
                <span
                  className='font-bold text-black truncate'
                  title={displayRoom}
                >
                  : {displayRoom}
                </span>
              </div>
            </div>
          </div>

          {/* Baris Bawah Kolom Kiri: Waktu Makan & Tgl Produksi */}
          <div className='grid grid-cols-2 gap-x-3 text-black pt-1'>
            <div className='flex flex-col gap-1'>
              {/* Field WAKTU / PAGI/SIANG/MALAM dengan garis bawah */}
              <div className='border-b border-black pb-0.5 flex items-baseline justify-between gap-1'>
                {mealTimeFormat === 'slash' ? (
                  <div className='text-[10px] font-bold tracking-tight flex items-center gap-1 uppercase'>
                    <span
                      className={
                        mealTimeUpper === 'PAGI'
                          ? 'underline decoration-2 font-black'
                          : 'opacity-70'
                      }
                    >
                      PAGI
                    </span>
                    <span>/</span>
                    <span
                      className={
                        mealTimeUpper === 'SIANG'
                          ? 'underline decoration-2 font-black'
                          : 'opacity-70'
                      }
                    >
                      SIANG
                    </span>
                    <span>/</span>
                    <span
                      className={
                        mealTimeUpper === 'MALAM'
                          ? 'underline decoration-2 font-black'
                          : 'opacity-70'
                      }
                    >
                      MALAM
                    </span>
                  </div>
                ) : (
                  <span className='text-[10px] font-bold uppercase tracking-wide'>
                    WAKTU
                  </span>
                )}
                <span className='text-[10px] font-extrabold uppercase px-1 rounded-xs bg-neutral-900 text-white leading-tight'>
                  {mealTimeUpper}
                </span>
              </div>

              {/* Field TGL PRODUKSI */}
              <div className='flex items-baseline text-[9.5px] gap-1'>
                <span className='font-bold uppercase tracking-wide shrink-0 text-black'>
                  {customDateLabel || 'TGL PRODUKSI'}
                </span>
                <span className='text-black'>: {displayDate}</span>
              </div>

              {/* Catatan di Kolom Kiri (Sesuai Gambar 1) */}
              {showNotice && activeNotice.trim() && (
                <div className='text-[8.5px] text-black font-sans font-medium tracking-tight mt-0.5 leading-tight'>
                  {activeNotice}
                </div>
              )}
            </div>

            {/* Sisi Kanan Kosong / Ruang Keterangan Revisi Tambahan */}
            <div className='flex flex-col justify-end text-right'>
              {data.is_revisi && keteranganText !== '-' && (
                <div className='text-[9px] text-black font-semibold italic bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300'>
                  Ket: {keteranganText}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           VARIAN 2: FOKUS RUANGAN (Gambar 2 - Subjudul Melati 1 & 2 Kolom Titik Dua)
           ========================================================================= */
        <div className='flex-1 flex flex-col justify-between py-1'>
          {/* Subjudul Tengah: RUANGAN / MELATI 1 */}
          <div className='text-center py-0.5'>
            <h3 className='text-[13px] sm:text-[14px] font-bold tracking-wider uppercase text-black font-serif truncate px-2'>
              {displayRoom}
            </h3>
          </div>

          {/* 2 Kolom Titik Dua (Sesuai Gambar 2) */}
          <div className='grid grid-cols-2 gap-x-2 text-[10.5px] leading-tight text-black'>
            {/* Kolom Kiri: Nama, Tgl. lahir, No. RM */}
            <div className='space-y-1 pr-1'>
              <div className='flex items-baseline'>
                <span className='w-16 font-bold shrink-0 text-black'>Nama</span>
                <span
                  className='font-bold text-black truncate'
                  title={data.nama}
                >
                  : {data.nama}
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='w-16 font-bold shrink-0 text-black'>
                  Tgl. lahir
                </span>
                <span className='text-black'>: {data.tgl_lahir || '-'}</span>
              </div>
              <div className='flex items-baseline'>
                <span className='w-16 font-bold shrink-0 text-black'>
                  No. RM
                </span>
                <span className='text-black'>: {data.no_rm || '-'}</span>
              </div>
            </div>

            {/* Kolom Kanan: Diet, Keterangan, Waktu, Tanggal Order */}
            <div className='space-y-1 pl-1'>
              <div className='flex items-baseline'>
                <span className='w-20 font-bold shrink-0 text-black'>Diet</span>
                <span
                  className='font-bold text-black truncate'
                  title={data.diet}
                >
                  : {data.diet}
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='w-20 font-bold shrink-0 text-black'>
                  Keterangan
                </span>
                <span
                  className='text-black truncate'
                  title={keteranganText}
                >
                  : {keteranganText}
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='w-20 font-bold shrink-0 text-black'>
                  Waktu
                </span>
                <span className='font-bold text-black'>
                  :{' '}
                  {mealTimeFormat === 'slash' ? (
                    <span className='inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase'>
                      <span
                        className={
                          mealTimeUpper === 'PAGI'
                            ? 'underline decoration-2 font-black'
                            : 'opacity-70'
                        }
                      >
                        PAGI
                      </span>
                      <span>/</span>
                      <span
                        className={
                          mealTimeUpper === 'SIANG'
                            ? 'underline decoration-2 font-black'
                            : 'opacity-70'
                        }
                      >
                        SIANG
                      </span>
                      <span>/</span>
                      <span
                        className={
                          mealTimeUpper === 'MALAM'
                            ? 'underline decoration-2 font-black'
                            : 'opacity-70'
                        }
                      >
                        MALAM
                      </span>
                    </span>
                  ) : (
                    mealTimeUpper
                  )}
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='w-20 font-bold shrink-0 text-black'>
                  {customDateLabel || 'Tanggal Order'}
                </span>
                <span className='text-black'>: {displayDate}</span>
              </div>
            </div>
          </div>

          {/* Catatan di Bawah Kolom Kanan (Sesuai Gambar 2) */}
          {showNotice && activeNotice.trim() && (
            <div className='text-right text-[8.5px] text-black font-sans font-medium tracking-tight mt-0.5'>
              {activeNotice}
            </div>
          )}
        </div>
      )}

      {/* 3. Bagian Quotes Motivasi di Bawah (Diapit Garis Kiri-Kanan) */}
      {showQuote && activeQuote.trim() && (
        <div className='flex items-center justify-center gap-2 mt-1.5 pt-1 text-center'>
          <span className='h-[1px] bg-black flex-1 max-w-[42px]'></span>
          <p className='font-serif italic font-bold text-[11px] sm:text-[11.5px] leading-tight text-center px-1 text-black'>
            &ldquo;{activeQuote}&rdquo;
          </p>
          <span className='h-[1px] bg-black flex-1 max-w-[42px]'></span>
        </div>
      )}
    </div>
  );
}

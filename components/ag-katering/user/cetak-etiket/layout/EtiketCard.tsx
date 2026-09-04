'use client';

import React from 'react';
import type { EtiketData } from '@/types/pemorsiantypes';

interface EtiketCardProps {
  data: EtiketData;
  className?: string;
  isDraggable?: boolean;
  customQuote?: string;
  customNotice?: string;
  showQuote?: boolean;
  showNotice?: boolean;
}

export default function EtiketCard({
  data,
  className = '',
  customQuote,
  customNotice,
  showQuote = true,
  showNotice = true,
}: EtiketCardProps) {
  const mealTimeUpper = (data.waktu || 'SIANG').toUpperCase();
  const activeQuote =
    customQuote !== undefined
      ? customQuote
      : data.quote || 'Setiap suapan adalah langkah menuju sehat';

  const activeNotice =
    customNotice !== undefined
      ? customNotice
      : data.catatan_alat || '*Alat makan diambil 1 jam setelah pengantaran';

  const keteranganText =
    data.keterangan ||
    (data.is_revisi
      ? data.keterangan_revisi || 'Revisi Diet'
      : data.kelas
        ? `Kelas ${data.kelas}`
        : '-');

  return (
    <div
      className={`etiket-card etiket-card-print bg-white text-black font-sans w-[390px] min-h-[220px] shrink-0 select-none relative overflow-hidden p-3.5 flex flex-col justify-between border border-black rounded-xs shadow-xs ${className}`}
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '390px',
        minHeight: '220px',
      }}
    >
      {/* 1. Header: Logo RSUD Kiri, Judul ETIKET DIET PASIEN, Logo Tradco Kanan */}
      <div className='flex items-center justify-between gap-2 pb-1.5'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/icons/logo-rsud.png'
          alt='Logo RSUD'
          className='w-9 h-9 object-contain shrink-0 pointer-events-none'
        />

        <div className='flex flex-col items-center justify-center flex-1 min-w-0 text-center'>
          <div className='flex items-center gap-1.5 justify-center'>
            <h2 className='text-[13px] sm:text-[14px] font-bold tracking-wide text-black font-sans uppercase m-0 leading-tight underline underline-offset-3 decoration-1'>
              ETIKET DIET PASIEN
            </h2>
            {data.is_revisi && (
              <span className='text-[8px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200 px-1 py-0.2 rounded border border-amber-500 leading-none shrink-0'>
                REVISI
              </span>
            )}
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/icons/logo-tradco.png'
          alt='Logo Tradco'
          className='w-9 h-9 object-contain shrink-0 pointer-events-none'
        />
      </div>

      {/* Garis Horizontal Pembatas Header */}
      <div className='w-full border-t border-black mb-1.5' />

      {/* 2. Grid Tabel 2 Kolom (Sesuai Format Blangko Dotted) */}
      <div className='flex-1 flex flex-col justify-center'>
        <table className='w-full border-collapse border border-dotted border-gray-600 text-[11px] leading-tight text-black'>
          <tbody>
            {/* Baris 1: Nama & Diet */}
            <tr>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-16 font-semibold shrink-0 text-black'>
                    Nama
                  </span>
                  <span className='font-bold text-black truncate' title={data.nama}>
                    : {data.nama}
                  </span>
                </div>
              </td>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-18 font-semibold shrink-0 text-black'>
                    Diet
                  </span>
                  <span className='font-bold text-black break-words'>
                    : {data.diet}
                  </span>
                </div>
              </td>
            </tr>

            {/* Baris 2: Tgl. lahir & Keterangan */}
            <tr>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-16 font-semibold shrink-0 text-black'>
                    Tgl. lahir
                  </span>
                  <span className='text-black'>: {data.tgl_lahir || '-'}</span>
                </div>
              </td>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-18 font-semibold shrink-0 text-black'>
                    Keterangan
                  </span>
                  <span
                    className='text-black break-words line-clamp-1'
                    title={keteranganText}
                  >
                    : {keteranganText}
                  </span>
                </div>
              </td>
            </tr>

            {/* Baris 3: Ruang & Waktu */}
            <tr>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-16 font-semibold shrink-0 text-black'>
                    Ruang
                  </span>
                  <span className='text-black truncate'>
                    : {data.ruangan} {data.bed ? `(${data.bed})` : ''}
                  </span>
                </div>
              </td>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-18 font-semibold shrink-0 text-black'>
                    Waktu
                  </span>
                  <span className='font-bold text-black'>
                    : {mealTimeUpper}
                  </span>
                </div>
              </td>
            </tr>

            {/* Baris 4: No. RM & Exp. Date */}
            <tr>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-16 font-semibold shrink-0 text-black'>
                    No. RM
                  </span>
                  <span className='text-black'>: {data.no_rm || '-'}</span>
                </div>
              </td>
              <td className='border border-dotted border-gray-500 px-1.5 py-1 w-[50%] align-top'>
                <div className='flex items-baseline'>
                  <span className='w-18 font-semibold shrink-0 text-black'>
                    Exp. Date
                  </span>
                  <span className='text-black'>: {data.exp_date || '-'}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Catatan di bawah tabel (Sisi Kanan) */}
        {showNotice && activeNotice.trim() && (
          <div className='text-right text-[9px] text-black mt-1 font-sans font-medium tracking-tight'>
            {activeNotice}
          </div>
        )}
      </div>

      {/* 3. Bagian Quotes Motivasi di Bagian Bawah */}
      {showQuote && activeQuote.trim() && (
        <div className='flex items-center justify-center gap-2 mt-2 pt-1 text-center'>
          <span className='h-[1px] bg-black flex-1 max-w-[36px]'></span>
          <p className='font-serif italic font-semibold text-[11px] sm:text-[11.5px] leading-tight text-center px-1 text-black'>
            &ldquo;{activeQuote}&rdquo;
          </p>
          <span className='h-[1px] bg-black flex-1 max-w-[36px]'></span>
        </div>
      )}
    </div>
  );
}


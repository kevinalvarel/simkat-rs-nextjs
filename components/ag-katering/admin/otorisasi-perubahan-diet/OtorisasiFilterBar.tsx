'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OtorisasiFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedWaktu: string;
  onWaktuChange: (w: string) => void;
  selectedJenis: string;
  onJenisChange: (j: string) => void;
  onReset: () => void;
}

export default function OtorisasiFilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedWaktu,
  onWaktuChange,
  selectedJenis,
  onJenisChange,
  onReset,
}: OtorisasiFilterBarProps) {
  const isFiltered =
    searchQuery !== '' ||
    selectedStatus !== 'PENDING' ||
    selectedWaktu !== 'ALL' ||
    selectedJenis !== 'ALL';

  return (
    <div className='flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-xl border shadow-xs w-full min-w-0'>
      {/* Search Input */}
      <div className='relative flex-1 w-full min-w-0'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder='Cari Pasien, No RM, Ruangan, atau Jenis Diet...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9 text-xs sm:text-sm rounded-lg bg-background w-full'
        />
      </div>

      {/* Filter Dropdowns */}
      <div className='grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto min-w-0'>
        {/* Status Filter (Default PENDING) */}
        <div className='flex items-center gap-1.5 min-w-0 col-span-1'>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className='h-9 w-full rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 px-2.5 sm:px-3 text-xs font-semibold text-amber-900 dark:text-amber-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30'
          >
            <option value='PENDING'>PENDING (Antrean Otorisasi)</option>
            <option value='APPROVED'>APPROVED (Disetujui Admin)</option>
            <option value='REJECTED'>REJECTED (Ditolak Admin)</option>
            <option value='SELESAI'>SELESAI</option>
            <option value='ALL'>Semua Status</option>
          </select>
        </div>

        {/* Waktu Makan */}
        <div className='flex items-center gap-1.5 min-w-0 col-span-1'>
          <select
            value={selectedWaktu}
            onChange={(e) => onWaktuChange(e.target.value)}
            className='h-9 w-full rounded-lg border border-input bg-background px-2.5 sm:px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20'
          >
            <option value='ALL'>Semua Waktu Makan</option>
            <option value='PAGI'>PAGI</option>
            <option value='SIANG'>SIANG</option>
            <option value='MALAM'>MALAM</option>
          </select>
        </div>

        {/* Jenis Perubahan */}
        <div className='flex items-center gap-1.5 min-w-0 col-span-2 sm:col-span-1'>
          <select
            value={selectedJenis}
            onChange={(e) => onJenisChange(e.target.value)}
            className='h-9 w-full rounded-lg border border-input bg-background px-2.5 sm:px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/20'
          >
            <option value='ALL'>Semua Jenis Perubahan</option>
            <option value='DIET_CHANGE'>Perubahan Diet</option>
            <option value='NEW_PATIENT'>Pasien Baru (Emergent)</option>
            <option value='ROOM_TRANSFER'>Pindah Ruangan</option>
            <option value='NPO'>NPO / Puasa</option>
            <option value='DISCHARGE'>Pasien Pulang</option>
            <option value='KOREKSI_NAMA'>Koreksi Nama</option>
            <option value='KOREKSI_NO_RM'>Koreksi No RM</option>
            <option value='KOREKSI_KELAS'>Koreksi Kelas</option>
            <option value='KOREKSI_KAMAR'>Koreksi No Kamar</option>
            <option value='KOREKSI_BED'>Koreksi Bed</option>
          </select>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            className='h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 col-span-2 sm:col-span-1 justify-center'
          >
            <RotateCcw className='w-3.5 h-3.5' /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}

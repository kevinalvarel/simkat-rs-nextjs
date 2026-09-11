'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Printer, Download, RefreshCw, Layers } from 'lucide-react';
import type { DpmpSummaryData } from '@/types/dpmptypes';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import DpmpDateWaktuPicker, {
  type WaktuMakanType,
} from './DpmpDateWaktuPicker';

interface DpmpHeaderProps {
  data: DpmpSummaryData;
  selectedDate: string;
  selectedWaktu: WaktuMakanType;
  onFilterChange: (date: string, waktu: WaktuMakanType) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function DpmpHeader({
  data,
  selectedDate,
  selectedWaktu,
  onFilterChange,
  isRefreshing,
  onRefresh,
}: DpmpHeaderProps) {
  // Export Excel function
  function handleExportExcel() {
    try {
      const rows = data.patients.map((p, idx) => ({
        No: idx + 1,
        'No RM': p.no_rm,
        'Nama Pasien': p.nama_pasien,
        Ruangan: p.ruangan,
        Kamar: p.kamar || '—',
        Bed: p.bed,
        Kelas: p.kelas,
        Diet: p.diet,
        'Waktu Makan': p.waktu,
        Status: p.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const batchName =
        data.batch?.batch_code || `DPMP_${selectedDate}_${selectedWaktu}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Pasien');

      XLSX.writeFile(workbook, `DPMP_Tanda_Terima_${batchName}.xlsx`);
      toast.success('File Excel DPMP berhasil diunduh.');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Gagal mengunduh file Excel.');
    }
  }

  const currentBatch = data.batch;
  const docNumber = data.dpmpNumber || data.kwitansiNumber;

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      {/* Title & Info */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25'>
            <FileText className='w-3 h-3' /> DPMP & Tanda Terima
          </span>
          <span className='font-mono text-xs text-muted-foreground'>
            {docNumber}
          </span>
          {currentBatch && (
            <span className='font-mono text-[11px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md'>
              {currentBatch.batch_code}
            </span>
          )}
        </div>

        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          Daftar Permintaan Makanan Pasien (DPMP)
        </h1>

        <p className='text-xs sm:text-sm text-muted-foreground'>
          Dokumen resmi DPMP dan bukti tanda terima distribusi penyerahan
          makanan pasien per ruangan rawat inap untuk{' '}
          <strong className='text-foreground'>{data.tanggalFormatted}</strong>{' '}
          (Makan{' '}
          <strong className='text-foreground'>
            {data.waktuMakanFormatted}
          </strong>
          ).
        </p>
      </div>

      {/* Actions & Calendar + Meal Time Selection */}
      <div className='flex flex-wrap items-center gap-2.5 self-start sm:self-auto'>
        {/* Shadcn Calendar Date + Meal Time Filter */}
        <DpmpDateWaktuPicker
          selectedDate={selectedDate}
          selectedWaktu={selectedWaktu}
          onChange={onFilterChange}
          existingWaktuForDate={data.existingWaktuForDate}
          currentLiveWaktu={data.currentLiveWaktu}
          isLocked={currentBatch?.status_batch === 'LOCKED'}
          disabled={isRefreshing}
        />

        {/* Refresh button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='h-9 px-2.5 rounded-xl border-border/80 text-muted-foreground hover:text-foreground cursor-pointer'
          title='Refresh Data'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>

        {/* Export Excel */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleExportExcel}
          className='h-9 px-3 text-xs gap-1.5 rounded-xl border-border/80 text-foreground hover:bg-muted cursor-pointer shadow-2xs font-medium'
        >
          <Download className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
          <span className='hidden sm:inline'>Ekspor</span> Excel
        </Button>
      </div>
    </div>
  );
}

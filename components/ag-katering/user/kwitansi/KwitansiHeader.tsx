'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Printer,
  Download,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { KwitansiSummaryData } from '@/types/kwitansitypes';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface KwitansiHeaderProps {
  data: KwitansiSummaryData;
  selectedBatchId?: number;
  onBatchChange: (batchId: number) => void;
  onOpenPrintModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  selectedCount: number;
}

export default function KwitansiHeader({
  data,
  selectedBatchId,
  onBatchChange,
  onOpenPrintModal,
  isRefreshing,
  onRefresh,
  selectedCount,
}: KwitansiHeaderProps) {
  // Export Excel function
  function handleExportExcel() {
    try {
      const rows = data.patients.map((p, idx) => ({
        No: idx + 1,
        'No RM': p.no_rm,
        'Nama Pasien': p.nama_pasien,
        Gedung: p.gedung,
        Ruangan: p.ruangan,
        Bed: p.bed,
        Kelas: p.kelas,
        Diet: p.diet,
        'Waktu Makan': p.waktu,
        Status: p.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const batchName = data.batch?.batch_code || 'Kwitansi_Pasien';
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Pasien');

      XLSX.writeFile(workbook, `Tanda_Terima_Kwitansi_${batchName}.xlsx`);
      toast.success('File Excel berhasil diunduh.');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Gagal mengunduh file Excel.');
    }
  }

  const currentBatch = data.batch;

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      {/* Title & Info */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25'>
            <FileText className='w-3 h-3' /> Kwitansi & Tanda Terima
          </span>
          <span className='font-mono text-xs text-muted-foreground'>
            {data.kwitansiNumber}
          </span>
        </div>

        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          Kwitansi Distribusi & Penyerahan Makanan
        </h1>

        <p className='text-xs sm:text-sm text-muted-foreground'>
          Bukti tanda terima penyerahan makanan pasien per ruangan dan bangsal perawatan rumah sakit.
        </p>
      </div>

      {/* Actions & Batch Selection */}
      <div className='flex flex-wrap items-center gap-2.5 self-start sm:self-auto'>
        {/* Batch Selector Dropdown */}
        {data.availableBatches.length > 0 && (
          <div className='flex items-center gap-1.5 bg-background border rounded-xl px-2 py-0.5 shadow-2xs'>
            <Layers className='w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1' />
            <Select
              value={String(currentBatch?.id || data.availableBatches[0].id)}
              onValueChange={(val) => onBatchChange(Number(val))}
            >
              <SelectTrigger className='h-8 text-xs font-semibold border-0 bg-transparent focus:ring-0 w-[190px] shadow-none cursor-pointer'>
                <SelectValue placeholder='Pilih Batch Snapshot' />
              </SelectTrigger>
              <SelectContent>
                {data.availableBatches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)} className='text-xs'>
                    {b.batch_code} ({b.waktu_makan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {/* Print Kwitansi Button */}
        <Button
          size='sm'
          onClick={onOpenPrintModal}
          className='h-9 px-3.5 text-xs gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs font-bold'
        >
          <Printer className='w-3.5 h-3.5' />
          {selectedCount > 0
            ? `Cetak Kwitansi (${selectedCount} Terpilih)`
            : 'Cetak Tanda Terima'}
        </Button>
      </div>
    </div>
  );
}

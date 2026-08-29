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
  Receipt,
  Printer,
  Download,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import type { InvoiceDailySummary } from '@/types/invoicetypes';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface InvoiceHeaderProps {
  data: InvoiceDailySummary;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenPrintModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function InvoiceHeader({
  data,
  selectedDate,
  onDateChange,
  onOpenPrintModal,
  isRefreshing,
  onRefresh,
}: InvoiceHeaderProps) {
  // Export Excel function using XLSX
  function handleExportExcel() {
    try {
      const rows = data.classes.map((c, idx) => ({
        No: idx + 1,
        'Kelas Perawatan': c.kelas,
        'Pasien Terlayani': c.totalPasien,
        'Makan Pagi (Porsi)': c.pagiCount,
        'Makan Siang (Porsi)': c.siangCount,
        'Makan Malam (Porsi)': c.malamCount,
        'Extra / Snack (Porsi)': c.extraCount,
        'Total Porsi Harian': c.totalPorsi,
      }));

      // Append Total Row
      rows.push({
        No: 'TOTAL' as any,
        'Kelas Perawatan': 'TOTAL KESELURUHAN',
        'Pasien Terlayani': data.grandTotalPasien,
        'Makan Pagi (Porsi)': data.grandTotalPagi,
        'Makan Siang (Porsi)': data.grandTotalSiang,
        'Makan Malam (Porsi)': data.grandTotalMalam,
        'Extra / Snack (Porsi)': data.grandTotalExtra,
        'Total Porsi Harian': data.grandTotalPorsi,
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `Konsumsi_${data.tanggal}`,
      );

      XLSX.writeFile(
        workbook,
        `Rekap_Konsumsi_Makanan_Harian_${data.tanggal}.xlsx`,
      );
      toast.success('File Excel berhasil diunduh.');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Gagal mengunduh file Excel.');
    }
  }

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      {/* Title & Info */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25'>
            <Receipt className='w-3 h-3' /> Rekapitulasi Harian
          </span>
          <span className='font-mono text-xs text-muted-foreground'>
            {data.invoiceNumber}
          </span>
        </div>

        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          Konsumsi Makanan Harian per Kelas
        </h1>

        <p className='text-xs sm:text-sm text-muted-foreground'>
          Laporan rekapitulasi jumlah porsi makan pasien rumah sakit berdasarkan kelas perawatan.
        </p>
      </div>

      {/* Actions & Filters */}
      <div className='flex flex-wrap items-center gap-2.5 self-start sm:self-auto'>
        {/* Date Selector */}
        <div className='flex items-center gap-1.5 bg-background border rounded-xl px-2.5 py-1 shadow-2xs'>
          <Calendar className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
          <input
            type='date'
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className='bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer'
          />
        </div>

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

        {/* Print Button */}
        <Button
          size='sm'
          onClick={onOpenPrintModal}
          className='h-9 px-3.5 text-xs gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs font-bold'
        >
          <Printer className='w-3.5 h-3.5' />
          Cetak Dokumen
        </Button>
      </div>
    </div>
  );
}

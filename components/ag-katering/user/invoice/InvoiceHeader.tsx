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
import InvoiceDateRangePicker, {
  type DateRangeValue,
} from './InvoiceDateRangePicker';

interface InvoiceHeaderProps {
  data: InvoiceDailySummary;
  dateRange: DateRangeValue;
  onDateRangeChange: (range: DateRangeValue) => void;
  onOpenPrintModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function InvoiceHeader({
  data,
  dateRange,
  onDateRangeChange,
  onOpenPrintModal,
  isRefreshing,
  onRefresh,
}: InvoiceHeaderProps) {
  const isRange = Boolean(data.isRange);

  // Export Excel function using XLSX
  function handleExportExcel() {
    try {
      const rows = data.classes.map((c, idx) => ({
        No: idx + 1,
        'Kelas Perawatan': c.kelas,
        [isRange ? 'Pasien Terlayani (Hari)' : 'Pasien Terlayani']:
          c.totalPasien,
        'Makan Pagi (Porsi)': c.pagiCount,
        'Makan Siang (Porsi)': c.siangCount,
        'Makan Malam (Porsi)': c.malamCount,
        'Extra / Snack (Porsi)': c.extraCount,
        [isRange ? 'Total Porsi Periode' : 'Total Porsi Harian']: c.totalPorsi,
      }));

      // Append Total Row
      rows.push({
        No: 'TOTAL' as any,
        'Kelas Perawatan': 'TOTAL KESELURUHAN',
        [isRange ? 'Pasien Terlayani (Hari)' : 'Pasien Terlayani']:
          data.grandTotalPasien,
        'Makan Pagi (Porsi)': data.grandTotalPagi,
        'Makan Siang (Porsi)': data.grandTotalSiang,
        'Makan Malam (Porsi)': data.grandTotalMalam,
        'Extra / Snack (Porsi)': data.grandTotalExtra,
        [isRange ? 'Total Porsi Periode' : 'Total Porsi Harian']:
          data.grandTotalPorsi,
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const sheetName = isRange
        ? `Periode_${data.startDate || 'Range'}`.slice(0, 31)
        : `Konsumsi_${data.tanggal}`.slice(0, 31);

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = isRange
        ? `Rekap_Konsumsi_Makanan_Periode_${data.startDate}_sd_${data.endDate}.xlsx`
        : `Rekap_Konsumsi_Makanan_Harian_${data.tanggal}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success(
        isRange
          ? 'File Excel rekapitulasi periode berhasil diunduh.'
          : 'File Excel berhasil diunduh.',
      );
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
            <Receipt className='w-3 h-3' />{' '}
            {isRange
              ? `Rekapitulasi Periode (${data.totalDays} Hari)`
              : 'Rekapitulasi Harian'}
          </span>
          <span className='font-mono text-xs text-muted-foreground'>
            {data.invoiceNumber}
          </span>
        </div>

        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
          {isRange
            ? 'Konsumsi Makanan Periode per Kelas'
            : 'Konsumsi Makanan Harian per Kelas'}
        </h1>

        <p className='text-xs sm:text-sm text-muted-foreground'>
          {isRange
            ? `Laporan rekapitulasi jumlah porsi makan pasien rumah sakit periode ${data.tanggalFormatted}.`
            : 'Laporan rekapitulasi jumlah porsi makan pasien rumah sakit berdasarkan kelas perawatan.'}
        </p>
      </div>

      {/* Actions & Filters */}
      <div className='flex flex-wrap items-center gap-2.5 self-start sm:self-auto'>
        {/* Shadcn Date Range Picker */}
        <InvoiceDateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
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

        {/* Print Button */}
        <Button
          size='sm'
          onClick={onOpenPrintModal}
          className='h-9 px-3.5 text-xs gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs font-bold'
        >
          <Printer className='w-3.5 h-3.5' />
          {isRange ? 'Cetak Periode' : 'Cetak Dokumen'}
        </Button>
      </div>
    </div>
  );
}

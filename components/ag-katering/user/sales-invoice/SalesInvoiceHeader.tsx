'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  Printer,
  Download,
  RefreshCw,
  Sunrise,
  Sun,
  Moon,
  Layers,
  Sparkles,
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';
import type { SalesInvoiceSummary } from '@/types/invoicetypes';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import InvoiceDateRangePicker, {
  type DateRangeValue,
} from '../invoice/InvoiceDateRangePicker';
import { cn } from '@/lib/utils';

interface SalesInvoiceHeaderProps {
  data: SalesInvoiceSummary;
  selectedDate: string;
  selectedWaktu: string;
  onSnapshotChange: (date: string, waktu: string) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (range: DateRangeValue) => void;
  onOpenPrintModal: () => void;
  onOpenMonthlyModal: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function SalesInvoiceHeader({
  data,
  selectedDate,
  selectedWaktu,
  onSnapshotChange,
  dateRange,
  onDateRangeChange,
  onOpenPrintModal,
  onOpenMonthlyModal,
  isRefreshing,
  onRefresh,
}: SalesInvoiceHeaderProps) {
  const isRange = Boolean(data.isRange);
  const isPerSnapshot = Boolean(data.isPerSnapshot);

  const lockedMealtimes = useMemo(() => {
    const set = new Set<string>();
    if (data.availableBatches) {
      for (const b of data.availableBatches) {
        if (b.tanggal_produksi === selectedDate) {
          set.add(b.waktu_makan.toUpperCase());
        }
      }
    }
    return set;
  }, [data.availableBatches, selectedDate]);

  function formatCurrency(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function handleExportExcel() {
    try {
      const rows = data.lineItems.map((item) => ({
        No: item.no,
        'Nama Barang': item.namaBarang,
        Type: item.type,
        Banyaknya: item.banyaknya,
        Satuan: item.satuan,
        'Harga Satuan (Rp)': item.hargaSatuan,
        'Jumlah Harga (Rp)': item.jumlahHarga,
      }));

      // Add total row
      rows.push({
        No: '' as any,
        'Nama Barang': 'TOTAL',
        Type: '',
        Banyaknya: data.totalBanyaknya,
        Satuan: 'Porsi',
        'Harga Satuan (Rp)': '' as any,
        'Jumlah Harga (Rp)': data.totalHarga,
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const sheetName = isPerSnapshot
        ? `FakturPenjualan_${data.waktuMakan}_${selectedDate}`.slice(0, 31)
        : isRange
          ? `FakturPenjualan_${data.startDate || 'Range'}`.slice(0, 31)
          : `FakturPenjualan_${data.tanggal}`.slice(0, 31);

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = isPerSnapshot
        ? `Faktur_Penjualan_Snapshot_${data.waktuMakan}_${selectedDate}.xlsx`
        : isRange
          ? `Faktur_Penjualan_Periode_${data.startDate}_sd_${data.endDate}.xlsx`
          : `Faktur_Penjualan_Harian_${data.tanggal}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success('File Excel faktur penjualan berhasil diunduh.');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Gagal mengunduh file Excel.');
    }
  }

  const mealtimeOptions = [
    {
      id: 'PAGI',
      label: 'Pagi',
      icon: Sunrise,
      color: 'text-amber-500',
    },
    {
      id: 'SIANG',
      label: 'Siang',
      icon: Sun,
      color: 'text-orange-500',
    },
    {
      id: 'MALAM',
      label: 'Malam',
      icon: Moon,
      color: 'text-indigo-400',
    },
    {
      id: 'ALL',
      label: 'Semua',
      icon: Layers,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className='flex flex-col gap-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      {/* Top Row: Title, Badges & Actions */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-1.5'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25'>
              <Receipt className='w-3 h-3' />
              {isRange
                ? `Faktur Penjualan Periode (${data.totalDays} Hari)`
                : isPerSnapshot
                  ? `Faktur Penjualan Snapshot ${data.waktuMakan}`
                  : 'Faktur Penjualan Harian'}
            </span>

            {data.batchId && (
              <Badge
                variant='outline'
                className='text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1'
              >
                <CheckCircle2 className='w-2.5 h-2.5 text-blue-500' />
                Batch #{data.batchId} (
                {data.statusBatch === 'OFFICIAL_LOCKED'
                  ? 'LOCKED'
                  : 'PREVIEW'}
                )
              </Badge>
            )}

            {isPerSnapshot && (data.revisiTambahPasienCount ?? 0) > 0 && (
              <Badge
                variant='outline'
                className='text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 animate-pulse'
              >
                <Sparkles className='w-2.5 h-2.5 text-amber-500' />
                +{data.revisiTambahPasienCount} Pasien Susulan
              </Badge>
            )}

            {data.totalHarga > 0 && (
              <Badge
                variant='outline'
                className='text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1'
              >
                {formatCurrency(data.totalHarga)}
              </Badge>
            )}
          </div>

          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2'>
            {isRange
              ? 'Faktur Penjualan Periode per Kelas'
              : isPerSnapshot
                ? `Faktur Penjualan Snapshot ${data.waktuMakan} per Kelas`
                : 'Faktur Penjualan Harian per Kelas'}
          </h1>

          <p className='text-xs sm:text-sm text-muted-foreground'>
            {isPerSnapshot ? (
              <>
                Faktur penjualan dengan rincian harga satuan dan jumlah harga per
                kelas berdasarkan snapshot {data.waktuMakan}
                {data.cutoffTime ? ` (Cut-off ${data.cutoffTime})` : ''}.
              </>
            ) : isRange ? (
              `Faktur penjualan periode ${data.tanggalFormatted} — termasuk harga satuan dan total harga.`
            ) : (
              'Faktur penjualan harian dengan rincian harga satuan dan jumlah harga per kelas perawatan.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap items-center gap-2 self-start sm:self-auto'>
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

          <Button
            variant='outline'
            size='sm'
            onClick={handleExportExcel}
            className='h-9 px-3 text-xs gap-1.5 rounded-xl border-border/80 text-foreground hover:bg-muted cursor-pointer shadow-2xs font-medium'
          >
            <Download className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
            <span className='hidden sm:inline'>Ekspor</span> Excel
          </Button>

          {/* Monthly Print Button */}
          <Button
            variant='outline'
            size='sm'
            onClick={onOpenMonthlyModal}
            className='h-9 px-3 text-xs gap-1.5 rounded-xl border-border/80 text-foreground hover:bg-muted cursor-pointer shadow-2xs font-medium'
          >
            <CalendarRange className='w-3.5 h-3.5 text-violet-600 dark:text-violet-400' />
            <span className='hidden sm:inline'>Cetak</span> Bulanan
          </Button>

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

      {/* Bottom Row: Date Picker & Snapshot Toggle */}
      <div className='flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground hidden sm:inline'>
            Pilih Tanggal:
          </span>
          <InvoiceDateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            disabled={isRefreshing}
          />
        </div>

        <div className='flex items-center gap-1.5 p-1 bg-background/80 dark:bg-muted/30 rounded-xl border border-border/80 shadow-2xs text-xs'>
          <span className='text-[11px] font-semibold text-muted-foreground px-2 hidden md:inline'>
            {isRange ? 'Filter Snapshot:' : 'Snapshot:'}
          </span>

          {mealtimeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedWaktu === opt.id;
            const hasBatch = lockedMealtimes.has(opt.id);

            return (
              <button
                key={opt.id}
                type='button'
                onClick={() => onSnapshotChange(selectedDate, opt.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none relative',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5',
                    isSelected ? 'text-primary-foreground' : opt.color,
                  )}
                />
                <span>{opt.label}</span>

                {!isRange && opt.id !== 'ALL' && hasBatch && (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isSelected ? 'bg-white' : 'bg-emerald-500',
                    )}
                    title={`Snapshot ${opt.label} Tersedia & Terkunci`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

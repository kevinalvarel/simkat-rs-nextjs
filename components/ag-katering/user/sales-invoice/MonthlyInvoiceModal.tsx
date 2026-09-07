'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  CalendarRange,
  Loader2,
  Printer,
  Banknote,
} from 'lucide-react';
import type { SalesInvoiceSummary } from '@/types/invoicetypes';
import SalesInvoicePrintModal from './SalesInvoicePrintModal';

interface MonthlyInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadData: (month: number, year: number) => Promise<void>;
  monthlyData: SalesInvoiceSummary | null;
  isLoading: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function MonthlyInvoiceModal({
  open,
  onOpenChange,
  onLoadData,
  monthlyData,
  isLoading,
}: MonthlyInvoiceModalProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Generate year options (current year ± 2)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      years.push(y);
    }
    return years;
  }, [now]);

  async function handleLoadData() {
    await onLoadData(selectedMonth, selectedYear);
  }

  function handleOpenPrint() {
    if (monthlyData) {
      setShowPrintModal(true);
    }
  }

  function formatCurrency(n: number): string {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg w-full'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
              <CalendarRange className='w-5 h-5 text-primary' />
              Cetak Faktur Penjualan Bulanan
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Pilih bulan dan tahun untuk membuat faktur penjualan bulanan.
              Data akan diakumulasi dari seluruh tanggal dalam bulan tersebut.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Month & Year Selection */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-xs font-medium text-muted-foreground'>
                  Bulan
                </Label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setSelectedMonth(parseInt(v || '1', 10))}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Pilih bulan' />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className='text-xs font-medium text-muted-foreground'>
                  Tahun
                </Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setSelectedYear(parseInt(v || String(now.getFullYear()), 10))}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Pilih tahun' />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Load Button */}
            <Button
              onClick={handleLoadData}
              disabled={isLoading}
              className='w-full gap-2 cursor-pointer'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Memuat data...
                </>
              ) : (
                <>
                  <CalendarRange className='w-4 h-4' />
                  Muat Data {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </>
              )}
            </Button>

            {/* Preview Summary */}
            {monthlyData && (
              <div className='border rounded-xl p-4 bg-muted/20 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-foreground'>
                    Ringkasan {monthlyData.monthLabel}
                  </span>
                  <Badge
                    variant='outline'
                    className='text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  >
                    {monthlyData.totalDays} Hari Data
                  </Badge>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='text-center p-3 bg-background rounded-lg border'>
                    <p className='text-[10px] text-muted-foreground font-medium'>
                      Total Porsi
                    </p>
                    <p className='text-lg font-extrabold text-foreground'>
                      {monthlyData.grandTotalPorsi.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className='text-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20'>
                    <p className='text-[10px] text-muted-foreground font-medium'>
                      Total Harga
                    </p>
                    <p className='text-lg font-extrabold text-emerald-700 dark:text-emerald-400'>
                      {formatCurrency(monthlyData.totalHarga)}
                    </p>
                  </div>
                </div>

                {/* Line Items Preview */}
                {monthlyData.lineItems.length > 0 && (
                  <div className='border rounded-lg overflow-hidden'>
                    <table className='w-full text-[11px]'>
                      <thead>
                        <tr className='bg-muted/40'>
                          <th className='px-2 py-1 text-left font-bold'>
                            Nama Barang
                          </th>
                          <th className='px-2 py-1 text-center font-bold'>
                            Type
                          </th>
                          <th className='px-2 py-1 text-center font-bold'>
                            Qty
                          </th>
                          <th className='px-2 py-1 text-right font-bold'>
                            Jumlah (Rp)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.lineItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className='border-t hover:bg-muted/10'
                          >
                            <td className='px-2 py-1'>{item.namaBarang}</td>
                            <td className='px-2 py-1 text-center'>
                              {item.type}
                            </td>
                            <td className='px-2 py-1 text-center font-mono'>
                              {item.banyaknya}
                            </td>
                            <td className='px-2 py-1 text-right font-mono'>
                              {item.jumlahHarga.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className='text-[10px] text-muted-foreground italic'>
                  Terbilang: {monthlyData.terbilang}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='cursor-pointer text-xs'
            >
              Tutup
            </Button>
            <Button
              onClick={handleOpenPrint}
              disabled={!monthlyData}
              className='gap-2 cursor-pointer text-xs font-bold'
            >
              <Printer className='w-4 h-4' />
              Cetak Faktur Bulanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Print Modal for Monthly Data */}
      {monthlyData && (
        <SalesInvoicePrintModal
          open={showPrintModal}
          onOpenChange={setShowPrintModal}
          data={monthlyData}
        />
      )}
    </>
  );
}

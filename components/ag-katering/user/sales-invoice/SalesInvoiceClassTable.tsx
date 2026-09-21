'use client';

import React, { useState } from 'react';
import type {
  SalesInvoiceSummary,
  SalesInvoiceLineItem,
} from '@/types/invoicetypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers, Banknote } from 'lucide-react';

interface SalesInvoiceClassTableProps {
  data: SalesInvoiceSummary;
}

import { getKelasBadgeStyle } from '@/lib/kelas-utils';

function formatCurrency(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function SalesInvoiceClassTable({
  data,
}: SalesInvoiceClassTableProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isPerSnapshot = Boolean(data.isPerSnapshot);
  const isRange = Boolean(data.isRange);

  const lineItems = data.lineItems || [];
  const totalHarga = data.totalHarga || 0;
  const totalBanyaknya = data.totalBanyaknya || 0;

  return (
    <div className='space-y-6 w-full'>
      {/* Main Table Card */}
      <div className='bg-card border rounded-2xl shadow-2xs overflow-hidden w-full'>
        {/* Table Header */}
        <div className='p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/20'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h3 className='text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2'>
                <Layers className='w-4 h-4 text-primary' />
                {isPerSnapshot
                  ? `Rincian Faktur Penjualan Snapshot ${data.waktuMakan}`
                  : isRange
                    ? 'Rincian Faktur Penjualan Periode'
                    : 'Rincian Faktur Penjualan Harian'}
              </h3>

              {data.batchId && (
                <Badge
                  variant='outline'
                  className='text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                >
                  Batch #{data.batchId}
                </Badge>
              )}
            </div>
            <p className='text-xs text-muted-foreground'>
              Daftar item Nama Barang, Tipe (Kelas), Banyaknya (Porsi), Harga
              Satuan, dan Jumlah Harga.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 px-3 py-1'
            >
              <Banknote className='w-3.5 h-3.5' />
              {formatCurrency(totalHarga)}
            </Badge>
          </div>
        </div>

        {/* Sales Table */}
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30 hover:bg-muted/30'>
                <TableHead className='w-12 text-center font-bold text-xs'>
                  No
                </TableHead>
                <TableHead className='font-bold text-xs min-w-[140px]'>
                  Nama Barang
                </TableHead>
                <TableHead className='font-bold text-xs text-center min-w-[100px]'>
                  Tipe
                </TableHead>
                <TableHead className='font-bold text-xs text-center w-24'>
                  Banyaknya
                </TableHead>
                <TableHead className='font-bold text-xs text-center w-20'>
                  Satuan
                </TableHead>
                <TableHead className='font-bold text-xs text-right min-w-[120px]'>
                  Harga Satuan (Rp)
                </TableHead>
                <TableHead className='font-bold text-xs text-right min-w-[130px]'>
                  Jumlah Harga (Rp)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 text-muted-foreground text-sm'
                  >
                    Belum ada data faktur penjualan untuk periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {lineItems.map((item) => (
                    <TableRow
                      key={`${item.no}-${item.namaBarang}-${item.type}`}
                      className='hover:bg-muted/20 transition-colors'
                    >
                      <TableCell className='text-center text-xs font-mono text-muted-foreground'>
                        {item.no}
                      </TableCell>
                      <TableCell className='text-xs font-semibold text-foreground'>
                        {item.namaBarang}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge
                          variant='outline'
                          className={`text-[10px] font-bold ${getKelasBadgeStyle(item.type)}`}
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center text-xs font-mono font-semibold'>
                        {item.banyaknya.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className='text-center text-xs text-muted-foreground'>
                        {item.satuan}
                      </TableCell>
                      <TableCell className='text-right text-xs font-mono'>
                        {item.hargaSatuan.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className='text-right text-xs font-mono font-bold text-foreground'>
                        {item.jumlahHarga.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow className='bg-emerald-500/5 dark:bg-emerald-950/20 hover:bg-emerald-500/10 border-t-2 border-emerald-500/30'>
                    <TableCell className='text-center'></TableCell>
                    <TableCell
                      colSpan={2}
                      className='text-xs font-extrabold text-foreground uppercase tracking-wide'
                    >
                      Total Keseluruhan
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono font-extrabold text-foreground'>
                      {totalBanyaknya.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className='text-center text-xs font-bold text-muted-foreground'>
                      Porsi
                    </TableCell>
                    <TableCell className='text-right text-xs font-bold text-muted-foreground'>
                      Total Harga
                    </TableCell>
                    <TableCell className='text-right text-sm font-mono font-extrabold text-emerald-700 dark:text-emerald-400'>
                      {totalHarga.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Terbilang Footer */}
        {totalHarga > 0 && (
          <div className='p-4 border-t border-border/60 bg-muted/10'>
            <p className='text-xs text-muted-foreground'>
              <span className='font-bold text-foreground'>Terbilang: </span>
              <span className='italic'>{data.terbilang}</span>
            </p>
          </div>
        )}
      </div>

      {/* Detailed Per-Class Breakdown (Collapsible) */}
      <div className='bg-card border rounded-2xl shadow-2xs overflow-hidden w-full'>
        <Button
          variant='ghost'
          onClick={() => setShowDetails(!showDetails)}
          className='w-full flex items-center justify-between p-4 h-auto hover:bg-muted/30 cursor-pointer'
        >
          <span className='text-xs font-semibold text-muted-foreground'>
            Detail Konsumsi per Kelas Perawatan
          </span>
          {showDetails ? (
            <ChevronUp className='w-4 h-4 text-muted-foreground' />
          ) : (
            <ChevronDown className='w-4 h-4 text-muted-foreground' />
          )}
        </Button>

        {showDetails && (
          <div className='overflow-x-auto border-t'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/30 hover:bg-muted/30'>
                  <TableHead className='w-12 text-center font-bold text-xs'>
                    No
                  </TableHead>
                  <TableHead className='font-bold text-xs'>
                    Kelas Perawatan
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Makan Pagi
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Makan Siang
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Makan Malam
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Extra
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Total Porsi
                  </TableHead>
                  <TableHead className='font-bold text-xs text-center'>
                    Pasien
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.classes.map((cls, idx) => (
                  <TableRow
                    key={cls.kelas}
                    className='hover:bg-muted/20 transition-colors'
                  >
                    <TableCell className='text-center text-xs font-mono text-muted-foreground'>
                      {idx + 1}
                    </TableCell>
                    <TableCell className='text-xs'>
                      <Badge
                        variant='outline'
                        className={`text-[10px] font-bold ${getKelasBadgeStyle(cls.kelas, data.classes.map((c) => c.kelas))}`}
                      >
                        {cls.kelas}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono'>
                      {cls.pagiCount}
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono'>
                      {cls.siangCount}
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono'>
                      {cls.malamCount}
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono'>
                      {cls.extraCount}
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono font-bold'>
                      {cls.totalPorsi}
                    </TableCell>
                    <TableCell className='text-center text-xs font-mono'>
                      {cls.totalPasien}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className='bg-muted/30 border-t-2'>
                  <TableCell></TableCell>
                  <TableCell className='text-xs font-extrabold uppercase'>
                    Total
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-bold'>
                    {data.grandTotalPagi}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-bold'>
                    {data.grandTotalSiang}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-bold'>
                    {data.grandTotalMalam}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-bold'>
                    {data.grandTotalExtra}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-extrabold'>
                    {data.grandTotalPorsi}
                  </TableCell>
                  <TableCell className='text-center text-xs font-mono font-bold'>
                    {data.grandTotalPasien}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

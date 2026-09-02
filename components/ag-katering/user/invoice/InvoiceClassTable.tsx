'use client';

import React, { useState } from 'react';
import type { InvoiceDailySummary, InvoiceClassConsumption } from '@/types/invoicetypes';
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
import { ChevronDown, ChevronUp, Users, Utensils, Sparkles, Layers } from 'lucide-react';

interface InvoiceClassTableProps {
  data: InvoiceDailySummary;
}

const KELAS_BADGE_STYLE: Record<string, string> = {
  VIP: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  VVIP: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'KELAS 1': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'KELAS I': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'KELAS 2': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'KELAS II': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'KELAS 2 - 3': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'KELAS 2-3': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'KELAS 3': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'KELAS III': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

export default function InvoiceClassTable({ data }: InvoiceClassTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  function toggleRow(kelas: string) {
    setExpandedRows((prev) => ({ ...prev, [kelas]: !prev[kelas] }));
  }

  const hasData = data.classes.some((c) => c.totalPorsi > 0 || c.totalPasien > 0);

  return (
    <div className='bg-card border rounded-2xl shadow-2xs overflow-hidden w-full'>
      {/* Table Header / Title */}
      <div className='p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/20'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2'>
              <Layers className='w-4 h-4 text-primary' />
              Tabel Konsumsi Makanan {data.isRange ? 'Periode' : 'Harian'} per Kelas
            </h3>
            {data.isRange && (
              <Badge
                variant='outline'
                className='text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30'
              >
                Rentang: {data.totalDays} Hari
              </Badge>
            )}
            <Badge
              variant='outline'
              className={`text-[10px] font-bold px-2 py-0.5 ${
                data.statusBatch === 'OFFICIAL_LOCKED'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {data.statusBatch === 'OFFICIAL_LOCKED'
                ? 'OFFICIAL (Terkunci)'
                : 'LIVE PREVIEW (Aktif)'}
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground'>
            Rekapitulasi total keseluruhan porsi makan pasien yang dipisahkan berdasarkan kelas perawatan untuk{' '}
            {data.isRange ? 'periode ' : 'tanggal '}
            <strong className='text-foreground'>{data.tanggalFormatted}</strong>.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className='overflow-x-auto w-full'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='w-[50px] text-center text-xs font-semibold'>
                No
              </TableHead>
              <TableHead className='min-w-[150px] text-xs font-semibold'>
                Kelas Perawatan
              </TableHead>
              <TableHead className='w-[130px] text-center text-xs font-semibold'>
                <span className='flex items-center justify-center gap-1'>
                  <Users className='w-3.5 h-3.5' /> {data.isRange ? 'Pasien-Hari' : 'Pasien'}
                </span>
              </TableHead>
              <TableHead className='w-[100px] text-center text-xs font-semibold'>
                Makan Pagi
              </TableHead>
              <TableHead className='w-[100px] text-center text-xs font-semibold'>
                Makan Siang
              </TableHead>
              <TableHead className='w-[100px] text-center text-xs font-semibold'>
                Makan Malam
              </TableHead>
              <TableHead className='w-[100px] text-center text-xs font-semibold'>
                Extra / Snack
              </TableHead>
              <TableHead className='w-[140px] text-center text-xs font-bold text-foreground bg-primary/5'>
                {data.isRange ? 'Total Porsi Periode' : 'Total Porsi'}
              </TableHead>
              <TableHead className='w-[90px] text-center text-xs font-semibold'>
                Rincian
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.classes.map((row, idx) => {
              const isExpanded = Boolean(expandedRows[row.kelas]);
              const badgeStyle =
                KELAS_BADGE_STYLE[row.kelas.toUpperCase()] ||
                'bg-secondary text-secondary-foreground border-border';

              return (
                <React.Fragment key={row.kelas}>
                  <TableRow
                    className={`transition-colors hover:bg-muted/40 ${
                      row.totalPorsi > 0
                        ? ''
                        : 'text-muted-foreground/70 bg-muted/10'
                    }`}
                  >
                    {/* No */}
                    <TableCell className='text-center text-xs text-muted-foreground py-3.5 font-medium'>
                      {idx + 1}
                    </TableCell>

                    {/* Kelas Perawatan */}
                    <TableCell className='py-3.5 font-medium'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeStyle}`}
                        >
                          {row.kelas}
                        </span>
                      </div>
                    </TableCell>

                    {/* Pasien Terlayani */}
                    <TableCell className='text-center py-3.5'>
                      <span className='font-mono font-bold text-xs text-foreground'>
                        {row.totalPasien}
                      </span>
                      <span className='text-[11px] text-muted-foreground ml-1'>
                        org
                      </span>
                    </TableCell>

                    {/* Pagi */}
                    <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                      {row.pagiCount}
                    </TableCell>

                    {/* Siang */}
                    <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                      {row.siangCount}
                    </TableCell>

                    {/* Malam */}
                    <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                      {row.malamCount}
                    </TableCell>

                    {/* Extra / Snack */}
                    <TableCell className='text-center py-3.5 font-mono text-xs text-muted-foreground font-semibold'>
                      {row.extraCount > 0 ? row.extraCount : '—'}
                    </TableCell>

                    {/* Total Porsi */}
                    <TableCell className='text-center py-3.5 bg-primary/5'>
                      <span className='inline-flex items-center gap-1 font-mono font-extrabold text-sm text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20'>
                        {row.totalPorsi}
                      </span>
                    </TableCell>

                    {/* Rincian Toggle */}
                    <TableCell className='text-center py-3.5'>
                      {row.dietBreakdown.length > 0 ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleRow(row.kelas)}
                          className='h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer'
                          title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian Diet'}
                        >
                          {isExpanded ? (
                            <ChevronUp className='w-4 h-4' />
                          ) : (
                            <ChevronDown className='w-4 h-4' />
                          )}
                        </Button>
                      ) : (
                        <span className='text-[11px] text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expandable Diet Breakdown Row */}
                  {isExpanded && row.dietBreakdown.length > 0 && (
                    <TableRow className='bg-muted/30 hover:bg-muted/30 border-t border-dashed'>
                      <TableCell colSpan={9} className='p-4 pl-12'>
                        <div className='space-y-2 bg-background p-3.5 rounded-xl border border-border/80 shadow-2xs'>
                          <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                            <Utensils className='w-3.5 h-3.5 text-primary' />
                            Rincian Distribusi Diet Pasien - {row.kelas}:
                          </span>
                          <div className='flex flex-wrap gap-2 pt-1'>
                            {row.dietBreakdown.map((diet, dIdx) => (
                              <div
                                key={dIdx}
                                className='inline-flex items-center gap-1.5 text-xs bg-muted/60 border rounded-lg px-2.5 py-1'
                              >
                                <span className='font-medium text-foreground'>
                                  {diet.bentuk} ({diet.kategori})
                                </span>
                                <span className='font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded text-[11px]'>
                                  {diet.count} porsi
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {/* Grand Total Summary Row */}
            <TableRow className='bg-muted/80 font-bold border-t-2 border-primary/30'>
              <TableCell colSpan={2} className='py-4 text-xs font-extrabold uppercase tracking-wider text-foreground text-left pl-4'>
                TOTAL KESELURUHAN KONSUMSI {data.isRange ? `(${data.totalDays} HARI)` : ''}
              </TableCell>
              <TableCell className='text-center py-4'>
                <span className='font-mono font-extrabold text-sm text-foreground'>
                  {data.grandTotalPasien}
                </span>
                <span className='text-[11px] text-muted-foreground ml-1'>
                  {data.isRange ? 'pasien-hari' : 'org'}
                </span>
              </TableCell>
              <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                {data.grandTotalPagi}
              </TableCell>
              <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                {data.grandTotalSiang}
              </TableCell>
              <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                {data.grandTotalMalam}
              </TableCell>
              <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-muted-foreground'>
                {data.grandTotalExtra}
              </TableCell>
              <TableCell className='text-center py-4 bg-primary/10'>
                <span className='font-mono font-extrabold text-base text-primary'>
                  {data.grandTotalPorsi}
                </span>
                <span className='text-[11px] text-primary/80 font-medium ml-1'>
                  porsi
                </span>
              </TableCell>
              <TableCell className='text-center py-4 text-xs text-muted-foreground'>
                —
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Note footer */}
      <div className='p-3 sm:p-4 border-t border-border/80 text-xs text-muted-foreground bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2'>
        <span>
          * Data rekapitulasi dihitung otomatis dari jadwal makan Pagi, Siang, Malam, dan Ekstra diet pasien aktif.
        </span>
        <span className='font-mono text-[11px] text-muted-foreground'>
          Diperbarui: {data.lastUpdated} WIB
        </span>
      </div>
    </div>
  );
}

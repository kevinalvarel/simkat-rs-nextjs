'use client';

import React, { useState } from 'react';
import type {
  InvoiceDailySummary,
  InvoiceClassConsumption,
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
import {
  ChevronDown,
  ChevronUp,
  Users,
  Utensils,
  Sparkles,
  Layers,
  Camera,
  UserPlus,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface InvoiceClassTableProps {
  data: InvoiceDailySummary;
}

import { getKelasBadgeStyle } from '@/lib/kelas-utils';

export default function InvoiceClassTable({ data }: InvoiceClassTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  function toggleRow(kelas: string) {
    setExpandedRows((prev) => ({ ...prev, [kelas]: !prev[kelas] }));
  }

  const isPerSnapshot = Boolean(data.isPerSnapshot);
  const isRange = Boolean(data.isRange);
  const revisiPatients = data.revisiPatients || [];

  return (
    <div className='space-y-6 w-full'>
      {/* Main Table Card */}
      <div className='bg-card border rounded-2xl shadow-2xs overflow-hidden w-full'>
        {/* Table Header / Title */}
        <div className='p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/20'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h3 className='text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2'>
                <Layers className='w-4 h-4 text-primary' />
                {isPerSnapshot
                  ? `Tabel Rincian Konsumsi Snapshot ${data.waktuMakan} per Kelas`
                  : isRange
                    ? 'Tabel Konsumsi Makanan Periode per Kelas'
                    : 'Tabel Konsumsi Makanan Harian per Kelas'}
              </h3>

              {data.batchId && (
                <Badge
                  variant='outline'
                  className='text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                >
                  Batch #{data.batchId}
                </Badge>
              )}

              {isPerSnapshot && (data.revisiTambahPasienCount ?? 0) > 0 && (
                <Badge
                  variant='outline'
                  className='text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                >
                  +{data.revisiTambahPasienCount} Susulan
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
              {isPerSnapshot ? (
                <>
                  Rincian akumulasi porsi makan per kelas yang dihitung dari
                  baseline snapshot awal ditambah revisi pasien susulan yang
                  telah diotorisasi supervisor.
                </>
              ) : isRange ? (
                <>
                  Rekapitulasi total keseluruhan porsi makan pasien yang
                  dipisahkan berdasarkan kelas perawatan untuk periode{' '}
                  <strong className='text-foreground'>
                    {data.tanggalFormatted}
                  </strong>
                  .
                </>
              ) : (
                'Rekapitulasi total keseluruhan porsi makan pasien harian seluruh waktu makan berdasarkan kelas perawatan.'
              )}
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
                <TableHead className='w-[120px] text-center text-xs font-semibold'>
                  <span className='flex items-center justify-center gap-1'>
                    <Users className='w-3.5 h-3.5' />{' '}
                    {isRange ? 'Pasien-Hari' : 'Pasien'}
                  </span>
                </TableHead>

                {/* Specific columns for Per-Snapshot mode */}
                {isPerSnapshot ? (
                  <>
                    <TableHead className='w-[140px] text-center text-xs font-semibold'>
                      <span className='flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 font-bold'>
                        <Camera className='w-3.5 h-3.5' /> Baseline Snapshot
                      </span>
                    </TableHead>
                    <TableHead className='w-[140px] text-center text-xs font-semibold'>
                      <span className='flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-bold'>
                        <UserPlus className='w-3.5 h-3.5' /> Tambah Pasien
                      </span>
                    </TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className='w-[100px] text-center text-xs font-semibold'>
                      Makan Pagi
                    </TableHead>
                    <TableHead className='w-[100px] text-center text-xs font-semibold'>
                      Makan Siang
                    </TableHead>
                    <TableHead className='w-[100px] text-center text-xs font-semibold'>
                      Makan Malam
                    </TableHead>
                  </>
                )}

                <TableHead className='w-[100px] text-center text-xs font-semibold'>
                  Extra / Snack
                </TableHead>

                <TableHead className='w-[140px] text-center text-xs font-bold text-foreground bg-primary/5'>
                  {isPerSnapshot
                    ? `Total Porsi (${data.waktuMakan})`
                    : isRange
                      ? 'Total Porsi Periode'
                      : 'Total Porsi'}
                </TableHead>

                <TableHead className='w-[90px] text-center text-xs font-semibold'>
                  Rincian
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.classes.map((row, idx) => {
                const isExpanded = Boolean(expandedRows[row.kelas]);
                const kelasOrder = data.classes.map((c) => c.kelas);
                const badgeStyle = getKelasBadgeStyle(row.kelas, kelasOrder);

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

                      {/* Per-Snapshot Columns */}
                      {isPerSnapshot ? (
                        <>
                          <TableCell className='text-center py-3.5 font-mono text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-500/5'>
                            {row.baselinePorsi ?? row.totalPorsi}
                          </TableCell>

                          <TableCell className='text-center py-3.5 font-mono text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-500/5'>
                            {(row.revisiTambahPorsi ?? 0) > 0 ? (
                              <Badge
                                variant='outline'
                                className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-mono'
                              >
                                +{row.revisiTambahPorsi}
                              </Badge>
                            ) : (
                              '0'
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                            {row.pagiCount}
                          </TableCell>
                          <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                            {row.siangCount}
                          </TableCell>
                          <TableCell className='text-center py-3.5 font-mono text-xs text-foreground font-semibold'>
                            {row.malamCount}
                          </TableCell>
                        </>
                      )}

                      {/* Extra / Snack */}
                      <TableCell className='text-center py-3.5 font-mono text-xs text-muted-foreground font-semibold'>
                        {row.extraCount > 0 ? row.extraCount : '—'}
                      </TableCell>

                      {/* Total Porsi Final */}
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
                            title={
                              isExpanded
                                ? 'Tutup Rincian'
                                : 'Buka Rincian Diet'
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className='w-4 h-4' />
                            ) : (
                              <ChevronDown className='w-4 h-4' />
                            )}
                          </Button>
                        ) : (
                          <span className='text-[11px] text-muted-foreground'>
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Diet Breakdown Row */}
                    {isExpanded && row.dietBreakdown.length > 0 && (
                      <TableRow className='bg-muted/30 hover:bg-muted/30 border-t border-dashed'>
                        <TableCell colSpan={isPerSnapshot ? 8 : 9} className='p-4 pl-12'>
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
                <TableCell
                  colSpan={2}
                  className='py-4 text-xs font-extrabold uppercase tracking-wider text-foreground text-left pl-4'
                >
                  TOTAL KESELURUHAN KONSUMSI{' '}
                  {isPerSnapshot ? `(${data.waktuMakan})` : ''}
                </TableCell>
                <TableCell className='text-center py-4'>
                  <span className='font-mono font-extrabold text-sm text-foreground'>
                    {data.grandTotalPasien}
                  </span>
                  <span className='text-[11px] text-muted-foreground ml-1'>
                    {isRange ? 'pasien-hari' : 'org'}
                  </span>
                </TableCell>

                {isPerSnapshot ? (
                  <>
                    <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-blue-700 dark:text-blue-300 bg-blue-500/5'>
                      {data.baselineTotalPorsi ?? data.grandTotalPorsi}
                    </TableCell>
                    <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-amber-700 dark:text-amber-300 bg-amber-500/5'>
                      +{data.revisiTambahPasienCount ?? 0}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                      {data.grandTotalPagi}
                    </TableCell>
                    <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                      {data.grandTotalSiang}
                    </TableCell>
                    <TableCell className='text-center py-4 font-mono font-extrabold text-sm text-foreground'>
                      {data.grandTotalMalam}
                    </TableCell>
                  </>
                )}

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
            {isPerSnapshot ? (
              <>
                * Tagihan porsi = <strong>Baseline Snapshot</strong> +{' '}
                <strong>Revisi Tambah Pasien</strong> (Pasien baru emergent
                pasca-cut-off). Perubahan jenis diet pasien tidak menambah total
                porsi.
              </>
            ) : (
              '* Data rekapitulasi dihitung otomatis dari jadwal makan Pagi, Siang, Malam, dan Ekstra diet pasien aktif.'
            )}
          </span>
          <span className='font-mono text-[11px] text-muted-foreground'>
            Diperbarui: {data.lastUpdated} WIB
          </span>
        </div>
      </div>

      {/* Post-Snapshot Tambah Pasien Revision Details Card */}
      {isPerSnapshot && revisiPatients.length > 0 && (
        <div className='bg-card border border-amber-500/30 rounded-2xl shadow-2xs overflow-hidden w-full'>
          <div className='p-4 sm:p-5 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-2'>
            <div className='space-y-1'>
              <h4 className='text-sm font-bold text-foreground flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-amber-500' />
                Rincian Pasien Tambahan Pasca-Snapshot (Revisi Tambah Pasien)
              </h4>
              <p className='text-xs text-muted-foreground'>
                Daftar pasien baru yang terdaftar pasca-cut-off snapshot yang
                telah disetujui (Approved) dan menambah +1 porsi tagihan ke
                katering.
              </p>
            </div>
            <Badge
              variant='outline'
              className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold px-2.5 py-1'
            >
              +{revisiPatients.length} Pasien Diakumulasikan
            </Badge>
          </div>

          <div className='overflow-x-auto w-full'>
            <Table>
              <TableHeader className='bg-muted/40'>
                <TableRow>
                  <TableHead className='w-[40px] text-center text-xs'>
                    No
                  </TableHead>
                  <TableHead className='text-xs'>Nama Pasien & No RM</TableHead>
                  <TableHead className='text-xs'>Lokasi Rawat</TableHead>
                  <TableHead className='text-xs'>Kelas</TableHead>
                  <TableHead className='text-xs'>Diet Terverifikasi</TableHead>
                  <TableHead className='text-xs'>Alasan Susulan</TableHead>
                  <TableHead className='text-xs'>Status & Otorisasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revisiPatients.map((p, idx) => (
                  <TableRow key={p.id} className='hover:bg-muted/30 text-xs'>
                    <TableCell className='text-center font-medium text-muted-foreground'>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className='font-bold text-foreground'>
                        {p.nama_pasien}
                      </div>
                      <div className='font-mono text-[11px] text-muted-foreground'>
                        {p.no_rm}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='font-medium'>
                        {p.ruangan} / {p.bed}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-secondary border'>
                        {p.kelas}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='font-semibold text-primary'>
                        {p.diet}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-[200px] truncate'>
                      {p.alasan}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]'>
                        <ShieldCheck className='w-3.5 h-3.5' />
                        <span>Disetujui</span>
                      </div>
                      <div className='text-[10px] text-muted-foreground'>
                        Oleh: {p.reviewed_by || 'Supervisor'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

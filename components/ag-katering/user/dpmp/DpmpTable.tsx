'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  CheckSquare,
  Square,
  UtensilsCrossed,
  DoorOpen,
  Building,
  Layers,
} from 'lucide-react';
import { isNpoPatient } from '@/lib/npo-utils';
import type { DpmpPatientItem } from '@/types/dpmptypes';

interface DpmpTableProps {
  patients: DpmpPatientItem[];
  allPatients: DpmpPatientItem[];
  selectedRuangan: string;
  onSelectRuangan: (ruangan: string) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onToggleSelectRuangan: (ruanganPatients: DpmpPatientItem[]) => void;
  onPrintSingle: (patient: DpmpPatientItem) => void;
  onPrintBatch: () => void;
  onPrintRuangan: (ruanganName: string, ruanganPatients: DpmpPatientItem[]) => void;
  isAllSelected: boolean;
}

import { getKelasBadgeStyle } from '@/lib/kelas-utils';

function DpmpStatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  if (upper === 'NPO') {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'>
        NPO (Puasa)
      </span>
    );
  }
  if (upper === 'EMERGENT') {
    return (
      <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 animate-pulse'>
        Emergent / Cito
      </span>
    );
  }
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'>
      Aktif
    </span>
  );
}

export default function DpmpTable({
  patients,
  allPatients,
  selectedRuangan,
  onSelectRuangan,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleSelectRuangan,
  onPrintSingle,
  onPrintBatch,
  onPrintRuangan,
  isAllSelected,
}: DpmpTableProps) {
  const selectedCount = selectedIds.size;

  // 1. Group all available ruangan for the Ruangan Selector Tabs
  const ruanganListWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    allPatients.forEach((p) => {
      const r = p.ruangan || 'Tanpa Ruangan';
      map.set(r, (map.get(r) || 0) + 1);
    });

    return Array.from(map.entries()).map(([ruangan, count]) => ({
      ruangan,
      count,
    }));
  }, [allPatients]);

  // 2. Group filtered patients by Ruangan
  const groupedPatients = useMemo(() => {
    const map = new Map<string, DpmpPatientItem[]>();

    patients.forEach((p) => {
      const r = p.ruangan || 'Tanpa Ruangan';
      if (!map.has(r)) {
        map.set(r, []);
      }
      map.get(r)!.push(p);
    });

    return Array.from(map.entries()).map(([ruangan, patientList]) => {
      const feedingList = patientList.filter(
        (p) => !isNpoPatient(p) && p.status !== 'NPO',
      );
      const activeCount = feedingList.length;
      const npoCount = patientList.length - activeCount;
      const emergentCount = patientList.filter(
        (p) => p.is_emergent || p.status === 'EMERGENT',
      ).length;

      const allRuanganSelected =
        feedingList.length > 0 &&
        feedingList.every((p) => selectedIds.has(p.id));

      const someRuanganSelected =
        feedingList.some((p) => selectedIds.has(p.id)) && !allRuanganSelected;

      return {
        ruangan,
        patientList,
        feedingList,
        activeCount,
        npoCount,
        emergentCount,
        allRuanganSelected,
        someRuanganSelected,
      };
    });
  }, [patients, selectedIds]);

  return (
    <div className='space-y-4'>
      {/* 1. Ruangan Selector Tabs / Quick Pill Bar */}
      <div className='bg-card border rounded-2xl p-3 shadow-2xs space-y-2'>
        <div className='flex items-center justify-between gap-2 px-1'>
          <div className='flex items-center gap-2'>
            <DoorOpen className='w-4 h-4 text-primary' />
            <span className='text-xs font-bold text-foreground'>
              Pilih Ruangan Rawat Inap:
            </span>
          </div>
          <span className='text-[11px] text-muted-foreground'>
            {ruanganListWithCounts.length} Ruangan Tersedia
          </span>
        </div>

        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
          {/* Semua Ruangan Tab */}
          <button
            type='button'
            onClick={() => onSelectRuangan('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedRuangan === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Building className='w-3.5 h-3.5' />
            Semua Ruangan ({allPatients.length})
          </button>

          {/* Individual Ruangan Tabs */}
          {ruanganListWithCounts.map(({ ruangan, count }) => {
            const isSelected = selectedRuangan === ruangan;
            return (
              <button
                key={ruangan}
                type='button'
                onClick={() => onSelectRuangan(ruangan)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-600'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <DoorOpen className='w-3.5 h-3.5' />
                {ruangan} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Global Batch Action Toolbar when items are selected */}
      {selectedCount > 0 && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium'>
            <span>
              <strong>{selectedCount}</strong> dari {patients.length} pasien
              terpilih untuk lembar DPMP & tanda terima
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={onPrintBatch}
              className='gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold rounded-xl cursor-pointer'
            >
              <Printer className='w-3.5 h-3.5' />
              Cetak DPMP ({selectedCount} Pasien Terpilih)
            </Button>
          </div>
        </div>
      )}

      {/* 3. Grouped Ruangan Patient Tables */}
      {groupedPatients.length === 0 ? (
        <div className='rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-2xs'>
          <div className='flex flex-col items-center justify-center space-y-2'>
            <UtensilsCrossed className='w-8 h-8 text-muted-foreground/50' />
            <p className='font-semibold text-xs text-foreground'>
              Tidak ada data pasien yang sesuai filter ruangan
            </p>
            <p className='text-[11px] text-muted-foreground'>
              Coba pilih opsi ruangan lain atau ubah kriteria pencarian.
            </p>
          </div>
        </div>
      ) : (
        <div className='space-y-5'>
          {groupedPatients.map(
            ({
              ruangan,
              patientList,
              feedingList,
              activeCount,
              npoCount,
              emergentCount,
              allRuanganSelected,
            }) => {
              return (
                <div
                  key={ruangan}
                  className='rounded-2xl border border-border bg-card shadow-2xs overflow-hidden transition-all'
                >
                  {/* Ruangan Group Header */}
                  <div className='p-3.5 sm:p-4 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      {/* Checkbox Select All in this Ruangan */}
                      <button
                        type='button'
                        onClick={() => onToggleSelectRuangan(feedingList)}
                        className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0'
                        title={
                          allRuanganSelected
                            ? `Batalkan pilihan di ${ruangan}`
                            : `Pilih semua pasien di ${ruangan}`
                        }
                      >
                        {allRuanganSelected ? (
                          <CheckSquare className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                        ) : (
                          <Square className='w-4 h-4 text-muted-foreground' />
                        )}
                      </button>

                      <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
                        <DoorOpen className='w-4 h-4' />
                      </div>

                      <div>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <h3 className='font-bold text-sm sm:text-base text-foreground'>
                            {ruangan}
                          </h3>
                          <Badge variant='outline' className='text-[10px] px-2 py-0 font-semibold'>
                            {patientList.length} Pasien
                          </Badge>
                        </div>

                        <div className='flex items-center gap-2 text-xs text-muted-foreground pt-0.5'>
                          <span>{activeCount} Makan Aktif</span>
                          {npoCount > 0 && (
                            <>
                              <span>·</span>
                              <span className='text-amber-600 dark:text-amber-400 font-semibold'>
                                {npoCount} Puasa (NPO)
                              </span>
                            </>
                          )}
                          {emergentCount > 0 && (
                            <>
                              <span>·</span>
                              <span className='text-rose-600 dark:text-rose-400 font-bold'>
                                {emergentCount} Cito
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ruangan Specific Actions */}
                    <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onPrintRuangan(ruangan, feedingList)}
                        className='h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer font-semibold'
                        title={`Cetak Lembar DPMP untuk ${ruangan}`}
                      >
                        <Printer className='w-3.5 h-3.5' />
                        Cetak DPMP {ruangan}
                      </Button>
                    </div>
                  </div>

                  {/* Patient Table for this Ruangan */}
                  <div className='overflow-x-auto w-full'>
                    <Table>
                      <TableHeader className='bg-muted/20'>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='w-[44px] text-center px-2'>
                            <span className='text-[10px] font-mono text-muted-foreground'>
                              Pilih
                            </span>
                          </TableHead>
                          <TableHead className='w-[45px] text-center text-xs font-semibold'>
                            No
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[160px]'>
                            Nama Pasien
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[90px]'>
                            No RM
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[80px]'>
                            Bed
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[90px]'>
                            Kamar
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[85px]'>
                            Kelas
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[160px]'>
                            Diet & Ekstra
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[70px] text-center'>
                            Waktu
                          </TableHead>
                          <TableHead className='text-xs font-semibold min-w-[85px] text-center'>
                            Status
                          </TableHead>
                          <TableHead className='text-xs font-semibold text-right min-w-[80px] pr-4'>
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {patientList.map((p, idx) => {
                          const isNpo = isNpoPatient(p) || p.status === 'NPO';
                          const isSelected = selectedIds.has(p.id) && !isNpo;
                          const badgeStyle = getKelasBadgeStyle(p.kelas);

                          return (
                            <TableRow
                              key={p.id}
                              className={`transition-colors ${
                                isNpo
                                  ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07] border-l-4 border-l-amber-500/80 opacity-75'
                                  : isSelected
                                  ? 'bg-primary/5 dark:bg-primary/10 hover:bg-muted/40'
                                  : 'hover:bg-muted/40'
                              }`}
                            >
                              {/* Checkbox */}
                              <TableCell className='text-center px-2 py-3'>
                                {isNpo ? (
                                  <span
                                    className='p-1 inline-flex text-muted-foreground/30 cursor-not-allowed'
                                    title='Pasien Puasa (NPO) tidak mendapatkan porsi makanan'
                                  >
                                    <Square className='w-4 h-4' />
                                  </span>
                                ) : (
                                  <button
                                    type='button'
                                    onClick={() => onToggleSelect(p.id)}
                                    className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer'
                                  >
                                    {isSelected ? (
                                      <CheckSquare className='w-4 h-4 text-primary' />
                                    ) : (
                                      <Square className='w-4 h-4 text-muted-foreground' />
                                    )}
                                  </button>
                                )}
                              </TableCell>

                              {/* No */}
                              <TableCell className='text-center text-xs text-muted-foreground font-mono'>
                                {idx + 1}
                              </TableCell>

                              {/* Nama Pasien */}
                              <TableCell className='font-semibold text-xs text-foreground'>
                                <div className='flex items-center gap-1.5'>
                                  <span>{p.nama_pasien}</span>
                                  {p.is_emergent && (
                                    <span className='inline-flex items-center text-[9px] font-bold px-1 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20'>
                                      CITO
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              {/* No RM */}
                              <TableCell className='font-mono text-xs text-muted-foreground'>
                                {p.no_rm}
                              </TableCell>

                              {/* Bed */}
                              <TableCell className='text-xs text-foreground font-medium'>
                                <span className='font-mono bg-muted/60 px-1.5 py-0.5 rounded'>
                                  {p.bed}
                                </span>
                              </TableCell>

                              {/* Kamar (Menggantikan Gedung) */}
                              <TableCell className='text-xs text-foreground font-medium'>
                                <span>{p.kamar || '—'}</span>
                              </TableCell>

                              {/* Kelas */}
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] border ${badgeStyle}`}
                                >
                                  {p.kelas}
                                </span>
                              </TableCell>

                              {/* Diet & Ekstra */}
                              <TableCell className='text-xs text-foreground'>
                                <div className='space-y-0.5'>
                                  <span className='font-medium block leading-tight'>
                                    {p.diet}
                                  </span>
                                  {(p.extra || p.buah || p.snack) && (
                                    <div className='flex flex-wrap gap-1 pt-0.5'>
                                      {p.extra && (
                                        <span className='text-[9px] px-1 py-0.2 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono'>
                                          +{p.extra}
                                        </span>
                                      )}
                                      {p.buah && (
                                        <span className='text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono'>
                                          🍊 {p.buah}
                                        </span>
                                      )}
                                      {p.snack && (
                                        <span className='text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono'>
                                          🍪 {p.snack}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              {/* Waktu */}
                              <TableCell className='text-center text-xs font-semibold text-muted-foreground'>
                                {p.waktu}
                              </TableCell>

                              {/* Status */}
                              <TableCell className='text-center'>
                                <DpmpStatusBadge status={p.status} />
                              </TableCell>

                              {/* Aksi */}
                              <TableCell className='text-right pr-4'>
                                {isNpo ? (
                                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'>
                                    Puasa (NPO)
                                  </span>
                                ) : (
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => onPrintSingle(p)}
                                    className='h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10 cursor-pointer rounded-lg'
                                    title='Cetak Lembar DPMP Pasien Ini'
                                  >
                                    <Printer className='w-3 h-3' />
                                    Cetak
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

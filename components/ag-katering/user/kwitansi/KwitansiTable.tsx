'use client';

import React from 'react';
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
import { Printer, CheckSquare, Square, UtensilsCrossed, AlertCircle } from 'lucide-react';
import type { KwitansiPatientItem } from '@/types/kwitansitypes';

interface KwitansiTableProps {
  patients: KwitansiPatientItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onPrintSingle: (patient: KwitansiPatientItem) => void;
  onPrintBatch: () => void;
  isAllSelected: boolean;
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

function KwitansiStatusBadge({ status }: { status: string }) {
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

export default function KwitansiTable({
  patients,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPrintSingle,
  onPrintBatch,
  isAllSelected,
}: KwitansiTableProps) {
  const selectedCount = selectedIds.size;
  const isAllFilteredSelected =
    patients.length > 0 && selectedCount === patients.length;

  return (
    <div className='space-y-3'>
      {/* Batch Action Toolbar when items are selected */}
      {selectedCount > 0 && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium'>
            <span>
              <strong>{selectedCount}</strong> dari {patients.length} pasien terpilih untuk tanda terima
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={onPrintBatch}
              className='gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-bold rounded-xl cursor-pointer'
            >
              <Printer className='w-3.5 h-3.5' />
              {isAllFilteredSelected
                ? 'Cetak Semua Kwitansi'
                : `Cetak Kwitansi (${selectedCount} Pasien)`}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className='rounded-2xl border border-border bg-card shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto w-full'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow className='hover:bg-transparent'>
                {/* Select All Checkbox */}
                <TableHead className='w-[44px] text-center px-2'>
                  <button
                    onClick={onToggleSelectAll}
                    className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer'
                    title={
                      isAllSelected
                        ? 'Batalkan semua pilihan'
                        : 'Pilih semua baris'
                    }
                  >
                    {isAllSelected ? (
                      <CheckSquare className='w-4 h-4 text-primary' />
                    ) : (
                      <Square className='w-4 h-4 text-muted-foreground' />
                    )}
                  </button>
                </TableHead>

                <TableHead className='w-[50px] text-center text-xs font-semibold'>
                  No
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[160px]'>
                  Nama Pasien
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[100px]'>
                  No RM
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[120px]'>
                  Ruangan & Bed
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[100px]'>
                  Gedung
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[90px]'>
                  Kelas
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[170px]'>
                  Diet & Ekstra
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[80px] text-center'>
                  Waktu
                </TableHead>
                <TableHead className='text-xs font-semibold min-w-[90px] text-center'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-semibold text-right min-w-[90px] pr-4'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {patients.length > 0 ? (
                patients.map((p, idx) => {
                  const isSelected = selectedIds.has(p.id);
                  const badgeStyle =
                    KELAS_BADGE_STYLE[p.kelas.toUpperCase()] ||
                    'bg-secondary text-secondary-foreground border-border';

                  return (
                    <TableRow
                      key={p.id}
                      className={`transition-colors hover:bg-muted/40 ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className='text-center px-2 py-3'>
                        <button
                          onClick={() => onToggleSelect(p.id)}
                          className='p-1 rounded hover:bg-muted text-foreground transition-colors cursor-pointer'
                        >
                          {isSelected ? (
                            <CheckSquare className='w-4 h-4 text-primary' />
                          ) : (
                            <Square className='w-4 h-4 text-muted-foreground' />
                          )}
                        </button>
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

                      {/* Ruangan & Bed */}
                      <TableCell className='text-xs text-foreground font-medium'>
                        <span>{p.ruangan}</span>
                        <span className='text-muted-foreground ml-1'>
                          (Bed {p.bed})
                        </span>
                      </TableCell>

                      {/* Gedung */}
                      <TableCell className='text-xs text-muted-foreground'>
                        {p.gedung || '—'}
                      </TableCell>

                      {/* Kelas */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}
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
                        <KwitansiStatusBadge status={p.status} />
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className='text-right pr-4'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onPrintSingle(p)}
                          className='h-8 px-2.5 text-xs gap-1.5 text-primary hover:bg-primary/10 cursor-pointer rounded-lg'
                          title='Cetak Kwitansi Pasien Ini'
                        >
                          <Printer className='w-3.5 h-3.5' />
                          Cetak
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className='text-center py-12 text-muted-foreground'
                  >
                    <div className='flex flex-col items-center justify-center space-y-2'>
                      <UtensilsCrossed className='w-8 h-8 text-muted-foreground/50' />
                      <p className='font-semibold text-xs text-foreground'>
                        Tidak ada data pasien yang sesuai filter
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        Coba ubah kriteria pencarian atau pilih batch snapshot lain.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

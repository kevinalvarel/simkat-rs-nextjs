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
import { Printer, CheckSquare, Square, History, ArrowRight } from 'lucide-react';
import type { PemorsianRevisiItem } from '@/types/pemorsiantypes';

interface PemorsianRevisiTableSectionProps {
  revisiItems: PemorsianRevisiItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onPrintSingle: (item: PemorsianRevisiItem) => void;
  onPrintBatch: () => void;
  isAllSelected: boolean;
}

export default function PemorsianRevisiTableSection({
  revisiItems,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPrintSingle,
  onPrintBatch,
  isAllSelected,
}: PemorsianRevisiTableSectionProps) {
  const selectedCount = selectedIds.size;
  const isAllFilteredSelected =
    revisiItems.length > 0 && selectedCount === revisiItems.length;

  function renderJenisBadge(jenis: string) {
    switch (jenis) {
      case 'NEW_PATIENT':
        return (
          <Badge className='bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px] font-semibold'>
            Pasien Baru (+1)
          </Badge>
        );
      case 'DIET_CHANGE':
        return (
          <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold'>
            Ubah Diet
          </Badge>
        );
      case 'ROOM_TRANSFER':
        return (
          <Badge className='bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[11px] font-semibold'>
            Pindah Kamar
          </Badge>
        );
      case 'NPO':
        return (
          <Badge className='bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] font-semibold'>
            Puasa / NPO (-1)
          </Badge>
        );
      case 'DISCHARGE':
        return (
          <Badge className='bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[11px] font-semibold'>
            Pasien Pulang (-1)
          </Badge>
        );
      default:
        return <Badge variant='outline'>{jenis}</Badge>;
    }
  }

  function renderStatusBadge(status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'SELESAI') {
      return (
        <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold'>
          {s === 'SELESAI' ? 'Selesai' : 'Disetujui'}
        </Badge>
      );
    }
    if (s === 'PENDING') {
      return (
        <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold'>
          Menunggu
        </Badge>
      );
    }
    return (
      <Badge className='bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] font-semibold'>
        Ditolak
      </Badge>
    );
  }

  return (
    <div className='space-y-3'>
      {/* Batch Action Toolbar */}
      {selectedCount > 0 && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200'>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium'>
            <CheckSquare className='w-4 h-4 text-amber-600 dark:text-amber-400' />
            <span>
              <strong>{selectedCount}</strong> revisi terpilih untuk cetak
              etiket baru
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              onClick={onPrintBatch}
              className='gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold'
            >
              <Printer className='w-3.5 h-3.5' />
              {isAllFilteredSelected
                ? 'Cetak Semua Etiket Revisi'
                : `Cetak ${selectedCount} Etiket Revisi Terpilih`}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className='rounded-xl border border-border bg-card shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[44px] text-center px-2'>
                  <button
                    onClick={onToggleSelectAll}
                    className='p-1 rounded hover:bg-muted text-foreground transition-colors'
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

                <TableHead className='w-[50px] text-xs font-bold text-foreground'>
                  No
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[160px]'>
                  Nama Pasien & No RM
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[120px]'>
                  Jenis Perubahan
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[180px]'>
                  Perubahan Diet / Lokasi
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[160px]'>
                  Dampak Dapur
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground min-w-[110px]'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-bold text-foreground text-center min-w-[110px]'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {revisiItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='h-48 text-center text-muted-foreground'
                  >
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <History className='w-8 h-8 text-muted-foreground/40' />
                      <p className='text-sm font-medium'>
                        Belum ada data revisi post-snapshot untuk siklus ini.
                      </p>
                      <p className='text-xs text-muted-foreground/70'>
                        Perubahan diet susulan dari AG RS akan muncul di sini.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                revisiItems.map((item, index) => {
                  const isSelected = selectedIds.has(item.id);
                  const isDischargeOrNpo =
                    item.jenis_perubahan === 'DISCHARGE' ||
                    item.jenis_perubahan === 'NPO';

                  return (
                    <TableRow
                      key={item.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : 'hover:bg-muted/40'
                      }`}
                      onClick={() => onToggleSelect(item.id)}
                    >
                      {/* Checkbox */}
                      <TableCell
                        className='text-center px-2'
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(item.id);
                        }}
                      >
                        <button className='p-1 rounded text-foreground'>
                          {isSelected ? (
                            <CheckSquare className='w-4 h-4 text-amber-600 dark:text-amber-400' />
                          ) : (
                            <Square className='w-4 h-4 text-muted-foreground' />
                          )}
                        </button>
                      </TableCell>

                      {/* No */}
                      <TableCell className='text-xs font-medium text-muted-foreground'>
                        {index + 1}
                      </TableCell>

                      {/* Nama Pasien & No RM */}
                      <TableCell className='font-medium text-xs sm:text-sm text-foreground'>
                        <div className='flex flex-col'>
                          <span className='font-semibold'>
                            {item.nama_pasien}
                          </span>
                          <span className='text-[10px] text-muted-foreground font-mono'>
                            {item.no_rm} • {item.kelas}
                          </span>
                        </div>
                      </TableCell>

                      {/* Jenis Perubahan */}
                      <TableCell className='text-xs'>
                        {renderJenisBadge(item.jenis_perubahan)}
                      </TableCell>

                      {/* Perubahan Diet / Lokasi */}
                      <TableCell className='text-xs text-foreground'>
                        {item.jenis_perubahan === 'ROOM_TRANSFER' ? (
                          <div className='space-y-1'>
                            <div className='text-muted-foreground line-through text-[11px]'>
                              {item.data_lama?.ruangan} (Bed{' '}
                              {item.data_lama?.bed})
                            </div>
                            <div className='font-semibold text-primary flex items-center gap-1'>
                              <ArrowRight className='w-3 h-3' />
                              {item.data_baru?.ruangan || item.ruangan} (Bed{' '}
                              {item.data_baru?.bed || item.bed})
                            </div>
                          </div>
                        ) : item.jenis_perubahan === 'DIET_CHANGE' ? (
                          <div className='space-y-1'>
                            <div className='text-muted-foreground line-through text-[11px] truncate max-w-[200px]'>
                              {item.data_lama?.diet || 'Diet Lama'}
                            </div>
                            <div className='font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
                              <ArrowRight className='w-3 h-3 shrink-0' />
                              <span className='break-words'>
                                {item.data_baru?.diet || 'Diet Baru'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className='font-medium text-foreground'>
                            {item.data_baru?.diet ||
                              item.data_baru?.ruangan ||
                              item.dampak_dapur}
                          </div>
                        )}
                      </TableCell>

                      {/* Dampak Dapur */}
                      <TableCell className='text-xs font-medium text-foreground'>
                        <span className='inline-block px-2 py-0.5 rounded bg-muted text-foreground text-[11px]'>
                          {item.dampak_dapur}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className='text-xs'>
                        {renderStatusBadge(item.status)}
                      </TableCell>

                      {/* Aksi: Button Cetak */}
                      <TableCell
                        className='text-center'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onPrintSingle(item)}
                          disabled={isDischargeOrNpo}
                          className='h-8 px-2.5 text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-all shadow-2xs'
                          title={
                            isDischargeOrNpo
                              ? 'Etiket ditarik (Pasien Pulang/NPO)'
                              : 'Cetak Etiket Revisi Baru'
                          }
                        >
                          <Printer className='w-3.5 h-3.5' />
                          <span>Cetak Etiket</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer Count */}
        <div className='px-4 py-2.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2'>
          <span>
            Menampilkan <strong>{revisiItems.length}</strong> data revisi susulan
          </span>
          <div className='flex items-center gap-3'>
            <span>
              Terpilih:{' '}
              <strong className='text-foreground'>{selectedCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

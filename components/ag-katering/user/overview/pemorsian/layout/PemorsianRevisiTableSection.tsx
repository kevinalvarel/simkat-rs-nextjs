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
import {
  Printer,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Bed,
} from 'lucide-react';
import type { PemorsianRevisiItem } from '@/types/pemorsiantypes';
import { canPrintRevision } from '@/lib/revisi-etiket';

interface PemorsianRevisiTableSectionProps {
  revisiItems: PemorsianRevisiItem[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onPrintSingle: (item: PemorsianRevisiItem) => void;
  onPrintBatch: (items?: PemorsianRevisiItem[]) => void;
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
  const printableItems = revisiItems.filter((item) => canPrintRevision(item.jenis_perubahan));
  const selectedPrintableCount = printableItems.filter((item) => selectedIds.has(item.id)).length;
  const isAllFilteredSelected =
    revisiItems.length > 0 && selectedCount === revisiItems.length;

  function renderJenisBadge(jenis: string) {
    switch (jenis) {
      case 'NEW_PATIENT':
        return (
          <Badge className='bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[11px] font-bold'>
            Pasien Baru (+1)
          </Badge>
        );
      case 'DIET_CHANGE':
        return (
          <Badge className='bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-bold'>
            Ubah Diet
          </Badge>
        );
      case 'ROOM_TRANSFER':
        return (
          <Badge className='bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[11px] font-bold'>
            Pindah Kamar
          </Badge>
        );
      case 'NPO':
        return (
          <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[11px] font-bold'>
            Puasa / NPO (-1)
          </Badge>
        );
      case 'DISCHARGE':
        return (
          <Badge className='bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 text-[11px] font-bold'>
            Pasien Pulang (-1)
          </Badge>
        );
      case 'KOREKSI_NAMA':
        return (
          <Badge className='bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 text-[11px] font-bold'>
            Koreksi Nama
          </Badge>
        );
      case 'KOREKSI_NO_RM':
        return (
          <Badge className='bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 text-[11px] font-bold'>
            Koreksi No RM
          </Badge>
        );
      case 'KOREKSI_KELAS':
        return (
          <Badge className='bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[11px] font-bold'>
            Koreksi Kelas
          </Badge>
        );
      case 'KOREKSI_KAMAR':
        return (
          <Badge className='bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30 text-[11px] font-bold'>
            Koreksi No Kamar
          </Badge>
        );
      case 'KOREKSI_BED':
        return (
          <Badge className='bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[11px] font-bold'>
            Koreksi Bed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{jenis}</Badge>;
    }
  }

  return (
    <div className='rounded-2xl border-2 border-amber-500/40 bg-card shadow-xs overflow-hidden'>
      {/* ─── Header: Section Title & Warning Alert ─── */}
      <div className='bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 sm:p-5 border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2.5'>
            <div className='w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0'>
              <AlertTriangle className='w-4 h-4' />
            </div>
            <h3 className='text-base sm:text-lg font-bold text-foreground tracking-tight'>
              Daftar Pasien Butuh Revisi Etiket
            </h3>
            <Badge className='bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold font-mono text-xs'>
              {revisiItems.length} Perubahan
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground pl-10.5'>
            Pasien ini telah terdaftar di snapshot sebelumnya, namun AG RS melakukan
            perubahan diet/ruangan/koreksi data susulan. Etiket lama harus ditarik/dicetak ulang.
          </p>
        </div>

        {/* Action: Cetak Semua Revisi */}
        {printableItems.length > 0 && (
          <div className='flex items-center gap-2 pl-10.5 sm:pl-0'>
            <Button
              size='sm'
              onClick={() => onPrintBatch(printableItems)}
              className='gap-1.5 h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs shrink-0 cursor-pointer'
            >
              <Printer className='w-3.5 h-3.5' />
              <span>Cetak Semua Revisi ({printableItems.length})</span>
            </Button>
          </div>
        )}
      </div>

      {/* ─── Batch Action Toolbar for Selected Revisions ─── */}
      {selectedCount > 0 && (
        <div className='m-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 shadow-2xs'>
          <div className='flex items-center gap-2 text-xs sm:text-sm text-foreground font-medium'>
            <CheckSquare className='w-4 h-4 text-amber-600 dark:text-amber-400' />
            <span>
              <strong>{selectedCount}</strong> etiket revisi terpilih
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              disabled={selectedPrintableCount === 0}
              onClick={() => {
                const selected = revisiItems.filter((r) => selectedIds.has(r.id));
                onPrintBatch(selected);
              }}
              className='gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-semibold rounded-lg'
            >
              <Printer className='w-3.5 h-3.5' />
              <span>
                {isAllFilteredSelected
                  ? 'Cetak Semua Etiket Revisi'
                  : `Cetak ${selectedPrintableCount} Etiket Revisi Terpilih`}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── Table Perubahan Data Pasien ─── */}
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow className='hover:bg-transparent'>
              {/* Checkbox All */}
              <TableHead className='w-[44px] text-center px-2'>
                <button
                  type='button'
                  onClick={onToggleSelectAll}
                  className='p-1 rounded hover:bg-muted text-foreground transition-colors'
                  title={isAllSelected ? 'Batalkan pilihan' : 'Pilih semua baris'}
                >
                  {isAllSelected ? (
                    <CheckSquare className='w-4 h-4 text-amber-600 dark:text-amber-400' />
                  ) : (
                    <Square className='w-4 h-4 text-muted-foreground' />
                  )}
                </button>
              </TableHead>

              <TableHead className='w-[50px] text-xs font-bold text-foreground'>
                No
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground min-w-[160px]'>
                Nama Pasien & RM
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground min-w-[120px]'>
                Ruangan & Bed
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground min-w-[130px]'>
                Jenis Perubahan
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground min-w-[240px]'>
                Perbandingan Data (Lama vs Baru)
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground min-w-[150px]'>
                Dampak Operasional
              </TableHead>
              <TableHead className='text-xs font-bold text-foreground text-center min-w-[120px]'>
                Aksi Etiket
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {revisiItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='h-40 text-center text-muted-foreground'
                >
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <CheckCircle2 className='w-8 h-8 text-emerald-500/50' />
                    <p className='text-sm font-semibold text-foreground'>
                      Tidak ada perubahan data pasien setelah snapshot.
                    </p>
                    <p className='text-xs text-muted-foreground/80 max-w-sm'>
                      Semua data pasien di ruang perawatan saat ini sesuai dengan
                      baseline snapshot terkunci.
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
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : 'hover:bg-amber-500/5'
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
                    <TableCell className='text-xs font-semibold text-muted-foreground'>
                      {index + 1}
                    </TableCell>

                    {/* Nama Pasien & No RM */}
                    <TableCell className='text-xs font-medium text-foreground'>
                      <div className='flex flex-col'>
                        <span className='font-bold text-sm text-foreground'>
                          {item.nama_pasien}
                        </span>
                        <div className='flex items-center gap-1.5 mt-0.5'>
                          <span className='text-[11px] font-mono text-muted-foreground'>
                            {item.no_rm}
                          </span>
                          <span className='text-[10px] px-1.5 py-0.2 rounded bg-muted font-semibold text-muted-foreground'>
                            {item.kelas}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Ruangan & Bed */}
                    <TableCell className='text-xs text-foreground'>
                      <div className='font-medium'>{item.ruangan}</div>
                      {item.bed && (
                        <div className='flex items-center gap-1 text-[11px] text-muted-foreground font-mono'>
                          <Bed className='w-3 h-3' />
                          <span>Bed {item.bed}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Jenis Perubahan Badge */}
                    <TableCell className='text-xs'>
                      <div className='flex flex-col items-start gap-1'>
                        {renderJenisBadge(item.jenis_perubahan)}
                        {canPrintRevision(item.jenis_perubahan) && (
                          <span className={item.revision_print_status === 'SUDAH_DICETAK' ? 'text-[10px] font-semibold text-emerald-700' : 'text-[10px] font-semibold text-amber-700'}>
                            {item.revision_print_status === 'SUDAH_DICETAK' ? 'Revisi Sudah Tercetak' : 'Revisi Belum Tercetak'}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Perbandingan Data: Data Lama vs Data Baru */}
                    <TableCell className='text-xs text-foreground'>
                      {item.jenis_perubahan.startsWith('KOREKSI_') ? (
                        <div className='space-y-1 py-1'>
                          {(
                            [
                              { key: 'nama_pasien', label: 'Nama' },
                              { key: 'no_rm', label: 'No RM' },
                              { key: 'diet', label: 'Diet' },
                              { key: 'kelas', label: 'Kelas' },
                              { key: 'gedung', label: 'No Kamar' },
                              { key: 'ruangan', label: 'Ruangan' },
                              { key: 'bed', label: 'Bed' },
                            ] as const
                          )
                            .map((d) => ({
                              ...d,
                              lama: (item.data_lama?.[d.key] || '').trim(),
                              baru: (item.data_baru?.[d.key] || '').trim(),
                            }))
                            .filter(
                              (d) =>
                                d.lama.toLowerCase() !== d.baru.toLowerCase() &&
                                (d.lama !== '' || d.baru !== ''),
                            )
                            .map((d) => (
                              <div key={d.key} className='flex flex-wrap items-center gap-1 text-[11px]'>
                                <span className='font-semibold text-muted-foreground'>{d.label}:</span>
                                <span className='text-rose-600/80 dark:text-rose-400/80 line-through'>{d.lama || '-'}</span>
                                <ArrowRight className='w-3 h-3 text-emerald-600 shrink-0' />
                                <span className='font-bold text-emerald-700 dark:text-emerald-300'>{d.baru || '-'}</span>
                              </div>
                            ))}
                        </div>
                      ) : item.jenis_perubahan === 'ROOM_TRANSFER' ? (
                        <div className='space-y-1 py-1'>
                          <div className='text-rose-600/80 dark:text-rose-400/80 line-through text-[11px] flex items-center gap-1'>
                            <span className='font-semibold'>Lama:</span>
                            <span>
                              {item.data_lama?.ruangan || 'Kamar Lama'} (Bed{' '}
                              {item.data_lama?.bed || '-'})
                            </span>
                          </div>
                          <div className='font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5'>
                            <ArrowRight className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                            <span>
                              Baru: {item.data_baru?.ruangan || item.ruangan} (Bed{' '}
                              {item.data_baru?.bed || item.bed})
                            </span>
                          </div>
                        </div>
                      ) : item.jenis_perubahan === 'DIET_CHANGE' ? (
                        <div className='space-y-1 py-1'>
                          <div className='text-rose-600/80 dark:text-rose-400/80 line-through text-[11px] flex items-center gap-1'>
                            <span className='font-semibold'>Lama:</span>
                            <span>{item.data_lama?.diet || 'Diet Lama'}</span>
                          </div>
                          <div className='font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5'>
                            <ArrowRight className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                            <span>Baru: {item.data_baru?.diet || 'Diet Baru'}</span>
                          </div>
                        </div>
                      ) : item.jenis_perubahan === 'NEW_PATIENT' ? (
                        <div className='py-1'>
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs'>
                            + Pasien Masuk: {item.data_baru?.diet || 'Diet Standar'}
                          </span>
                        </div>
                      ) : (
                        <div className='py-1 text-rose-600 font-semibold'>
                          {item.dampak_dapur}
                        </div>
                      )}
                    </TableCell>

                    {/* Dampak Dapur */}
                    <TableCell className='text-xs font-medium text-foreground'>
                      <span className='inline-block px-2 py-0.5 rounded bg-muted text-foreground text-[11px]'>
                        {item.dampak_dapur}
                      </span>
                    </TableCell>

                    {/* Aksi: Cetak Etiket Baru */}
                    <TableCell
                      className='text-center'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size='sm'
                        onClick={() => onPrintSingle(item)}
                        disabled={isDischargeOrNpo}
                        className='h-8 px-2.5 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs font-semibold cursor-pointer disabled:opacity-50'
                        title={
                          isDischargeOrNpo
                            ? 'Etiket ditarik (Pasien Pulang/NPO)'
                            : 'Cetak Etiket Revisi Baru'
                        }
                      >
                        <Printer className='w-3.5 h-3.5' />
                        <span>Cetak Etiket Baru</span>
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
      <div className='px-4 py-2.5 border-t border-amber-500/30 bg-muted/20 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2'>
        <span>
          Menampilkan <strong>{revisiItems.length}</strong> pasien membutuhkan revisi etiket
        </span>
        {selectedCount > 0 && (
          <span className='font-medium text-foreground'>
            Terpilih: <strong>{selectedCount}</strong> baris
          </span>
        )}
      </div>
    </div>
  );
}

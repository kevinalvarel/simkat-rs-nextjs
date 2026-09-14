'use client';

import React, { useState } from 'react';
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
  Edit2,
  Trash2,
  Plus,
  Layers,
  Sun,
  Sunrise,
  Sunset,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { SiklusMenuItem } from '@/servers/siklus-menu.service';
import { deleteSiklusMenuItem } from '@/servers/siklus-menu.service';
import { toast } from 'sonner';

interface SiklusMenuMatrixTableProps {
  items: SiklusMenuItem[];
  activeSiklus: number;
  onEditItem: (item: SiklusMenuItem) => void;
  onAddItemToSlot: (slot: {
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
  }) => void;
  onEditSlot: (slot: {
    siklus_ke: number;
    kelas: string;
    jenis_makanan: string;
    waktu_makan: string;
    existingItems: SiklusMenuItem[];
  }) => void;
  onRefresh: () => void;
}

const JENIS_BADGE_STYLE: Record<string, string> = {
  HEWANI:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
  NABATI:
    'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300',
  SAYUR:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300',
  SARING:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
  BUAH: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300',
  SNACK:
    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
  EXTRA:
    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
};

interface MatrixRowDefinition {
  id: string;
  kelas: string;
  jenis_makanan: string;
  isSaringSlot?: boolean;
  /** Jika true, slot SORE dinonaktifkan (Buah dan Snack hanya Pagi & Siang) */
  hanyaPagiSiang?: boolean;
}

// Preset standard hospital rows layout (matching reference image)
const STANDARD_ROWS: MatrixRowDefinition[] = [
  { id: 'VIP-HEWANI', kelas: 'VIP', jenis_makanan: 'HEWANI' },
  { id: 'I-HEWANI', kelas: 'I', jenis_makanan: 'HEWANI' },
  { id: 'II-III-HEWANI', kelas: 'II-III', jenis_makanan: 'HEWANI' },
  { id: 'SEMUA-NABATI', kelas: 'Semua Kelas', jenis_makanan: 'NABATI' },
  { id: 'SEMUA-SAYUR', kelas: 'Semua Kelas', jenis_makanan: 'SAYUR' },
  {
    id: 'SEMUA-BUAH',
    kelas: 'Semua Kelas',
    jenis_makanan: 'BUAH',
    hanyaPagiSiang: true,
  },
  // Baris snack — hanya ada 2 waktu: Pagi dan Siang (Sore dinonaktifkan)
  {
    id: 'SEMUA-SNACK',
    kelas: 'Semua Kelas',
    jenis_makanan: 'SNACK',
    hanyaPagiSiang: true,
  },
];

export default function SiklusMenuMatrixTable({
  items,
  activeSiklus,
  onEditItem,
  onAddItemToSlot,
  onEditSlot,
  onRefresh,
}: SiklusMenuMatrixTableProps) {
  const [itemToDelete, setItemToDelete] = useState<SiklusMenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Discover all distinct [kelas, jenis_makanan] pairs in items to ensure custom rows are shown too
  const rowKeys = new Set<string>();
  const matrixRows: MatrixRowDefinition[] = [];

  // Add standard rows first
  for (const std of STANDARD_ROWS) {
    const key = `${std.kelas}__${std.jenis_makanan}`;
    rowKeys.add(key);
    matrixRows.push(std);
  }

  // Add any dynamic rows present in database items
  for (const item of items) {
    // Treat SARING & SNACK as special rows (sudah punya baris baku)
    if (item.jenis_makanan === 'SARING' || item.jenis_makanan === 'SNACK')
      continue;
    // Skip 'Semua Kelas' items — they are shared data, not separate rows
    if (
      item.kelas === 'Semua Kelas' ||
      item.kelas === 'ALL' ||
      item.kelas === 'Umum'
    )
      continue;

    const key = `${item.kelas}__${item.jenis_makanan}`;
    if (!rowKeys.has(key)) {
      rowKeys.add(key);
      matrixRows.push({
        id: key,
        kelas: item.kelas,
        jenis_makanan: item.jenis_makanan,
        hanyaPagiSiang: item.jenis_makanan === 'BUAH',
      });
    }
  }

  // Items dedicated to SARING (SIANG)
  const saringSiangItems = items.filter(
    (i) => i.waktu_makan === 'SARING' || i.jenis_makanan === 'SARING',
  );

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteSiklusMenuItem(itemToDelete.id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
        setItemToDelete(null);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus hidangan.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Helper to get items for a cell
  function getCellDishes(
    kelas: string,
    jenis_makanan: string,
    waktu_makan: string,
  ) {
    return items.filter((i) => {
      if (i.waktu_makan !== waktu_makan) return false;
      if (i.jenis_makanan !== jenis_makanan) return false;

      // Keep class-specific fruit in its own row, so slot edits do not copy it
      // into the shared "Semua Kelas" slot.
      if (jenis_makanan === 'BUAH') {
        if (kelas === 'Semua Kelas') {
          return i.kelas === 'Semua Kelas' || i.kelas === 'ALL' || i.kelas === 'Umum';
        }
        return i.kelas === kelas;
      }

      // For shared rows like 'Semua Kelas', match either exact or general
      if (kelas === 'Semua Kelas') {
        return (
          i.kelas === 'Semua Kelas' ||
          i.kelas === 'ALL' ||
          i.kelas === 'Umum' ||
          i.kelas === 'I' ||
          i.kelas === 'II-III'
        );
      }

      return i.kelas === kelas || i.kelas === 'Semua Kelas';
    });
  }

  // Render a cell slot containing dishes
  function renderSlotCell(
    kelas: string,
    jenis_makanan: string,
    waktu_makan: string,
    customItems?: SiklusMenuItem[],
  ) {
    const dishes =
      customItems || getCellDishes(kelas, jenis_makanan, waktu_makan);

    return (
      <div className='group/slot min-h-[90px] p-2 flex flex-col justify-between rounded-lg transition-colors hover:bg-muted/40 relative'>
        {/* Dish entries */}
        <div className='space-y-1.5'>
          {dishes.length === 0 ? (
            <div className='text-[11px] text-muted-foreground/60 italic py-2'>
              - Belum ada menu -
            </div>
          ) : (
            dishes.map((dish) => (
              <div
                key={dish.id}
                className='text-xs text-foreground bg-background border border-border/80 rounded-md p-1.5 shadow-2xs group/item hover:border-primary/50 transition-all flex items-start justify-between gap-1.5'
              >
                <div className='leading-tight'>
                  <span className='font-medium text-foreground'>
                    {dish.nama_makanan}
                  </span>
                  {dish.kategori_menu && (
                    <span className='ml-1 font-bold text-primary text-[11px]'>
                      ({dish.kategori_menu})
                    </span>
                  )}
                  {dish.catatan && (
                    <span className='ml-1 text-[10px] text-amber-700 dark:text-amber-400 font-mono italic'>
                      {dish.catatan}
                    </span>
                  )}
                </div>

                {/* Quick actions per dish */}
                <div className='opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity'>
                  <button
                    type='button'
                    onClick={() => onEditItem(dish)}
                    className='h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer'
                    title='Edit hidangan'
                  >
                    <Edit2 className='w-2.5 h-2.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => setItemToDelete(dish)}
                    className='h-5 w-5 rounded flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer'
                    title='Hapus hidangan'
                  >
                    <Trash2 className='w-2.5 h-2.5' />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Slot Bottom Toolbar */}
        <div className='opacity-0 group-hover/slot:opacity-100 flex items-center justify-end gap-1 pt-2 transition-opacity'>
          <Button
            type='button'
            variant='ghost'
            size='xs'
            onClick={() =>
              onAddItemToSlot({
                siklus_ke: activeSiklus,
                kelas,
                jenis_makanan,
                waktu_makan,
              })
            }
            className='h-6 px-1.5 text-[10px] font-semibold text-primary hover:bg-primary/10'
            title='Tambah satu hidangan ke slot ini'
          >
            <Plus className='w-3 h-3 mr-0.5' /> Tambah
          </Button>

          {(jenis_makanan !== 'BUAH' || dishes.every((dish) => dish.kelas === kelas)) && (
            <Button
            type='button'
            variant='outline'
            size='xs'
            onClick={() =>
              onEditSlot({
                siklus_ke: activeSiklus,
                kelas,
                jenis_makanan,
                waktu_makan,
                existingItems: dishes,
              })
            }
            className='h-6 px-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground'
            title='Kelola / edit seluruh hidangan dalam slot ini'
          >
            <Layers className='w-3 h-3 mr-0.5' /> Edit Slot
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='border rounded-2xl bg-card overflow-hidden shadow-xs'>
        <div className='overflow-x-auto'>
          <Table className='border-collapse min-w-[980px]'>
            <TableHeader className='bg-muted/60 border-b select-none'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-20 text-center text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  Menu
                </TableHead>
                <TableHead className='w-28 text-center text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  Kelas
                </TableHead>
                <TableHead className='w-32 text-center text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  Jenis Makanan
                </TableHead>
                <TableHead className='min-w-[200px] text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  <div className='flex items-center gap-1.5 justify-center'>
                    <Sunrise className='w-4 h-4 text-amber-500' />
                    Makan Pagi
                  </div>
                </TableHead>
                <TableHead className='min-w-[200px] text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  <div className='flex items-center gap-1.5 justify-center'>
                    <Sun className='w-4 h-4 text-orange-500' />
                    Makan Siang
                  </div>
                </TableHead>
                <TableHead className='min-w-[200px] text-xs font-bold uppercase tracking-wider text-foreground border-r'>
                  <div className='flex items-center gap-1.5 justify-center'>
                    <Sunset className='w-4 h-4 text-indigo-500' />
                    Makan Sore
                  </div>
                </TableHead>
                <TableHead className='min-w-[180px] text-xs font-bold uppercase tracking-wider text-foreground bg-primary/5'>
                  <div className='flex items-center gap-1.5 justify-center text-primary'>
                    <Coffee className='w-4 h-4' />
                    Saring
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {matrixRows.map((row, idx) => {
                const badgeStyle =
                  JENIS_BADGE_STYLE[row.jenis_makanan] ||
                  'bg-gray-100 text-gray-800 border-gray-300';
                const legacyFruitSore = row.jenis_makanan === 'BUAH'
                  ? getCellDishes(row.kelas, 'BUAH', 'SORE')
                  : [];

                return (
                  <TableRow
                    key={row.id}
                    className={`hover:bg-muted/20 transition-colors ${
                      idx !== matrixRows.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {/* MENU Cycle column (Shown once with rowSpan on top row) */}
                    {idx === 0 && (
                      <TableCell
                        rowSpan={matrixRows.length}
                        className='text-center align-middle border-r bg-muted/20 font-mono font-extrabold text-2xl text-foreground'
                      >
                        <div className='space-y-1'>
                          <span className='text-3xl font-black text-primary'>
                            {activeSiklus}
                          </span>
                          <p className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                            Siklus
                          </p>
                        </div>
                      </TableCell>
                    )}

                    {/* KELAS column */}
                    <TableCell className='text-center align-middle border-r font-bold text-xs text-foreground bg-muted/10'>
                      <Badge
                        variant='secondary'
                        className='text-xs font-bold px-2.5 py-1 uppercase tracking-wide'
                      >
                        {row.kelas === 'Semua Kelas'
                          ? 'Semua Kelas'
                          : `Kelas ${row.kelas}`}
                      </Badge>
                    </TableCell>

                    {/* JENIS MAKANAN column */}
                    <TableCell className='text-center align-middle border-r bg-muted/5'>
                      <Badge
                        variant='outline'
                        className={`text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wider ${badgeStyle}`}
                      >
                        {row.jenis_makanan}
                      </Badge>
                    </TableCell>

                    {/* MAKAN PAGI */}
                    <TableCell className='border-r align-top p-1 bg-background'>
                      {renderSlotCell(row.kelas, row.jenis_makanan, 'PAGI')}
                    </TableCell>

                    {/* MAKAN SIANG */}
                    <TableCell className='border-r align-top p-1 bg-background'>
                      {renderSlotCell(row.kelas, row.jenis_makanan, 'SIANG')}
                    </TableCell>

                    {/* MAKAN SORE — Buah dan Snack hanya tersedia Pagi & Siang */}
                    {row.hanyaPagiSiang ? (
                      <TableCell className='border-r align-top p-1 bg-muted/40'>
                        <div className='min-h-[90px] p-2 flex flex-col items-center justify-center gap-1 rounded-lg text-center select-none'>
                          <span className='text-[11px] font-semibold text-muted-foreground'>
                            —
                          </span>
                          <span className='text-[10px] leading-tight text-muted-foreground/70 italic'>
                            {row.jenis_makanan === 'BUAH' ? 'Buah' : 'Snack'} hanya
                            <br />
                            Pagi & Siang
                          </span>
                          {legacyFruitSore.map((dish) => (
                            <button
                              key={dish.id}
                              type='button'
                              onClick={() => onEditItem(dish)}
                              className='text-[10px] text-amber-700 dark:text-amber-300 underline cursor-pointer'
                            >
                              Pindahkan menu lama: {dish.nama_makanan}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell className='border-r align-top p-1 bg-background'>
                        {renderSlotCell(row.kelas, row.jenis_makanan, 'SORE')}
                      </TableCell>
                    )}

                    {/* SARING (SIANG) (Shown on row 0 with rowSpan across all rows) */}
                    {idx === 0 && (
                      <TableCell
                        rowSpan={matrixRows.length}
                        className='align-top p-1.5 bg-primary/2'
                      >
                        {renderSlotCell(
                          'Semua Kelas',
                          'SARING',
                          'SARING',
                          saringSiangItems,
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className='sm:max-w-md p-6'>
          <DialogHeader className='gap-2'>
            <div className='p-3 rounded-full bg-rose-500/10 text-rose-600 w-fit'>
              <AlertTriangle className='w-6 h-6' />
            </div>
            <DialogTitle className='text-base font-bold'>
              Hapus Hidangan dari Siklus Menu?
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Apakah Anda yakin ingin menghapus hidangan{' '}
              <strong className='text-foreground'>
                &quot;{itemToDelete?.nama_makanan}&quot;
                {itemToDelete?.kategori_menu &&
                  ` (${itemToDelete.kategori_menu})`}
              </strong>{' '}
              dari Siklus #{itemToDelete?.siklus_ke}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 pt-2 border-t'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Hidangan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

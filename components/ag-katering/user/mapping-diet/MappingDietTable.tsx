'use client';

import React from 'react';
import type { UnmappedDietItem } from '@/servers/mapping-diet.service';
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
  Pencil,
  Users,
  AlertCircle,
  GitBranch,
  UtensilsCrossed,
} from 'lucide-react';

interface MappingDietTableProps {
  items: UnmappedDietItem[];
  selectedRaws: string[];
  onToggleSelect: (raw: string) => void;
  onToggleSelectAll: () => void;
  onOpenDialog: (item: UnmappedDietItem) => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'UNMAPPED') {
    return (
      <span className='inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 animate-pulse'>
        <AlertCircle className='w-3 h-3' /> UNMAPPED
      </span>
    );
  }
  if (status === 'PARTIAL') {
    return (
      <span className='inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
        <GitBranch className='w-3 h-3' /> PARTIAL
      </span>
    );
  }
  return <Badge variant='outline'>{status}</Badge>;
}

function MappingPreview({ item }: { item: UnmappedDietItem }) {
  if (item.status_mapping === 'UNMAPPED') {
    return (
      <span className='text-[11px] italic text-muted-foreground'>
        — Belum ada mapping —
      </span>
    );
  }

  const parts = [
    item.bentuk_makanan && (
      <span
        key='bentuk'
        className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200'
      >
        {item.bentuk_makanan}
      </span>
    ),
    item.kategori_diet && (
      <span
        key='kategori'
        className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200'
      >
        {item.kategori_diet}
      </span>
    ),
    item.extra && (
      <span
        key='extra'
        className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200'
      >
        +{item.extra}
      </span>
    ),
    item.buah && (
      <span
        key='buah'
        className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
      >
        🍊 {item.buah}
      </span>
    ),
    item.snack && (
      <span
        key='snack'
        className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200'
      >
        🍪 {item.snack}
      </span>
    ),
  ].filter(Boolean);

  return (
    <div className='flex flex-wrap gap-1'>
      {parts.length > 0 ? parts : (
        <span className='text-[11px] italic text-muted-foreground'>
          — Data partial kosong —
        </span>
      )}
    </div>
  );
}

export default function MappingDietTable({
  items,
  selectedRaws,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDialog,
}: MappingDietTableProps) {
  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-12 bg-card rounded-2xl border text-center shadow-xs'>
        <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3'>
          <UtensilsCrossed className='w-6 h-6' />
        </div>
        <h4 className='font-semibold text-base text-foreground'>
          Tidak ada diet yang belum termapping
        </h4>
        <p className='text-xs text-muted-foreground max-w-sm mt-1'>
          Semua diet pasien aktif sudah memiliki mapping atau tidak ada data
          yang sesuai filter.
        </p>
      </div>
    );
  }

  const isAllSelected =
    items.length > 0 && items.every((i) => selectedRaws.includes(i.diet_rs_raw));

  return (
    <div className='rounded-2xl border bg-card shadow-xs overflow-hidden w-full min-w-0'>
      <div className='overflow-x-auto w-full'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead className='w-[40px] px-3'>
                <input
                  type='checkbox'
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className='rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer'
                  title='Pilih semua item'
                />
              </TableHead>
              <TableHead className='min-w-[200px] text-xs font-semibold'>
                Diet RS Raw (Free Text)
              </TableHead>
              <TableHead className='w-[130px] text-xs font-semibold'>
                Kelas Pasien
              </TableHead>
              <TableHead className='w-[100px] text-xs font-semibold text-center'>
                <span className='flex items-center justify-center gap-1'>
                  <Users className='w-3.5 h-3.5' /> Pasien
                </span>
              </TableHead>
              <TableHead className='w-[120px] text-xs font-semibold'>
                Status Mapping
              </TableHead>
              <TableHead className='min-w-[220px] text-xs font-semibold'>
                Preview Mapping
              </TableHead>
              <TableHead className='w-[90px] text-xs font-semibold text-right'>
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isSelected = selectedRaws.includes(item.diet_rs_raw);
              return (
                <TableRow
                  key={item.diet_rs_raw}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : item.status_mapping === 'UNMAPPED'
                      ? 'bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60'
                      : 'bg-amber-50/20 dark:bg-amber-950/5 hover:bg-amber-50/40'
                  }`}
                >
                  {/* Checkbox */}
                  <TableCell className='px-3 align-middle py-3.5'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.diet_rs_raw)}
                      className='rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer'
                    />
                  </TableCell>

                  {/* Diet RS Raw */}
                  <TableCell className='align-middle py-3.5'>
                    <span className='font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-1 rounded-md border inline-block max-w-[200px] truncate'>
                      {item.diet_rs_raw}
                    </span>
                  </TableCell>

                  {/* Kelas Pasien */}
                  <TableCell className='align-middle py-3.5'>
                    <div className='flex flex-wrap gap-1 max-w-[150px]'>
                      {item.kelas_list && item.kelas_list.length > 0 ? (
                        item.kelas_list.map((k) => (
                          <span
                            key={k}
                            className='inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          >
                            {k}
                          </span>
                        ))
                      ) : (
                        <span className='text-[10px] text-muted-foreground'>-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Jumlah Pasien */}
                  <TableCell className='align-middle py-3.5 text-center'>
                    <span className='inline-flex items-center justify-center gap-1 text-xs font-bold text-foreground'>
                      <Users className='w-3.5 h-3.5 text-muted-foreground' />
                      {item.jumlah_pasien}
                      <span className='font-normal text-muted-foreground text-[11px]'>
                        pasien
                      </span>
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className='align-middle py-3.5'>
                    <StatusBadge status={item.status_mapping} />
                  </TableCell>

                  {/* Preview Mapping */}
                  <TableCell className='align-middle py-3.5'>
                    <MappingPreview item={item} />
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className='align-middle py-3.5 text-right'>
                    <Button
                      size='sm'
                      onClick={() => onOpenDialog(item)}
                      className='h-8 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                      title='Buat / Edit Mapping'
                    >
                      <Pencil className='w-3.5 h-3.5' />
                      {item.status_mapping === 'UNMAPPED' ? 'Map' : 'Edit'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

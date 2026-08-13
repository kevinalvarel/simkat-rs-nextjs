'use client';

import React from 'react';
import type { RuanganDetail } from '@/servers/tempat.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Bed, Minus, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

interface RuanganCardProps {
  ruangan: RuanganDetail;
  isBedModified: boolean;
  onQuickAdjustBed: (ruangan: RuanganDetail, delta: number) => void;
  onEditRuangan: (ruangan: RuanganDetail) => void;
  onDeleteRuangan: (ruangan: RuanganDetail) => void;
}

export function renderKelasBadge(kelas: string) {
  const normalized = kelas.toUpperCase();
  if (normalized.includes('VVIP')) {
    return (
      <Badge className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-extrabold gap-1'>
        <Sparkles className='w-3 h-3 text-amber-500' />
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('VIP')) {
    return (
      <Badge className='bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 1') || normalized.includes('1')) {
    return (
      <Badge className='bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 2') || normalized.includes('2')) {
    return (
      <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('ICU') || normalized.includes('HCU')) {
    return (
      <Badge className='bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold'>
        {kelas}
      </Badge>
    );
  }
  return (
    <Badge variant='outline' className='font-medium'>
      {kelas}
    </Badge>
  );
}

export function RuanganCard({
  ruangan,
  isBedModified,
  onQuickAdjustBed,
  onEditRuangan,
  onDeleteRuangan,
}: RuanganCardProps) {
  return (
    <div
      className={`flex flex-col justify-between border rounded-xl p-3.5 bg-background hover:shadow-xs transition-all space-y-3 group/item ${
        isBedModified
          ? 'border-amber-500/50 dark:border-amber-500/40 ring-1 ring-amber-500/20'
          : 'border-border/80 hover:border-primary/40'
      }`}
    >
      {/* Top Info: Ruangan Name & Kelas */}
      <div className='space-y-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='space-y-0.5 min-w-0 flex-1'>
            <div className='flex items-center gap-1.5'>
              <DoorOpen className='w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
              <h4
                className='font-bold text-sm text-foreground truncate'
                title={ruangan.namaRuangan}
              >
                {ruangan.namaRuangan}
              </h4>
            </div>
          </div>
          {renderKelasBadge(ruangan.kelas)}
        </div>
      </div>

      {/* Bed Capacity Controls */}
      <div
        className={`flex items-center justify-between pt-2 border-t border-dashed text-xs p-2 rounded-lg transition-colors ${
          isBedModified ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/30'
        }`}
      >
        <span className='font-semibold text-muted-foreground flex items-center gap-1.5'>
          <Bed className='w-3.5 h-3.5 text-purple-600 dark:text-purple-400' />
          Bed:
          {isBedModified && (
            <span className='text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded'>
              Belum Disimpan
            </span>
          )}
        </span>

        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => onQuickAdjustBed(ruangan, -1)}
            className='h-6 w-6 rounded bg-muted hover:bg-destructive hover:text-white flex items-center justify-center transition-colors font-bold text-xs'
            title='Kurangi 1 Bed'
          >
            <Minus className='w-3 h-3' />
          </button>
          <span
            className={`font-mono font-extrabold text-sm px-1 min-w-[20px] text-center ${
              isBedModified
                ? 'text-amber-700 dark:text-amber-300 font-black'
                : 'text-foreground'
            }`}
          >
            {ruangan.jumlahBed}
          </span>
          <button
            type='button'
            onClick={() => onQuickAdjustBed(ruangan, 1)}
            className='h-6 w-6 rounded bg-muted hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors font-bold text-xs'
            title='Tambah 1 Bed'
          >
            <Plus className='w-3 h-3' />
          </button>
        </div>
      </div>

      {/* Ruangan Action Footer */}
      <div className='flex items-center justify-end gap-1.5 pt-1'>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground'
          onClick={() => onEditRuangan(ruangan)}
        >
          <Pencil className='w-3 h-3' /> Edit Ruangan
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-[11px] gap-1 text-destructive hover:bg-destructive/10'
          onClick={() => onDeleteRuangan(ruangan)}
        >
          <Trash2 className='w-3 h-3' /> Hapus
        </Button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { KamarDetail, RuanganDetail } from '@/servers/tempat.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DoorClosed,
  Bed,
  Minus,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface KamarCardProps {
  kamar: KamarDetail;
  ruangan: RuanganDetail;
  isBedModified: boolean;
  onQuickAdjustBed: (
    ruangan: RuanganDetail,
    kamarId: string,
    delta: number,
  ) => void;
  onEditKamar: (ruangan: RuanganDetail, kamar: KamarDetail) => void;
  onDeleteKamar: (ruangan: RuanganDetail, kamar: KamarDetail) => void;
}

export function renderKelasBadge(kelas: string) {
  const normalized = kelas.toUpperCase();
  if (normalized.includes('VVIP')) {
    return (
      <Badge className='bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-extrabold text-[10px] py-0 px-1.5 gap-1'>
        <Sparkles className='w-2.5 h-2.5 text-amber-500' />
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('VIP')) {
    return (
      <Badge className='bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold text-[10px] py-0 px-1.5'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 1') || normalized.includes('1')) {
    return (
      <Badge className='bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-semibold text-[10px] py-0 px-1.5'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('KELAS 2') || normalized.includes('2')) {
    return (
      <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-[10px] py-0 px-1.5'>
        {kelas}
      </Badge>
    );
  }
  if (normalized.includes('ICU') || normalized.includes('HCU')) {
    return (
      <Badge className='bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-[10px] py-0 px-1.5'>
        {kelas}
      </Badge>
    );
  }
  return (
    <Badge variant='outline' className='font-medium text-[10px] py-0 px-1.5'>
      {kelas}
    </Badge>
  );
}

export function KamarCard({
  kamar,
  ruangan,
  isBedModified,
  onQuickAdjustBed,
  onEditKamar,
  onDeleteKamar,
}: KamarCardProps) {
  // Generate visual bed badges (up to 8, rest as +N)
  const bedTokens = Array.from({ length: Math.min(kamar.jumlahBed, 6) }, (_, i) => i + 1);
  const remainingBeds = kamar.jumlahBed - bedTokens.length;

  return (
    <div
      className={`flex flex-col justify-between border rounded-xl p-3 bg-card hover:bg-muted/10 transition-all space-y-2.5 ${
        isBedModified
          ? 'border-amber-500/60 dark:border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30'
          : 'border-border/70 hover:border-primary/40 shadow-2xs'
      }`}
    >
      {/* Header: Nomor Pintu/Kamar & Action Buttons */}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          <div className='p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
            <DoorClosed className='w-4 h-4' />
          </div>
          <div className='min-w-0'>
            <h5
              className='font-bold text-xs sm:text-sm text-foreground truncate'
              title={kamar.nomorKamar}
            >
              {kamar.nomorKamar}
            </h5>
            {kamar.kelas && kamar.kelas !== ruangan.kelas && (
              <div className='mt-0.5'>{renderKelasBadge(kamar.kelas)}</div>
            )}
          </div>
        </div>

        {/* Small Action Buttons */}
        <div className='flex items-center gap-0.5 shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-muted-foreground hover:text-foreground'
            onClick={() => onEditKamar(ruangan, kamar)}
            title={`Edit ${kamar.nomorKamar}`}
          >
            <Pencil className='w-3 h-3' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
            onClick={() => onDeleteKamar(ruangan, kamar)}
            title={`Hapus ${kamar.nomorKamar}`}
          >
            <Trash2 className='w-3 h-3' />
          </Button>
        </div>
      </div>

      {/* Visual Bed Tokens Pills */}
      <div className='flex flex-wrap items-center gap-1 min-h-[22px]'>
        {bedTokens.map((num) => (
          <span
            key={num}
            className='inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
          >
            <Bed className='w-2.5 h-2.5' />
            Bed {num}
          </span>
        ))}
        {remainingBeds > 0 && (
          <span className='inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border'>
            +{remainingBeds} bed
          </span>
        )}
      </div>

      {/* Bed Capacity Controls */}
      <div
        className={`flex items-center justify-between pt-2 border-t border-dashed text-xs px-2 py-1.5 rounded-lg transition-colors ${
          isBedModified ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/40'
        }`}
      >
        <span className='font-semibold text-muted-foreground flex items-center gap-1.5 text-[11px]'>
          <Bed className='w-3 h-3 text-purple-600 dark:text-purple-400' />
          Kapasitas Bed:
          {isBedModified && (
            <span className='text-[9px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-1 py-0.2 rounded'>
              Pending
            </span>
          )}
        </span>

        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => onQuickAdjustBed(ruangan, kamar.idKamar, -1)}
            className='h-5 w-5 rounded bg-muted hover:bg-destructive hover:text-white flex items-center justify-center transition-colors font-bold text-[10px] cursor-pointer'
            title='Kurangi 1 Bed'
          >
            <Minus className='w-2.5 h-2.5' />
          </button>
          <span
            className={`font-mono font-bold text-xs px-1 min-w-[18px] text-center ${
              isBedModified
                ? 'text-amber-700 dark:text-amber-300 font-black'
                : 'text-foreground'
            }`}
          >
            {kamar.jumlahBed}
          </span>
          <button
            type='button'
            onClick={() => onQuickAdjustBed(ruangan, kamar.idKamar, 1)}
            className='h-5 w-5 rounded bg-muted hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors font-bold text-[10px] cursor-pointer'
            title='Tambah 1 Bed'
          >
            <Plus className='w-2.5 h-2.5' />
          </button>
        </div>
      </div>
    </div>
  );
}

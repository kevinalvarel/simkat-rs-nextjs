'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export interface ReadyDietRow {
  diet_rs_raw: string;
  mode?: 'STANDARD' | 'NPO';
  bentukMakanan: string;
  karbohidrat: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  jumlahPasien?: number;
  /** True bila bentuk yang dipilih berflag tugas AG Katering (→ Live Katering). */
  isTugasKatering?: boolean;
}

interface MappingDietFloatingBarProps {
  readyRows: ReadyDietRow[];
  dirtyCount: number;
  onConfirm: () => void;
  onReset: () => void;
  isSubmitting?: boolean;
}

export default function MappingDietFloatingBar({
  readyRows,
  dirtyCount,
  onConfirm,
  onReset,
  isSubmitting = false,
}: MappingDietFloatingBarProps) {
  if (dirtyCount === 0) return null;

  const count = readyRows.length;
  return (
    <div className='fixed left-1/2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-full border bg-card/95 py-1.5 pl-3.5 pr-1.5 shadow-lg backdrop-blur animate-in slide-in-from-bottom-6 duration-300'>
      <div className='flex items-center gap-2 sm:gap-3'>
        <span className='whitespace-nowrap text-[11px] font-semibold text-foreground sm:text-xs overflow-hidden text-ellipsis'>
          {count} siap disimpan{dirtyCount > count ? ` / ${dirtyCount - count} belum valid` : ''}
        </span>
        <div className='flex items-center gap-1.5'>
          <Button variant='outline' size='sm' onClick={onReset} disabled={isSubmitting} aria-label='Batalkan semua draft di tab ini' className='h-7 rounded-full px-2 text-[11px]'>
            <RotateCcw className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>Batalkan</span>
          </Button>
          <Button type='button' size='sm' onClick={onConfirm} disabled={isSubmitting || count === 0} className='h-7 rounded-full text-[11px] font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'>
            <CheckCircle2 className='w-3.5 h-3.5' />
            Konfirmasi ({count})
          </Button>
        </div>
      </div>
    </div>
  );
}

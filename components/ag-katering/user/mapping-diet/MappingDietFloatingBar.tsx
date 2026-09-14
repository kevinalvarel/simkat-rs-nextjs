'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export interface ReadyDietRow {
  diet_rs_raw: string;
  mode?: 'STANDARD' | 'NPO' | 'KATERING';
  bentukMakanan: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  jumlahPasien?: number;
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
    <div className='fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto w-auto max-w-lg rounded-xl border bg-card p-2.5 shadow-xl animate-in slide-in-from-bottom-6 duration-300 sm:inset-x-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-xs font-semibold text-foreground'>
          {count} siap disimpan{dirtyCount > count ? ` / ${dirtyCount - count} belum valid` : ''}
        </span>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={onReset} disabled={isSubmitting} aria-label='Batalkan semua draft di tab ini'>
            <RotateCcw className='w-4 h-4' />
            <span className='hidden sm:inline'>Batalkan</span>
          </Button>
          <Button type='button' size='sm' onClick={onConfirm} disabled={isSubmitting || count === 0} className='h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'>
            <CheckCircle2 className='w-4 h-4' />
            Konfirmasi ({count})
          </Button>
        </div>
      </div>
    </div>
  );
}

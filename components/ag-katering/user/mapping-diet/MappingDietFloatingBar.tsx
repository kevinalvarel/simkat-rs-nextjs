'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, Send, Sparkles } from 'lucide-react';

export interface ReadyDietRow {
  diet_rs_raw: string;
  karbo: string;
  hewani: string;
  nabati: string;
  sayur: string;
  buah: string;
  snack: string;
  jumlahPasien?: number;
}

interface MappingDietFloatingBarProps {
  readyRows: ReadyDietRow[];
  onConfirm: () => void;
  onReset: () => void;
  isSubmitting?: boolean;
}

export default function MappingDietFloatingBar({
  readyRows,
  onConfirm,
  onReset,
  isSubmitting = false,
}: MappingDietFloatingBarProps) {
  if (readyRows.length === 0) return null;

  const count = readyRows.length;

  return (
    <div className='fixed bottom-12 right-16 -translate-x-1/2 z-50 max-w-2xl animate-in slide-in-from-bottom-6 duration-300'>
      {/* Right: Actions */}
      <div className='flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end'>
        <Button variant='outline' size='sm' onClick={onReset}>
          <RotateCcw className='w-4 h-4' />
        </Button>
        <Button
          type='button'
          size='sm'
          onClick={onConfirm}
          disabled={isSubmitting}
          className='h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'
        >
          <CheckCircle2 className='w-4 h-4' />
          Konfirmasi
        </Button>
      </div>
    </div>
  );
}

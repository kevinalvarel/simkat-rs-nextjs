'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Save, Loader2 } from 'lucide-react';

interface FloatingSaveBarProps {
  pendingCount: number;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function FloatingSaveBar({
  pendingCount,
  isSaving,
  onReset,
  onSave,
}: FloatingSaveBarProps) {
  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 bg-foreground text-background dark:bg-card dark:text-foreground px-5 py-3 rounded-2xl shadow-2xl border border-border animate-in slide-in-from-bottom-5 duration-300 max-w-lg w-[calc(100%-2rem)]'>
      <div className='flex items-center gap-2.5 text-xs font-medium min-w-0'>
        <span className='relative flex h-2.5 w-2.5 shrink-0'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500'></span>
        </span>
        <span className='truncate'>
          Ada <strong>{pendingCount}</strong> perubahan bed belum disimpan
        </span>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          disabled={isSaving}
          className='h-8 text-xs hover:bg-background/20 dark:hover:bg-muted'
        >
          <RotateCcw className='w-3.5 h-3.5 mr-1' /> Batal
        </Button>
        <Button
          size='sm'
          onClick={onSave}
          disabled={isSaving}
          className='h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5'
        >
          {isSaving ? (
            <>
              <Loader2 className='w-3.5 h-3.5 animate-spin' />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className='w-3.5 h-3.5' />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

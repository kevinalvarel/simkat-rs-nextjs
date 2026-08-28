'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Building, ShieldCheck, RotateCcw, Save, Plus, Loader2 } from 'lucide-react';

interface KonfigurasiHeaderProps {
  hasUnsavedChanges: boolean;
  pendingCount: number;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
  onOpenAddGedung: () => void;
}

export function KonfigurasiHeader({
  hasUnsavedChanges,
  pendingCount,
  isSaving,
  onReset,
  onSave,
  onOpenAddGedung,
}: KonfigurasiHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent p-6 rounded-2xl border border-blue-500/20 shadow-xs'>
      <div className='space-y-1.5'>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2.5'>
          <div className='p-2 bg-blue-500/10 rounded-xl border border-blue-500/20'>
            <Building className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          </div>
          Konfigurasi Tempat & Ruangan
        </h1>
        <p className='text-xs sm:text-sm text-muted-foreground max-w-2xl'>
          Modul hierarki <strong>Gedung ➔ Ruangan ➔ Nomor Pintu / Kamar ➔ Bed</strong> untuk
          mengatur tata letak rawat inap pasien dan kapasitas bed rumah sakit.
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0'>
        <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold'>
          <ShieldCheck className='w-4 h-4' />
          Area Supervisor
        </div>
        {hasUnsavedChanges && (
          <>
            <Button
              variant='outline'
              size='default'
              onClick={onReset}
              disabled={isSaving}
              className='gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-medium'
            >
              <RotateCcw className='w-4 h-4' />
              Batal
            </Button>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md animate-pulse hover:animate-none'
            >
              {isSaving ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  Simpan Perubahan ({pendingCount})
                </>
              )}
            </Button>
          </>
        )}
        <Button
          onClick={onOpenAddGedung}
          className='gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold'
        >
          <Plus className='w-4 h-4' />
          Tambah Gedung Baru
        </Button>
      </div>
    </div>
  );
}

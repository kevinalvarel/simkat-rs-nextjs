'use client';

import React from 'react';
import { History, RefreshCw, Download, PlusCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RiwayatDietHeaderProps {
  totalItems: number;
  onRefresh: () => void;
  onExportCsv: () => void;
  onOpenAddModal: () => void;
  isRefreshing?: boolean;
}

export function RiwayatDietHeader({
  totalItems,
  onRefresh,
  onExportCsv,
  onOpenAddModal,
  isRefreshing = false,
}: RiwayatDietHeaderProps) {
  return (
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card/60 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-sm'>
      {/* Title & Badge */}
      <div className='space-y-1.5'>
        <div className='flex items-center gap-2.5 flex-wrap'>
          <div className='p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20'>
            <History className='w-6 h-6' />
          </div>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              Riwayat Perubahan Diet Pasien
            </h1>
            <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
              Audit log pencatatan instruksi diet pasien oleh staf{' '}
              <span className='font-semibold text-primary inline-flex items-center gap-1'>
                <ShieldCheck className='w-3.5 h-3.5' /> Gizi-RS
              </span>{' '}
              (Menampilkan Nama & Email Terdaftar).
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center gap-2.5 flex-wrap self-start md:self-center'>
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='gap-2 text-xs h-9 border-border/80 hover:bg-accent'
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={onExportCsv}
          className='gap-2 text-xs h-9 border-border/80 hover:bg-accent text-foreground'
        >
          <Download className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
          Ekspor CSV ({totalItems})
        </Button>

        <Button
          size='sm'
          onClick={onOpenAddModal}
          className='gap-2 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium'
        >
          <PlusCircle className='w-4 h-4' />
          Catat Perubahan Diet
        </Button>
      </div>
    </div>
  );
}

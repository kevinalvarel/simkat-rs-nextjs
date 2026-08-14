'use client';

import React from 'react';
import { Utensils, RefreshCw, Clock, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { PemorsianBatchOption } from '@/types/pemorsiantypes';

interface PemorsianHeaderProps {
  currentBatch: PemorsianBatchOption | null;
  availableBatches: PemorsianBatchOption[];
  onBatchChange: (batchId: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function PemorsianHeader({
  currentBatch,
  availableBatches,
  onBatchChange,
  onRefresh,
  isRefreshing,
}: PemorsianHeaderProps) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 shadow-xs'>
      {/* Title & Description */}
      <div className='space-y-1'>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans flex items-center gap-2.5'>
          <Utensils className='w-6 h-6 text-primary' />
          Pemorsian & Cetak Etiket Makanan
        </h1>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Layar pemorsian makanan dan pencetakan etiket label pasien dari
          snapshot produksi & revisi susulan.
        </p>
      </div>

      {/* Snapshot Batch Controls & Refresh */}
      <div className='flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0'>
        {/* Batch Selector Dropdown with clean width & popover styling */}
        {availableBatches && availableBatches.length > 0 && (
          <div className='flex items-center gap-2 bg-background border rounded-xl px-3 py-1.5 shadow-2xs'>
            <Layers className='w-4 h-4 text-primary shrink-0' />
            <Select
              value={currentBatch ? String(currentBatch.id) : undefined}
              onValueChange={(val) => {
                if (val) onBatchChange(Number(val));
              }}
            >
              <SelectTrigger className='w-[190px] sm:w-[240px] h-7 border-0 p-0 text-xs font-semibold focus:ring-0 focus:ring-offset-0 gap-1.5 shadow-none truncate'>
                <SelectValue placeholder='Pilih Batch Snapshot' />
              </SelectTrigger>
              <SelectContent
                align='end'
                className='w-[300px] sm:w-[360px] p-1.5 shadow-lg border border-border z-[100]'
              >
                {availableBatches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={String(b.id)}
                    className='cursor-pointer py-2 px-2.5 rounded-lg'
                  >
                    <div className='flex items-center justify-between w-full gap-2'>
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <span className='font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0'>
                          {b.waktu_makan}
                        </span>
                        <span className='text-xs font-mono truncate text-foreground'>
                          {b.batch_code}
                        </span>
                      </div>
                      <span className='text-[11px] text-muted-foreground shrink-0 font-medium'>
                        {b.total_pasien} Pasien
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Live Cycle Indicator */}
        <div className='flex items-center gap-2 bg-background border rounded-xl px-3 py-2 shadow-2xs'>
          <Clock className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
          <span className='text-xs text-muted-foreground font-medium'>
            Siklus:{' '}
            <strong className='text-foreground'>
              {currentBatch?.waktu_makan || 'PAGI'}
            </strong>
          </span>
        </div>

        {/* Refresh Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='h-9 px-3 gap-1.5 text-xs rounded-xl'
          title='Muat ulang data snapshot'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className='hidden sm:inline'>Refresh</span>
        </Button>
      </div>
    </div>
  );
}

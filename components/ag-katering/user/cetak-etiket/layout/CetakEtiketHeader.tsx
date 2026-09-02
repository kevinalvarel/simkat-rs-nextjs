'use client';

import React from 'react';
import { UtensilsCrossed, Layers, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PemorsianBatchOption } from '@/types/cetaketikettypes';

interface CetakEtiketHeaderProps {
  batch: PemorsianBatchOption | null;
  availableBatches: PemorsianBatchOption[];
  waktuMakan?: string;
  isRefreshing: boolean;
  onSelectBatch: (batchId: number) => void;
  onRefresh: () => void;
}

export default function CetakEtiketHeader({
  batch,
  availableBatches,
  waktuMakan,
  isRefreshing,
  onSelectBatch,
  onRefresh,
}: CetakEtiketHeaderProps) {
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 rounded-2xl border shadow-2xs'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2.5 flex-wrap'>
          <UtensilsCrossed className='w-6 h-6 text-emerald-600 shrink-0' />
          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            Pemorsian & Cetak Etiket Makanan
          </h1>
        </div>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Layar pemorsian makanan dan pencetakan etiket label pasien dari
          snapshot produksi & revisi susulan.
        </p>
      </div>

      {/* Controls: Batch Selector, Mealtime Pill, Refresh */}
      <div className='flex items-center gap-2.5 flex-wrap shrink-0'>
        {/* Batch Selector */}
        <div className='w-[120px] sm:w-[140px]'>
          <Select
            value={batch ? String(batch.id) : ''}
            onValueChange={(val) => {
              if (val) onSelectBatch(Number(val));
            }}
            disabled={isRefreshing}
          >
            <SelectTrigger className='h-9 text-xs font-semibold bg-background rounded-xl border border-border shadow-2xs'>
              <div className='flex items-center gap-1.5 truncate'>
                <Layers className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                <SelectValue placeholder='Pilih Batch'>
                  {batch?.id || 'Live Snapshot'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableBatches.map((b) => (
                <SelectItem
                  key={b.id}
                  value={String(b.id)}
                  className='text-xs font-medium'
                >
                  Batch #{b.id} ({b.waktu_makan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Siklus Waktu Makan Pill */}
        <div className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 text-xs font-semibold'>
          <Clock className='w-3.5 h-3.5 text-emerald-600' />
          <span>Siklus: {waktuMakan || 'SIANG'}</span>
        </div>

        {/* Refresh Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='h-9 rounded-xl text-xs font-semibold gap-1.5 border border-border shadow-2xs hover:bg-muted/80'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${
              isRefreshing ? 'animate-spin text-primary' : ''
            }`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

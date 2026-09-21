'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  UtensilsCrossed,
  Layers,
  Clock,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  CalendarDays,
  Sunrise,
  Sun,
  Moon,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useCycleBadges } from '@/hooks/use-cycle-badges';
import type { PemorsianBatchOption } from '@/types/cetaketikettypes';

export type WaktuMakanType = 'PAGI' | 'SIANG' | 'MALAM';

interface CetakEtiketHeaderProps {
  batch: PemorsianBatchOption | null;
  availableBatches: PemorsianBatchOption[];
  waktuMakan?: string;
  tanggalProduksi?: string;
  selectedDate: string; // YYYY-MM-DD
  selectedWaktu: WaktuMakanType;
  isLive: boolean;
  isRefreshing: boolean;
  onSelectLive: () => void;
  onDateChange: (date: string) => void;
  onWaktuChange: (waktu: WaktuMakanType) => void;
  onRefresh: () => void;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSafe(dateStr?: string): Date {
  if (!dateStr) return new Date();
  try {
    const d = parseISO(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

export default function CetakEtiketHeader({
  batch,
  availableBatches,
  waktuMakan,
  tanggalProduksi,
  selectedDate,
  selectedWaktu,
  isLive,
  isRefreshing,
  onSelectLive,
  onDateChange,
  onWaktuChange,
  onRefresh,
}: CetakEtiketHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const currentDateObj = parseSafe(selectedDate);
  const { getCycleForDate } = useCycleBadges();

  // Check which mealtimes have locked batches for the selected date
  const existingWaktuForDate = useMemo(() => {
    return availableBatches
      .filter((b) => b.tanggal_produksi === selectedDate)
      .map((b) => b.waktu_makan.toUpperCase());
  }, [availableBatches, selectedDate]);

  function handleSelectDate(d?: Date) {
    if (!d) return;
    onDateChange(toDateString(d));
    setIsCalendarOpen(false);
  }

  function handleQuickPreset(type: 'today' | 'yesterday' | 'tomorrow') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target =
      type === 'today'
        ? today
        : type === 'yesterday'
          ? subDays(today, 1)
          : addDays(today, 1);
    onDateChange(toDateString(target));
    setIsCalendarOpen(false);
  }

  const mealOptions: Array<{
    id: WaktuMakanType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'PAGI', label: 'Pagi', icon: Sunrise },
    { id: 'SIANG', label: 'Siang', icon: Sun },
    { id: 'MALAM', label: 'Malam', icon: Moon },
  ];

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-4 sm:p-5 rounded-2xl border shadow-2xs min-w-0'>
      {/* Title & Description */}
      <div className='space-y-1 min-w-0'>
        <div className='flex items-center gap-2.5 flex-wrap'>
          <UtensilsCrossed className='w-6 h-6 text-emerald-600 shrink-0' />
          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            Pemorsian & Cetak Etiket Makanan
          </h1>
          {isLive ? (
            <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
              </span>
              Live Snapshot
            </span>
          ) : batch ? (
            <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'>
              <Layers className='w-3 h-3' />
              Batch #{batch.id} ({batch.status_batch})
            </span>
          ) : (
            <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'>
              <Clock className='w-3 h-3' />
              Proyeksi Menu
            </span>
          )}
        </div>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Layar pemorsian makanan dan pencetakan etiket label pasien dari
          snapshot produksi & revisi susulan.
        </p>
      </div>

      {/* Controls: Live Button, Calendar Date Picker, Mealtime Toggle, Refresh */}
      <div className='flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0'>
        {/* 1. Live Snapshot Default Button */}
        <Button
          type='button'
          size='sm'
          onClick={onSelectLive}
          disabled={isRefreshing}
          variant={isLive ? 'default' : 'outline'}
          className={cn(
            'h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all shadow-2xs',
            isLive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
              : 'border-border bg-background text-foreground hover:bg-muted/80',
          )}
          title='Beralih ke Live Snapshot saat ini (Default)'
        >
          <Radio
            className={cn(
              'w-3.5 h-3.5',
              isLive ? 'text-white animate-pulse' : 'text-emerald-600',
            )}
          />
          <span>Live Snapshot</span>
        </Button>

        {/* 2. Shadcn Popover + Calendar Date Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            disabled={isRefreshing}
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs select-none bg-background border-border text-foreground hover:bg-muted/80',
              !isLive && 'border-primary/50 text-foreground',
              isRefreshing && 'opacity-60 pointer-events-none',
            )}
          >
            <CalendarIcon className='w-3.5 h-3.5 text-primary shrink-0' />
            <span>{format(currentDateObj, 'd MMM yyyy', { locale: id })}</span>
            <ChevronDown className='w-3 h-3 text-muted-foreground opacity-70' />
          </PopoverTrigger>

          <PopoverContent
            align='start'
            side='bottom'
            sideOffset={6}
            className='w-auto p-0 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden z-50'
          >
            {/* Popover Header */}
            <div className='p-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3'>
              <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                <CalendarDays className='w-3.5 h-3.5 text-primary' />
                Pilih Tanggal Etiket
              </span>

              {/* Quick Presets */}
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => handleQuickPreset('yesterday')}
                  className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                >
                  Kemarin
                </button>
                <button
                  type='button'
                  onClick={() => handleQuickPreset('today')}
                  className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                >
                  Hari Ini
                </button>
                <button
                  type='button'
                  onClick={() => handleQuickPreset('tomorrow')}
                  className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                >
                  Besok
                </button>
              </div>
            </div>

            {/* Shadcn Calendar Component */}
            <div className='p-2 flex justify-center'>
              <Calendar
                mode='single'
                selected={currentDateObj}
                onSelect={handleSelectDate}
                locale={id}
                showCycleBadges
                getCycleForDate={getCycleForDate}
                className='rounded-xl border-none p-2'
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* 3. Shadcn ToggleGroup for Meal Time (Pagi / Siang / Malam) */}
        <ToggleGroup
          value={[selectedWaktu]}
          onValueChange={(val) => {
            if (val && val.length > 0) {
              onWaktuChange(val[val.length - 1] as WaktuMakanType);
            }
          }}
          disabled={isRefreshing}
          className='border border-border/80 rounded-xl p-0.5 shadow-2xs'
        >
          {mealOptions.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedWaktu === m.id;
            const hasBatch = existingWaktuForDate.includes(m.id);

            return (
              <ToggleGroupItem
                key={m.id}
                value={m.id}
                size='sm'
                className={cn(
                  'text-xs font-semibold gap-1.5 px-2.5 sm:px-3 h-8 rounded-lg cursor-pointer transition-all select-none ',
                  isSelected
                    ? 'shadow-xs font-bold hover:bg-primary/90'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
                title={`Snapshot waktu ${m.label}`}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    isSelected ? '' : 'text-muted-foreground',
                  )}
                />
                <span>{m.label}</span>

                {/* Dot indicator if snapshot batch exists in DB */}
                {hasBatch && (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isSelected
                        ? 'bg-white'
                        : 'bg-emerald-500 dark:bg-emerald-400',
                    )}
                    title='Snapshot batch tersedia'
                  />
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        {/* 4. Refresh Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          disabled={isRefreshing}
          className='h-9 rounded-xl text-xs font-semibold gap-1.5 border border-border shadow-2xs hover:bg-muted/80'
          title='Muat ulang data snapshot'
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${
              isRefreshing ? 'animate-spin text-primary' : ''
            }`}
          />
          <span className='hidden sm:inline'>Refresh</span>
        </Button>
      </div>
    </div>
  );
}

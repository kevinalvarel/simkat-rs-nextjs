'use client';

import React, { useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Sunrise,
  Sun,
  Moon,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type WaktuMakanType = 'PAGI' | 'SIANG' | 'MALAM';

interface DpmpDateWaktuPickerProps {
  selectedDate: string; // YYYY-MM-DD
  selectedWaktu: WaktuMakanType;
  onChange: (date: string, waktu: WaktuMakanType) => void;
  existingWaktuForDate?: string[]; // e.g. ['PAGI', 'SIANG']
  currentLiveWaktu?: 'PAGI' | 'SIANG' | 'MALAM';
  isLocked?: boolean;
  disabled?: boolean;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSafe(dateStr?: string): Date {
  if (!dateStr || dateStr === 'LIVE_PREVIEW') return new Date();
  try {
    const d = parseISO(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

export default function DpmpDateWaktuPicker({
  selectedDate,
  selectedWaktu,
  onChange,
  existingWaktuForDate = [],
  currentLiveWaktu,
  isLocked = false,
  disabled = false,
}: DpmpDateWaktuPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentDateObj = parseSafe(selectedDate);

  function handleSelectDate(d?: Date) {
    if (!d) return;
    const dateStr = toDateString(d);
    onChange(dateStr, selectedWaktu);
    setIsOpen(false);
  }

  function handleSelectWaktu(waktu: WaktuMakanType) {
    if (waktu === selectedWaktu) return;
    onChange(selectedDate, waktu);
  }

  function handleQuickPreset(type: 'today' | 'yesterday') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = type === 'today' ? today : subDays(today, 1);
    onChange(toDateString(target), selectedWaktu);
    setIsOpen(false);
  }

  const mealOptions: Array<{
    id: WaktuMakanType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    timeHint: string;
  }> = [
    { id: 'PAGI', label: 'Pagi', icon: Sunrise, timeHint: '06:00' },
    { id: 'SIANG', label: 'Siang', icon: Sun, timeHint: '11:30' },
    { id: 'MALAM', label: 'Malam', icon: Moon, timeHint: '17:00' },
  ];

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {/* 1. Shadcn Date Picker Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs select-none bg-background border-border text-foreground hover:bg-muted/80',
            disabled && 'opacity-60 pointer-events-none',
          )}
        >
          <CalendarIcon className='w-3.5 h-3.5 text-primary shrink-0' />
          <span>{format(currentDateObj, 'd MMMM yyyy', { locale: id })}</span>
          <ChevronDown className='w-3 h-3 text-muted-foreground ml-0.5 opacity-70' />
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
              Pilih Tanggal DPMP
            </span>

            {/* Quick Presets */}
            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={() => handleQuickPreset('today')}
                className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              >
                Hari Ini
              </button>
              <button
                type='button'
                onClick={() => handleQuickPreset('yesterday')}
                className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
              >
                Kemarin
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
              className='rounded-xl border-none p-2'
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Shadcn ToggleGroup for Meal Time (Pagi / Siang / Malam) */}
      <ToggleGroup
        value={[selectedWaktu]}
        onValueChange={(val) => {
          if (val && val.length > 0) {
            handleSelectWaktu(val[val.length - 1] as WaktuMakanType);
          }
        }}
        disabled={disabled}
        className='border border-border/80 bg-background rounded-xl p-0.5 shadow-2xs'
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
                'text-xs font-semibold gap-1.5 px-3 h-8 rounded-lg cursor-pointer transition-all select-none',
                isSelected
                  ? 'text-primary shadow-xs font-bold hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                'aria-selected:bg-primary',
              )}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isSelected
                    ? 'text-black-foreground'
                    : 'text-muted-foreground',
                )}
              />
              <span>{m.label}</span>

              {/* Dot indicator if snapshot batch exists in DB */}
              {hasBatch && (
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    isSelected ? 'bg-emerald-500' : 'bg-muted-foreground',
                  )}
                  title='Snapshot batch tersedia'
                />
              )}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* 3. Snapshot Status Badge */}
      <Badge
        variant='outline'
        className={cn(
          'text-[10px] font-bold px-2.5 py-0.5 h-7 flex items-center gap-1.5 rounded-lg',
          isLocked
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        )}
      >
        {isLocked ? (
          <>
            <Clock className='w-3 h-3' />
            Snapshot Terkunci
          </>
        ) : (
          <>
            <span className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
            Live Preview
          </>
        )}
      </Badge>
    </div>
  );
}

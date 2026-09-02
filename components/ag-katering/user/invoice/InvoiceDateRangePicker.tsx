'use client';

import React, { useState } from 'react';
import {
  format,
  parseISO,
  isSameDay,
  subDays,
  startOfMonth,
} from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  CalendarDays,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

interface InvoiceDateRangePickerProps {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  disabled?: boolean;
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

export default function InvoiceDateRangePicker({
  value,
  onChange,
  disabled = false,
}: InvoiceDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine initial mode based on whether from !== to
  const isInitiallyRange = Boolean(
    value.to && value.to !== value.from,
  );
  const [mode, setMode] = useState<'single' | 'range'>(
    isInitiallyRange ? 'range' : 'single',
  );

  // Temporary selection inside popover
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    () => ({
      from: parseSafe(value.from),
      to: value.to ? parseSafe(value.to) : parseSafe(value.from),
    }),
  );

  const [selectedSingle, setSelectedSingle] = useState<Date | undefined>(
    () => parseSafe(value.from),
  );

  // Sync state when popover opens
  function handleOpenChange(open: boolean) {
    if (open) {
      const fromD = parseSafe(value.from);
      const toD = value.to ? parseSafe(value.to) : fromD;
      const isRange = Boolean(value.to && value.to !== value.from);
      setMode(isRange ? 'range' : 'single');
      setSelectedSingle(fromD);
      setSelectedRange({ from: fromD, to: toD });
    }
    setIsOpen(open);
  }

  // Quick Presets
  function applyPreset(type: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'today') {
      const dateStr = toDateString(today);
      onChange({ from: dateStr, to: dateStr });
      setIsOpen(false);
    } else if (type === 'yesterday') {
      const yest = subDays(today, 1);
      const dateStr = toDateString(yest);
      onChange({ from: dateStr, to: dateStr });
      setIsOpen(false);
    } else if (type === '7days') {
      const from = subDays(today, 6);
      onChange({ from: toDateString(from), to: toDateString(today) });
      setIsOpen(false);
    } else if (type === '30days') {
      const from = subDays(today, 29);
      onChange({ from: toDateString(from), to: toDateString(today) });
      setIsOpen(false);
    } else if (type === 'thisMonth') {
      const from = startOfMonth(today);
      onChange({ from: toDateString(from), to: toDateString(today) });
      setIsOpen(false);
    }
  }

  // Apply Single Date
  function handleApplySingle(d?: Date) {
    if (!d) return;
    const dateStr = toDateString(d);
    onChange({ from: dateStr, to: dateStr });
    setIsOpen(false);
  }

  // Apply Date Range
  function handleApplyRange() {
    if (!selectedRange?.from) return;
    const fromStr = toDateString(selectedRange.from);
    const toStr = selectedRange.to ? toDateString(selectedRange.to) : fromStr;
    onChange({ from: fromStr, to: toStr });
    setIsOpen(false);
  }

  // Calculate day count in range
  const rangeDayCount =
    selectedRange?.from && selectedRange?.to
      ? Math.round(
          (selectedRange.to.getTime() - selectedRange.from.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 1;

  // Formatted display for trigger button
  const isRangeActive = Boolean(value.to && value.to !== value.from);
  const fromDate = parseSafe(value.from);
  const toDate = value.to ? parseSafe(value.to) : fromDate;
  const activeDayCount = isRangeActive
    ? Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;

  let triggerLabel = '';
  if (isRangeActive) {
    const isSameYear = fromDate.getFullYear() === toDate.getFullYear();
    const fromFormat = isSameYear ? 'd MMM' : 'd MMM yyyy';
    triggerLabel = `${format(fromDate, fromFormat, { locale: id })} – ${format(toDate, 'd MMM yyyy', { locale: id })}`;
  } else {
    triggerLabel = format(fromDate, 'd MMMM yyyy', { locale: id });
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs select-none',
          isRangeActive
            ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/15'
            : 'bg-background border-border text-foreground hover:bg-muted/80',
        )}
      >
        <CalendarIcon
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            isRangeActive ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <span>{triggerLabel}</span>

        {isRangeActive && (
          <Badge
            variant='secondary'
            className='h-5 px-1.5 text-[10px] font-bold bg-primary/20 text-primary border-none rounded-md'
          >
            {activeDayCount} Hari
          </Badge>
        )}

        <ChevronDown className='w-3 h-3 text-muted-foreground ml-0.5 opacity-70' />
      </PopoverTrigger>

      <PopoverContent
        align='end'
        side='bottom'
        sideOffset={6}
        className='w-auto p-0 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground overflow-hidden z-50'
      >
        {/* Top Header & Mode Toggle */}
        <div className='p-3 border-b border-border bg-muted/20 flex flex-col gap-2.5'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
              <CalendarDays className='w-3.5 h-3.5 text-primary' />
              Pilih Waktu Konsumsi
            </span>

            {/* Mode Switcher */}
            <div className='inline-flex p-0.5 bg-muted rounded-lg text-xs border border-border/60'>
              <button
                type='button'
                onClick={() => setMode('single')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  mode === 'single'
                    ? 'bg-background text-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Harian
              </button>
              <button
                type='button'
                onClick={() => setMode('range')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  mode === 'range'
                    ? 'bg-background text-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Rentang Periode
              </button>
            </div>
          </div>

          {/* Quick Presets Pills */}
          <div className='flex items-center gap-1 flex-wrap pt-0.5'>
            <button
              type='button'
              onClick={() => applyPreset('today')}
              className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              Hari Ini
            </button>
            <button
              type='button'
              onClick={() => applyPreset('yesterday')}
              className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              Kemarin
            </button>
            <button
              type='button'
              onClick={() => applyPreset('7days')}
              className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              7 Hari Terakhir
            </button>
            <button
              type='button'
              onClick={() => applyPreset('30days')}
              className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              30 Hari Terakhir
            </button>
            <button
              type='button'
              onClick={() => applyPreset('thisMonth')}
              className='text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className='p-2 flex justify-center'>
          {mode === 'single' ? (
            <Calendar
              mode='single'
              selected={selectedSingle}
              onSelect={(d) => {
                setSelectedSingle(d);
                if (d) handleApplySingle(d);
              }}
              locale={id}
              className='rounded-xl border-none p-2'
            />
          ) : (
            <Calendar
              mode='range'
              selected={selectedRange}
              onSelect={setSelectedRange}
              locale={id}
              numberOfMonths={1}
              className='rounded-xl border-none p-2'
            />
          )}
        </div>

        {/* Range Footer with Apply Button */}
        {mode === 'range' && (
          <div className='p-3 border-t border-border bg-muted/10 flex items-center justify-between gap-3'>
            <div className='text-xs space-y-0.5'>
              <p className='text-[11px] text-muted-foreground'>Rentang Terpilih:</p>
              <p className='font-semibold text-foreground text-xs'>
                {selectedRange?.from ? (
                  <>
                    {format(selectedRange.from, 'd MMM yyyy', { locale: id })}
                    {selectedRange.to &&
                      !isSameDay(selectedRange.from, selectedRange.to) && (
                        <>
                          {' '}
                          –{' '}
                          {format(selectedRange.to, 'd MMM yyyy', {
                            locale: id,
                          })}{' '}
                          <span className='text-primary font-bold'>
                            ({rangeDayCount} Hari)
                          </span>
                        </>
                      )}
                  </>
                ) : (
                  <span className='text-muted-foreground italic'>
                    Klik tanggal awal & akhir
                  </span>
                )}
              </p>
            </div>

            <Button
              size='sm'
              onClick={handleApplyRange}
              disabled={!selectedRange?.from}
              className='h-8 px-3.5 text-xs font-bold gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs'
            >
              <Check className='w-3.5 h-3.5' />
              Terapkan
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

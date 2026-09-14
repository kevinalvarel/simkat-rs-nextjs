'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Download,
  Printer,
  Layers,
  Sun,
  Sunrise,
  Moon,
  RefreshCw,
  RotateCw,
} from 'lucide-react';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

interface TabulasiHeaderProps {
  mode?: 'makan' | 'snack';
  hospitalData: TabulasiHospitalData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedMeal: string;
  onMealChange: (meal: string) => void;
  onOpenGenerate?: () => void;
  onOpenExport: () => void;
  onOpenPrintModal: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function TabulasiHeader({
  mode = 'makan',
  hospitalData,
  selectedDate,
  onDateChange,
  selectedMeal,
  onMealChange,
  onOpenGenerate,
  onOpenExport,
  onOpenPrintModal,
  isRefreshing = false,
  onRefresh,
}: TabulasiHeaderProps) {
  const mealOptions = [
    { key: 'Pagi', label: 'Pagi', icon: Sunrise },
    { key: 'Siang', label: 'Siang', icon: Sun },
    { key: 'Malam', label: 'Malam', icon: Moon },
  ];
  const visibleMeals = mode === 'snack' ? mealOptions.slice(0, 2) : mealOptions;

  return (
    <div className='flex flex-col gap-4 bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs transition-all no-print'>
      {/* Top row: Title, Status Badge, & Action Buttons */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        {/* Title & Status */}
        <div className='space-y-1'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <div className='p-2 rounded-xl bg-primary/10 text-primary'>
              <Layers className='w-5 h-5' />
            </div>
            <h1 className='text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans'>
              Tabulasi Rekapitulasi Porsi {mode === 'snack' ? 'Snack' : 'Makan'}
            </h1>

            <Badge
              variant='outline'
              className={`text-[10px] font-bold px-2 py-0.5 ${
                hospitalData.statusBatch === 'OFFICIAL_LOCKED'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {hospitalData.statusBatch === 'OFFICIAL_LOCKED'
                ? 'OFFICIAL (Terkunci)'
                : 'LIVE PREVIEW (Aktif)'}
            </Badge>

            <span className='text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/60'>
              Batch: {hospitalData.batchCode}
            </span>
          </div>
          <p className='text-xs text-muted-foreground max-w-2xl leading-relaxed'>
            Rekapitulasi porsi {mode === 'snack' ? 'snack dari mapping diet' : 'makanan pasien'} per gedung
            berdasarkan siklus menu aktif dan jadwal {mode === 'snack' ? 'snack' : 'makan'} untuk{' '}
            <strong className='text-foreground'>
              {hospitalData.tanggalFormatted}
            </strong>
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2 flex-wrap shrink-0'>
          {onRefresh && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isRefreshing}
              className='gap-1.5 h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer'
              title='Segarkan Data'
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              />
              <span className='hidden sm:inline'>Refresh</span>
            </Button>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={onOpenPrintModal}
            disabled={isRefreshing}
            className='gap-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted cursor-pointer'
          >
            <Printer className='w-3.5 h-3.5 text-muted-foreground' />
            <span>Cetak / PDF</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={onOpenExport}
            disabled={isRefreshing}
            className='gap-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted cursor-pointer'
          >
            <Download className='w-3.5 h-3.5 text-muted-foreground' />
            <span>Export Excel</span>
          </Button>

          {onOpenGenerate && <Button
            size='sm'
            onClick={onOpenGenerate}
            className='gap-1.5 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer'
          >
            <Sparkles className='w-3.5 h-3.5 text-yellow-300' />
            <span>Generate Tabulasi</span>
          </Button>}
        </div>
      </div>

      {/* Filter Row: Tanggal, Siklus Otomatis, & Waktu Makan */}
      <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border/60'>
        {/* Left: Date Picker & Automatic Cycle Indicator */}
        <div className='flex flex-wrap items-center gap-2.5'>
          {/* Date Picker */}
          <div className='flex items-center gap-2 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-xl border border-border/70 transition-colors shrink-0'>
            <CalendarIcon className='w-4 h-4 text-primary shrink-0' />
            <span className='text-xs font-medium text-muted-foreground shrink-0'>
              Tanggal:
            </span>
            <input
              type='date'
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className='bg-transparent text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer'
            />
          </div>

          {/* Siklus Menu Otomatis (Mengikuti yang sudah ditetapkan berdasarkan tanggal) */}
          <div
            className='flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shrink-0 select-none'
            title={`Siklus menu ditetapkan otomatis mengikuti kalender RS: ${hospitalData.siklusNama}`}
          >
            <RotateCw className='w-3.5 h-3.5 text-primary shrink-0' />
            <span className='text-xs font-medium text-muted-foreground shrink-0'>
              Siklus Menu:
            </span>
            <span className='text-xs font-bold text-primary'>
              {hospitalData.siklusNama}
            </span>
          </div>
        </div>

        {/* Right: Meal Selector Chips */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar'>
          <span className='text-xs font-medium text-muted-foreground mr-1 hidden lg:inline'>
            {mode === 'snack' ? 'Waktu Snack:' : 'Waktu Makan:'}
          </span>
          {visibleMeals.map((opt) => {
            const Icon = opt.icon;
            const isSelected =
              selectedMeal.toLowerCase() === opt.key.toLowerCase();
            return (
              <button
                key={opt.key}
                type='button'
                onClick={() => onMealChange(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

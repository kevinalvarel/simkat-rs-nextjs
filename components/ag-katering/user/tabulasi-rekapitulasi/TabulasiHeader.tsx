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
  Cookie,
  RefreshCw,
  Clock,
  RotateCw
} from 'lucide-react';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

interface TabulasiHeaderProps {
  hospitalData: TabulasiHospitalData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedMeal: string;
  onMealChange: (meal: string) => void;
  selectedSiklus: number;
  onSiklusChange: (siklus: number) => void;
  onOpenGenerate: () => void;
  onOpenExport: () => void;
  onOpenPrintModal: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function TabulasiHeader({
  hospitalData,
  selectedDate,
  onDateChange,
  selectedMeal,
  onMealChange,
  selectedSiklus,
  onSiklusChange,
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
    { key: 'Snack', label: 'Snack', icon: Cookie },
  ];

  return (
    <div className="flex flex-col gap-4 bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs transition-all no-print">
      {/* Top row: Title, Status Badge, & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-sans">
              Tabulasi Rekapitulasi Porsi Makan
            </h1>
            
            <Badge
              variant="outline"
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

            <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/60">
              Batch: {hospitalData.batchCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Rekapitulasi porsi makanan pasien per gedung (Gedung Lama & Gedung Baru) berdasarkan siklus menu aktif dan jadwal makan untuk <strong className="text-foreground">{hospitalData.tanggalFormatted}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5 h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPrintModal}
            className="gap-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Cetak / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="gap-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenGenerate}
            className="gap-1.5 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Generate Tabulasi</span>
          </Button>
        </div>
      </div>

      {/* Filter Row: Tanggal, Waktu Makan, & Siklus Menu */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-border/60">
        
        {/* Left: Date Picker & Cycle Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-xl border border-border/70 transition-colors shrink-0">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Siklus Menu Selector */}
          <div className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-xl border border-border/70 transition-colors shrink-0">
            <RotateCw className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground shrink-0">Siklus Menu:</span>
            <select
              value={selectedSiklus}
              onChange={(e) => onSiklusChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer pr-1"
            >
              {hospitalData.availableSiklus.map((s) => (
                <option key={s.nomor_siklus} value={s.nomor_siklus} className="bg-popover text-foreground">
                  {s.nama_siklus}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Meal Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <span className="text-xs font-medium text-muted-foreground mr-1 hidden lg:inline">
            Waktu Makan:
          </span>
          {mealOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedMeal.toLowerCase() === opt.key.toLowerCase();
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onMealChange(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {opt.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

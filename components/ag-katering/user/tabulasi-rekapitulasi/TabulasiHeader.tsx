'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Download, 
  Layers, 
  Sun, 
  Sunrise, 
  Moon, 
  Cookie,
  RefreshCw
} from 'lucide-react';

interface TabulasiHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedMeal: string;
  onMealChange: (meal: string) => void;
  onOpenGenerate: () => void;
  onOpenExport: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function TabulasiHeader({
  selectedDate,
  onDateChange,
  selectedMeal,
  onMealChange,
  onOpenGenerate,
  onOpenExport,
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title & Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              Tabulasi
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Instalasi Gizi RS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Kelola dan pantau kebutuhan makanan pasien berdasarkan jadwal makan, diet, dan distribusi ruangan.
          </p>
        </div>

        {/* Action Buttons: Generate & Export */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-1.5 h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="gap-2 h-9 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Export
          </Button>

          <Button
            size="sm"
            onClick={onOpenGenerate}
            className="gap-2 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Generate Tabulasi
          </Button>
        </div>
      </div>

      {/* Date Picker & Meal Cycle Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
        
        {/* Date Input with Icon */}
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

        {/* Meal Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-xs font-medium text-muted-foreground mr-1 hidden md:inline">
            Waktu Makan:
          </span>
          {mealOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedMeal === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onMealChange(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
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

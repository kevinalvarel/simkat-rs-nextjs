'use client';

import React from 'react';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  Building2, 
  Layers, 
  UtensilsCrossed, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import type { TabulasiFilterState } from '@/types/tabulasitypes';

interface TabulasiFiltersProps {
  filters: TabulasiFilterState;
  onFilterChange: (newFilters: Partial<TabulasiFilterState>) => void;
  onResetFilters: () => void;
}

export default function TabulasiFilters({
  filters,
  onFilterChange,
  onResetFilters,
}: TabulasiFiltersProps) {
  const hasActiveFilter = 
    filters.gedung !== 'Semua' || 
    filters.lantai !== 'Semua' || 
    filters.diet !== 'Semua' || 
    filters.status !== 'Semua' || 
    filters.search !== '';

  const gedungOptions = ['Semua', 'Gedung Lama', 'Gedung Baru'];
  const lantaiOptions = ['Semua', 'Lantai I', 'Lantai II', 'Lantai III', 'Lantai II-III'];
  const dietOptions = ['Semua', 'B', 'DIIT', 'DM', 'RG', 'RS', 'RL', 'DJ', 'RP'];
  const statusOptions = ['Semua', 'Ready', 'Pending', 'Perlu Diperiksa'];

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 no-print">
      
      {/* Header of Filters */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Filter Operasional
          </span>
          {hasActiveFilter && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Filter Aktif
            </span>
          )}
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filter
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari menu / diet..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full h-8 pl-8 pr-2.5 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Gedung */}
        <div className="relative">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.gedung}
            onChange={(e) => onFilterChange({ gedung: e.target.value })}
            className="w-full h-8 pl-8 pr-6 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
          >
            <option value="Semua">Semua Gedung</option>
            <option value="Gedung Lama">Gedung Lama</option>
            <option value="Gedung Baru">Gedung Baru</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
        </div>

        {/* Lantai */}
        <div className="relative">
          <Layers className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.lantai}
            onChange={(e) => onFilterChange({ lantai: e.target.value })}
            className="w-full h-8 pl-8 pr-6 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
          >
            {lantaiOptions.map((lt) => (
              <option key={lt} value={lt}>
                {lt === 'Semua' ? 'Semua Lantai' : lt}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
        </div>

        {/* Diet */}
        <div className="relative">
          <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.diet}
            onChange={(e) => onFilterChange({ diet: e.target.value })}
            className="w-full h-8 pl-8 pr-6 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
          >
            {dietOptions.map((d) => (
              <option key={d} value={d}>
                {d === 'Semua' ? 'Semua Diet' : `Diet ${d}`}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
        </div>

        {/* Status Produksi */}
        <div className="relative">
          <CheckCircle className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full h-8 pl-8 pr-6 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st === 'Semua' ? 'Semua Status' : st}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
        </div>

        {/* Waktu Makan Filter */}
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.mealTime}
            onChange={(e) => onFilterChange({ mealTime: e.target.value })}
            className="w-full h-8 pl-8 pr-6 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
          >
            <option value="Semua">Semua Waktu</option>
            <option value="Pagi">Pagi</option>
            <option value="Siang">Siang</option>
            <option value="Malam">Malam</option>
            <option value="Snack">Snack</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-[10px]">▼</div>
        </div>

      </div>
    </div>
  );
}

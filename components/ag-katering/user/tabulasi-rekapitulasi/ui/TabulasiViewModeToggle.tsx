'use client';

import React from 'react';
import { Columns, Building2, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode =
  | 'SIDE_BY_SIDE'
  | 'GEDUNG_LAMA'
  | 'GEDUNG_BARU'
  | 'COMBINED_FULL';

interface TabulasiViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TabulasiViewModeToggle({
  viewMode,
  onViewModeChange,
}: TabulasiViewModeToggleProps) {
  const options: Array<{ id: ViewMode; label: string; icon: React.ElementType }> = [
    { id: 'SIDE_BY_SIDE', label: 'Side by Side', icon: Columns },
    { id: 'GEDUNG_LAMA', label: 'Gedung Lama', icon: Building2 },
    { id: 'GEDUNG_BARU', label: 'Gedung Baru', icon: Building2 },
    { id: 'COMBINED_FULL', label: 'Semua', icon: List },
  ];

  return (
    <div className='flex items-center gap-1 bg-background/80 dark:bg-muted/40 p-1 rounded-xl border border-border/80 shadow-2xs text-xs self-start sm:self-auto'>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = viewMode === opt.id;
        return (
          <button
            key={opt.id}
            type='button'
            onClick={() => onViewModeChange(opt.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-xs cursor-pointer select-none',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
          >
            <Icon className='w-3.5 h-3.5' />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

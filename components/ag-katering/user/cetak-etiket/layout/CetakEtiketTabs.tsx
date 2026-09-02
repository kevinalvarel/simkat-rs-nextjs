'use client';

import React from 'react';
import { Layers, History } from 'lucide-react';
import type { CetakEtiketTab } from '@/types/cetaketikettypes';

interface CetakEtiketTabsProps {
  activeTab: CetakEtiketTab;
  totalPasien: number;
  revisiCount: number;
  onTabChange: (tab: CetakEtiketTab) => void;
}

export default function CetakEtiketTabs({
  activeTab,
  totalPasien,
  revisiCount,
  onTabChange,
}: CetakEtiketTabsProps) {
  return (
    <div className='flex items-center gap-6 border-b border-border/80 px-1'>
      {/* Tab Utama Button */}
      <button
        type='button'
        onClick={() => onTabChange('UTAMA')}
        className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer relative ${
          activeTab === 'UTAMA'
            ? 'text-emerald-700'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Layers className='w-4 h-4' />
        <span>Tab Utama (Snapshot Saat Ini)</span>
        <span className='px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800'>
          {totalPasien}
        </span>
        {activeTab === 'UTAMA' && (
          <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full' />
        )}
      </button>

      {/* Tab Revisi Button */}
      <button
        type='button'
        onClick={() => onTabChange('REVISI')}
        className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer relative ${
          activeTab === 'REVISI'
            ? 'text-amber-700'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <History className='w-4 h-4' />
        <span>Tab Revisi (Perubahan Susulan)</span>
        <span className='px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-800'>
          {revisiCount}
        </span>
        {activeTab === 'REVISI' && (
          <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full' />
        )}
      </button>
    </div>
  );
}

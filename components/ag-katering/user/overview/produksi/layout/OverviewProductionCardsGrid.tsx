'use client';

import React, { useState, useMemo } from 'react';
import type { MonitoringCardData } from '@/types/monitoringtypes';
import OverviewDietCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewDietCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Utensils } from 'lucide-react';

interface OverviewProductionCardsGridProps {
  cards: MonitoringCardData[];
  cutoffTime: string;
}

type FilterTab =
  | 'ALL'
  | 'POKOK'
  | 'HEWANI'
  | 'NABATI'
  | 'SAYUR'
  | 'EXTRA_BUAH';

export default function OverviewProductionCardsGrid({
  cards,
  cutoffTime,
}: OverviewProductionCardsGridProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out any card with code 'TIDAK' or 'NON' or 'NPO'
  const validCards = useMemo(() => {
    return cards.filter(
      (card) =>
        card.code &&
        card.code.toUpperCase() !== 'TIDAK' &&
        card.code.toUpperCase() !== 'NON' &&
        card.code.toUpperCase() !== 'NPO' &&
        (card.category || '').toUpperCase() !== 'NPO',
    );
  }, [cards]);

  // Tab and search filtering
  const filteredCards = useMemo(() => {
    return validCards.filter((card) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = card.name.toLowerCase().includes(q);
        const matchCode = card.code.toLowerCase().includes(q);
        const matchCat = (card.category || '').toLowerCase().includes(q);
        const matchTag = (card.dietTag || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCat && !matchTag) return false;
      }

      // 2. Category Tab Filter
      if (activeTab === 'ALL') return true;
      const cat = (card.category || '').toUpperCase();
      if (activeTab === 'POKOK') return cat === 'POKOK' || cat === 'SARING';
      if (activeTab === 'HEWANI') return cat.includes('HEWANI');
      if (activeTab === 'NABATI') return cat.includes('NABATI');
      if (activeTab === 'SAYUR') return cat.includes('SAYUR');
      if (activeTab === 'EXTRA_BUAH')
        return cat === 'EXTRA' || cat === 'BUAH' || cat === 'SNACK';

      return true;
    });
  }, [validCards, activeTab, searchQuery]);

  // Total portions in current view
  const currentTotalPortions = useMemo(() => {
    return filteredCards.reduce((acc, c) => acc + (c.active || 0), 0);
  }, [filteredCards]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'Semua Hidangan', count: validCards.length },
    {
      id: 'POKOK',
      label: 'Makanan Pokok',
      count: validCards.filter(
        (c) =>
          c.category?.toUpperCase() === 'POKOK' ||
          c.category?.toUpperCase() === 'SARING',
      ).length,
    },
    {
      id: 'HEWANI',
      label: 'Lauk Hewani',
      count: validCards.filter((c) =>
        (c.category?.toUpperCase() || '').includes('HEWANI'),
      ).length,
    },
    {
      id: 'NABATI',
      label: 'Lauk Nabati',
      count: validCards.filter((c) =>
        (c.category?.toUpperCase() || '').includes('NABATI'),
      ).length,
    },
    {
      id: 'SAYUR',
      label: 'Sayuran',
      count: validCards.filter((c) =>
        (c.category?.toUpperCase() || '').includes('SAYUR'),
      ).length,
    },
    {
      id: 'EXTRA_BUAH',
      label: 'Extra, Buah & Snack',
      count: validCards.filter((c) => {
        const cat = c.category?.toUpperCase();
        return cat === 'EXTRA' || cat === 'BUAH' || cat === 'SNACK';
      }).length,
    },
  ];

  return (
    <div className='lg:col-span-3 flex flex-col justify-between space-y-4'>
      {/* ─── Search & Category Filtering Bar ─── */}
      <div className='bg-card border rounded-2xl p-3.5 shadow-2xs space-y-3'>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3'>
          {/* Search Box */}
          <div className='relative flex-1 max-w-sm'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='text'
              placeholder='Cari hidangan / menu...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20'
            />
          </div>

          {/* Portion Summary Pill */}
          <div className='flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground font-medium'>
            <span>Total Porsi Terfilter:</span>
            <Badge
              variant='secondary'
              className='text-xs font-bold font-mono px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            >
              {currentTotalPortions} Porsi
            </Badge>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar'>
          {tabs.map((tab) => {
            if (tab.count === 0 && tab.id !== 'ALL') return null;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/60 hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background text-muted-foreground border'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Dynamic Grid for Food Dishes ─── */}
      {filteredCards.length > 0 ? (
        <div className='grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 w-full'>
          {filteredCards.map((card, idx) => (
            <OverviewDietCard
              key={`${card.code}-${card.name}-${idx}`}
              card={card}
            />
          ))}
        </div>
      ) : (
        <div className='bg-card border rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-2 text-muted-foreground'>
          <Utensils className='w-8 h-8 stroke-1 text-muted-foreground/60' />
          <p className='text-xs font-semibold text-foreground'>
            Tidak ada hidangan yang sesuai dengan filter
          </p>
          <p className='text-[11px] text-muted-foreground max-w-xs'>
            Coba ubah kata kunci pencarian atau pilih kategori hidangan lainnya.
          </p>
        </div>
      )}

      {/* Target Cutoff Footer */}
      <div className='text-xs text-muted-foreground text-center lg:text-left font-medium pt-2 border-t border-dashed border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2'>
        <span>
          * Angka di atas merupakan akumulasi porsi hidangan dari{' '}
          <strong>Siklus Menu</strong> aktif yang disesuaikan dengan diet &
          kelas pasien.
        </span>
        <span className='shrink-0'>
          Target Kunci Batch:{' '}
          <strong className='text-primary font-bold'>{cutoffTime} WIB</strong>
        </span>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import type { MonitoringCardData } from '@/types/monitoringtypes';
import OverviewDietCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewDietCard';
import { Utensils } from 'lucide-react';

interface OverviewProductionCardsGridProps {
  cards: MonitoringCardData[];
}

const CATEGORY_ORDER: Record<string, number> = {
  POKOK: 1,
  HEWANI: 2,
  'HEWANI & NABATI': 2.5,
  NABATI: 3,
  'NABATI & SAYUR': 3.5,
  SAYUR: 4,
  'HEWANI & SAYUR': 4.5,
  SARING: 5,
  BUAH: 6,
  SNACK: 7,
};

export default function OverviewProductionCardsGrid({
  cards,
}: OverviewProductionCardsGridProps) {
  // Buang kartu non-produksi + kategori EXTRA (dihapus dari layar produksi)
  const visibleCards = useMemo(() => {
    const filtered = cards.filter((card) => {
      if (!card.code) return false;
      const code = card.code.toUpperCase();
      if (code === 'TIDAK' || code === 'NON' || code === 'NPO') return false;
      const cat = (card.category || '').toUpperCase();
      if (cat === 'NPO' || cat === 'EXTRA') return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const orderA =
        CATEGORY_ORDER[(a.category || '').toUpperCase()] ?? 99;
      const orderB =
        CATEGORY_ORDER[(b.category || '').toUpperCase()] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [cards]);

  if (visibleCards.length === 0) {
    return (
      <div className='bg-card border rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-2 text-muted-foreground'>
        <Utensils className='w-8 h-8 stroke-1 text-muted-foreground/60' />
        <p className='text-sm font-semibold text-foreground'>
          Belum ada hidangan produksi
        </p>
        <p className='text-xs text-muted-foreground max-w-xs'>
          Data hidangan akan muncul otomatis mengikuti siklus menu & diet pasien.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full'>
      {visibleCards.map((card, idx) => (
        <OverviewDietCard
          key={`${card.code}-${card.name}-${idx}`}
          card={card}
        />
      ))}
    </div>
  );
}

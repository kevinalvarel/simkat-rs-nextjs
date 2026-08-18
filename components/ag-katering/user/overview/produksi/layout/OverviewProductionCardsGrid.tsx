import React from 'react';
import type { MonitoringCardData } from '@/types/monitoringtypes';
import OverviewDietCard from '@/components/ag-katering/user/overview/produksi/ui/OverviewDietCard';

interface OverviewProductionCardsGridProps {
  cards: MonitoringCardData[];
  cutoffTime: string;
}

export default function OverviewProductionCardsGrid({
  cards,
  cutoffTime,
}: OverviewProductionCardsGridProps) {
  // Filter out any card with code 'TIDAK' or 'NON'
  const filteredCards = cards.filter(
    (card) =>
      card.code &&
      card.code.toUpperCase() !== 'TIDAK' &&
      card.code.toUpperCase() !== 'NON',
  );

  return (
    <div className='lg:col-span-3 flex flex-col justify-between space-y-3'>
      {/* Dynamic Grid for Cards */}
      <div className='grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3 w-full'>
        {filteredCards.map((card) => (
          <OverviewDietCard key={card.code} card={card} />
        ))}
      </div>

      <div className='text-xs text-muted-foreground text-center lg:text-left font-medium pt-2 border-t border-dashed border-border/80'>
        * Angka di atas merupakan akumulasi porsi per komponen menu hasil
        mapping diet. Target Kunci Batch:{' '}
        <strong className='text-primary font-bold'>{cutoffTime} WIB</strong>
      </div>
    </div>
  );
}

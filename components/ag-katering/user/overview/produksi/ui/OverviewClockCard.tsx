import React from 'react';
import { WIB_TIMEZONE } from '@/lib/wib';

interface OverviewClockCardProps {
  currentTime: string;
}

export default function OverviewClockCard({
  currentTime,
}: OverviewClockCardProps) {
  return (
    <div className='space-y-1 bg-background/60 border rounded-xl p-2.5 shadow-2xs'>
      <span className='text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold'>
        Jam Saat Ini
      </span>
      <div className='font-mono text-base sm:text-lg font-extrabold text-foreground'>
        {currentTime || '00:00:00'} WIB
      </div>
      <div className='text-[10px] text-muted-foreground font-medium'>
        {new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: WIB_TIMEZONE,
        })}
      </div>
    </div>
  );
}

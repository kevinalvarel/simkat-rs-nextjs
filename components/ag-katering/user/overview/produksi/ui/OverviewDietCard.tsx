import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { MonitoringCardData } from '@/types/monitoringtypes';

interface OverviewDietCardProps {
  card: MonitoringCardData;
}

export default function OverviewDietCard({ card }: OverviewDietCardProps) {
  // Do not render cards with code 'TIDAK' or 'NON'
  if (
    !card.code ||
    card.code.toUpperCase() === 'TIDAK' ||
    card.code.toUpperCase() === 'NON'
  ) {
    return null;
  }

  const change = card.change;

  const styles = (() => {
    if (change > 0) {
      return {
        bg: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        bgAccent: 'bg-emerald-100 dark:bg-emerald-950/80',
        icon: ArrowUpRight,
        label: `▲ ${change}`,
        delta: `(+${change})`,
      };
    }
    if (change < 0) {
      return {
        bg: 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        bgAccent: 'bg-rose-100 dark:bg-rose-950/80',
        icon: ArrowDownRight,
        label: `▼ ${Math.abs(change)}`,
        delta: `(${change})`,
      };
    }
    return {
      bg: 'bg-card border-border',
      text: 'text-muted-foreground',
      bgAccent: 'bg-secondary',
      icon: Minus,
      label: '—',
      delta: '(0)',
    };
  })();

  const DeltaIcon = styles.icon;

  return (
    <Card
      className={`transition-all duration-300 border hover:shadow-md ${styles.bg} ${
        change !== 0 ? 'ring-1 ring-primary/10' : ''
      }`}
    >
      <div className='border-b border-border/60 py-2 px-2.5 text-center bg-muted/40'>
        <span
          className='font-bold text-xs text-foreground tracking-wide block uppercase truncate'
          title={card.name}
        >
          {card.code}
        </span>
        {card.name && card.name !== card.code && (
          <span
            className='text-[10px] text-muted-foreground truncate block leading-tight'
            title={card.name}
          >
            {card.name}
          </span>
        )}
      </div>
      <CardContent className='p-4 flex flex-col items-center justify-center text-center space-y-2'>
        {/* Active Count */}
        <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans'>
          {card.active}
        </h2>

        {/* Indicator Arrow & value */}
        {change !== 0 ? (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold ${styles.text}`}
          >
            <DeltaIcon className='w-3.5 h-3.5 shrink-0' />
            <span>{Math.abs(change)}</span>
          </div>
        ) : (
          <div className='text-xs text-muted-foreground font-medium'>—</div>
        )}

        {/* Delta text underneath like (0), (+1), (-1) */}
        <div className='text-[10px] font-bold text-muted-foreground font-mono'>
          {styles.delta}
        </div>
      </CardContent>
    </Card>
  );
}

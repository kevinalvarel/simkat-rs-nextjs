'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const DIET_BADGE_COLORS: Record<string, string> = {
  B: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'DM, RG': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'RG, DM': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'B, D, DM,RG': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'B, D, DM, RG': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'DJ, RL, Rkol': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'B, Diit, DM': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  RG: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  RS: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  RP: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  TKTP: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/40 font-bold',
};

interface TabulasiDietBadgeProps {
  code: string;
  isTktp?: boolean;
}

export default function TabulasiDietBadge({ code, isTktp }: TabulasiDietBadgeProps) {
  const colorClass = isTktp
    ? DIET_BADGE_COLORS.TKTP
    : DIET_BADGE_COLORS[code] ||
      'bg-muted text-muted-foreground border-border/60';

  return (
    <Badge
      variant='outline'
      className={cn(
        'text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap',
        colorClass,
      )}
    >
      {code}
    </Badge>
  );
}

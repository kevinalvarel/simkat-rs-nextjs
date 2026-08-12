'use client';

import React from 'react';
import type { MappingDietStats } from '@/servers/mapping-diet.service';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, GitBranch, Users } from 'lucide-react';

interface MappingDietStatsProps {
  stats: MappingDietStats;
}

export default function MappingDietStats({ stats }: MappingDietStatsProps) {
  const cards = [
    {
      label: 'Belum Di-mapping',
      value: stats.unmappedCount,
      sub: 'Diet RS belum pernah dipetakan',
      color: 'rose',
      icon: AlertCircle,
      accent: 'border-l-rose-500',
      bg: 'bg-rose-500/5 dark:bg-rose-950/20',
      iconBg: 'bg-rose-100 dark:bg-rose-950 border-rose-200',
      iconColor: 'text-rose-600 dark:text-rose-400',
      labelColor: 'text-rose-700 dark:text-rose-300',
      valueColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Partial Mapping',
      value: stats.partialCount,
      sub: 'Sudah sebagian, perlu dilengkapi',
      color: 'amber',
      icon: GitBranch,
      accent: 'border-l-amber-500',
      bg: 'bg-amber-500/5 dark:bg-amber-950/20',
      iconBg: 'bg-amber-100 dark:bg-amber-950 border-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      labelColor: 'text-amber-700 dark:text-amber-300',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Pasien Terdampak',
      value: stats.totalPatientAffected,
      sub: 'Pasien aktif dengan diet belum termapping',
      color: 'blue',
      icon: Users,
      accent: 'border-l-blue-500',
      bg: '',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-muted-foreground',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className='grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0'>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`border-l-4 ${card.accent} shadow-xs transition-all hover:shadow-md min-w-0 w-full ${card.bg}`}
          >
            <CardContent className='p-3.5 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
              <div className='min-w-0 flex-1'>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider truncate ${card.labelColor}`}
                >
                  {card.label}
                </p>
                <h3
                  className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 truncate ${card.valueColor}`}
                >
                  {card.value}
                </h3>
                <p className='text-[11px] text-muted-foreground mt-0.5 truncate'>
                  {card.sub}
                </p>
              </div>
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 border`}
              >
                <Icon className='w-4 h-4 sm:w-5 sm:h-5' />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

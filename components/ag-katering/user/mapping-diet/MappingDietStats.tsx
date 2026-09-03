'use client';

import React from 'react';
import type { MappingDietStats } from '@/servers/mapping-diet.service';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, GitBranch, Users, CheckCircle2 } from 'lucide-react';

interface MappingDietStatsProps {
  stats: MappingDietStats;
}

export default function MappingDietStats({ stats }: MappingDietStatsProps) {
  const cards = [
    {
      label: 'Belum Di-mapping',
      value: stats.unmappedCount,
      sub: 'Diet RS belum dipetakan',
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
      sub: 'Perlu dilengkapi',
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
      label: 'Sudah Termapping',
      value: stats.mappedCount,
      sub: 'Kamus Master Mapping aktif',
      color: 'emerald',
      icon: CheckCircle2,
      accent: 'border-l-emerald-500',
      bg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      labelColor: 'text-emerald-700 dark:text-emerald-300',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pasien Terdampak',
      value: stats.totalPatientAffected,
      sub: 'Pasien aktif belum termapping',
      color: 'blue',
      icon: Users,
      accent: 'border-l-blue-500',
      bg: 'bg-blue-500/5 dark:bg-blue-950/20',
      iconBg: 'bg-blue-100 dark:bg-blue-950 border-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-blue-700 dark:text-blue-300',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0'>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`border-l-4 ${card.accent} shadow-xs transition-all hover:shadow-md min-w-0 w-full ${card.bg}`}
          >
            <CardContent className='p-3 sm:p-4 flex items-center justify-between gap-2 min-w-0'>
              <div className='min-w-0 flex-1'>
                <p
                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${card.labelColor}`}
                >
                  {card.label}
                </p>
                <h3
                  className={`text-lg sm:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1 truncate ${card.valueColor}`}
                >
                  {card.value}
                </h3>
                <p className='text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate'>
                  {card.sub}
                </p>
              </div>
              <div
                className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 border`}
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

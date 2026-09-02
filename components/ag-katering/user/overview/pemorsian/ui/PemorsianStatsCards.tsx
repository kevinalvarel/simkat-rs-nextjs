'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PemorsianStatsCardsProps {
  sudahDicetakCount: number;
  belumDicetakCount: number;
  butuhRevisiCount: number;
  activeStatusFilter: string;
  onFilterStatusClick: (
    status: 'ALL' | 'BELUM_DICETAK' | 'SUDAH_DICETAK' | 'BUTUH_REVISI',
  ) => void;
}

export default function PemorsianStatsCards({
  sudahDicetakCount = 0,
  belumDicetakCount = 0,
  butuhRevisiCount = 0,
  activeStatusFilter = 'ALL',
  onFilterStatusClick,
}: PemorsianStatsCardsProps) {
  const cards = [
    {
      id: 'SUDAH_DICETAK' as const,
      title: 'Sudah Dicetak',
      count: sudahDicetakCount,
      description: 'Jumlah pasien yang etiketnya sudah dicetak',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/15',
      activeBorder:
        'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30',
      hoverBorder: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
    },
    {
      id: 'BELUM_DICETAK' as const,
      title: 'Belum Tercetak',
      count: belumDicetakCount,
      description: 'Jumlah pasien yang etiketnya belum dicetak',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/15',
      activeBorder:
        'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30',
      hoverBorder: 'hover:border-amber-500/40 hover:bg-amber-500/5',
    },
    {
      id: 'BUTUH_REVISI' as const,
      title: 'Perlu Direvisi',
      count: butuhRevisiCount,
      description: 'Jumlah pasien dengan perubahan data pasca snapshot',
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bgIcon: 'bg-rose-500/15',
      activeBorder:
        'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30',
      hoverBorder: 'hover:border-rose-500/40 hover:bg-rose-500/5',
      isPulse: butuhRevisiCount > 0,
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full'>
      {cards.map((item) => {
        const Icon = item.icon;
        const isActive = activeStatusFilter === item.id;

        return (
          <Card
            key={item.id}
            role='button'
            tabIndex={0}
            onClick={() =>
              onFilterStatusClick(isActive ? 'ALL' : item.id)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onFilterStatusClick(isActive ? 'ALL' : item.id);
              }
            }}
            className={`cursor-pointer transition-all duration-200 border rounded-2xl shadow-2xs select-none p-4 sm:p-5 ${
              isActive
                ? item.activeBorder
                : `bg-card border-border/80 ${item.hoverBorder}`
            }`}
          >
            <CardContent className='p-0 flex items-center justify-between gap-4'>
              <div className='space-y-1 min-w-0'>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {item.title}
                </p>
                <div className='flex items-baseline gap-2'>
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${item.color}`}
                  >
                    {item.count}
                  </span>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Pasien
                  </span>
                </div>
                <p className='text-[11px] text-muted-foreground truncate'>
                  {item.description}
                </p>
              </div>

              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.bgIcon} ${item.color} ${
                  item.isPulse ? 'animate-pulse' : ''
                }`}
              >
                <Icon className='w-5 h-5' />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

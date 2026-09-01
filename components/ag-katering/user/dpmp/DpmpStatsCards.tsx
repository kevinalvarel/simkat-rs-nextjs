'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Utensils,
  Ban,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import type { DpmpSummaryData } from '@/types/dpmptypes';

interface DpmpStatsCardsProps {
  data: DpmpSummaryData;
  selectedCount: number;
}

export default function DpmpStatsCards({
  data,
  selectedCount,
}: DpmpStatsCardsProps) {
  const cards = [
    {
      title: 'Total Pasien',
      value: data.totalCount,
      unit: 'Orang',
      description: `Batch ${data.waktuMakanFormatted}`,
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/10 dark:bg-blue-950/40',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Pasien Makan Aktif',
      value: data.activeCount,
      unit: 'Porsi',
      description: 'Mendapatkan porsi makanan',
      icon: Utensils,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-500/20',
      highlight: true,
    },
    {
      title: 'Pasien Puasa (NPO)',
      value: data.npoCount,
      unit: 'Orang',
      description: 'Tidak disajikan makanan',
      icon: Ban,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Pasien Cito / Revisi',
      value: data.emergentCount,
      unit: 'Orang',
      description: 'Perubahan post-snapshot',
      icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgIcon: 'bg-rose-500/10 dark:bg-rose-950/40',
      borderColor: 'border-rose-500/20',
    },
    {
      title: 'Pasien Terpilih',
      value: selectedCount,
      unit: 'Orang',
      description: selectedCount > 0 ? 'Siap cetak lembar DPMP' : 'Pilih dari tabel di bawah',
      icon: CheckSquare,
      iconColor: 'text-primary',
      bgIcon: 'bg-primary/10',
      borderColor: 'border-primary/30',
      highlight: selectedCount > 0,
    },
  ];

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={`border rounded-2xl shadow-2xs transition-all hover:shadow-xs ${
              card.borderColor
            } ${card.highlight ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-card'}`}
          >
            <CardContent className='p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-muted-foreground truncate'>
                  {card.title}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgIcon} ${card.iconColor}`}
                >
                  <Icon className='w-4 h-4' />
                </div>
              </div>

              <div className='flex items-baseline gap-1.5'>
                <h3 className='text-2xl font-extrabold tracking-tight text-foreground font-sans'>
                  {card.value.toLocaleString('id-ID')}
                </h3>
                <span className='text-xs text-muted-foreground font-medium'>
                  {card.unit}
                </span>
              </div>

              <p className='text-[10px] text-muted-foreground truncate'>
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, CheckCircle2, AlertTriangle, Home } from 'lucide-react';

interface TabulasiStatsProps {
  total: number;
  mapped: number;
  unmapped: number;
  totalRooms: number;
}

export default function TabulasiStats({ total, mapped, unmapped, totalRooms }: TabulasiStatsProps) {
  const mappingRate = total > 0 ? Math.round((mapped / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Porsi Makanan',
      value: `${total} porsi`,
      sub: 'Total piring/etiket diproduksi',
      icon: Utensils,
      bg: 'bg-primary/5 dark:bg-primary/10 border-l-primary',
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      label: 'Selesai Ter-mapping',
      value: `${mapped} porsi`,
      sub: `${mappingRate}% porsi memiliki standar diet`,
      icon: CheckCircle2,
      bg: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-l-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Belum Ter-mapping',
      value: `${unmapped} porsi`,
      sub: 'Perlu verifikasi master mapping diet',
      icon: AlertTriangle,
      bg: unmapped > 0 
        ? 'bg-rose-500/5 dark:bg-rose-950/20 border-l-rose-500 border-rose-300 dark:border-rose-900' 
        : 'bg-muted/30 border-l-muted-foreground/30',
      iconBg: unmapped > 0 
        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
        : 'bg-muted text-muted-foreground',
    },
    {
      label: 'Distribusi Ruangan',
      value: `${totalRooms} ruangan`,
      sub: 'Tujuan pengantaran makanan aktif',
      icon: Home,
      bg: 'bg-blue-500/5 dark:bg-blue-950/20 border-l-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className={`border-l-4 ${card.bg} shadow-xs transition-all hover:shadow-md min-w-0 w-full`}>
            <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  {card.label}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1 truncate">
                  {card.value}
                </h3>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                  {card.sub}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 border border-transparent`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

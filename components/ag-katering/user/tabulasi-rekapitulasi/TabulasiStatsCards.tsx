'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Utensils, 
  Building2, 
  Users, 
  Sparkles, 
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';

interface TabulasiStatsCardsProps {
  hospitalData: TabulasiHospitalData;
}

export default function TabulasiStatsCards({ hospitalData }: TabulasiStatsCardsProps) {
  const cards = [
    {
      title: 'Total Porsi Makan',
      value: hospitalData.grandTotalPorsi,
      unit: 'porsi',
      subtext: `Siklus ${hospitalData.waktuMakan} (${hospitalData.siklusNama})`,
      icon: Utensils,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      title: 'Porsi Gedung Lama',
      value: hospitalData.totalGedungLama,
      unit: 'porsi',
      subtext: 'Lantai I, II, & III Gedung Lama',
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Porsi Gedung Baru',
      value: hospitalData.totalGedungBaru,
      unit: 'porsi',
      subtext: 'Lantai I, II-III Gedung Baru',
      icon: Building2,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
    },
    {
      title: 'Pasien Terlayani',
      value: hospitalData.totalPasienMakan,
      unit: 'orang',
      subtext: `${hospitalData.totalPasienNpo} pasien Puasa / NPO`,
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Diet Khusus & TKTP',
      value: hospitalData.totalDietKhusus,
      unit: 'orang',
      subtext: 'DM, RG, DJ, RP, RS, RL, TKTP',
      icon: HeartHandshake,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 no-print">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card
            key={i}
            className={`border ${c.border} bg-card rounded-2xl shadow-2xs transition-all hover:shadow-xs`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
                  {c.title}
                </span>
                <div className={`p-1.5 rounded-xl ${c.bg} ${c.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground tracking-tight">
                    {c.value.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {c.unit}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {c.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

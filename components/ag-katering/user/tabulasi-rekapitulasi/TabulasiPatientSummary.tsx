'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Utensils, HeartPulse, UserMinus, Soup } from 'lucide-react';
import type { TabulasiPatientSummary as SummaryType } from '@/types/tabulasitypes';

interface TabulasiPatientSummaryProps {
  summary: SummaryType;
}

export default function TabulasiPatientSummary({ summary }: TabulasiPatientSummaryProps) {
  const cards = [
    {
      title: 'Total Pasien',
      value: summary.totalPatients,
      unit: 'pasien',
      description: 'Total pasien terdata di instalasi',
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-l-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      title: 'Pasien Makan',
      value: summary.patientsEating,
      unit: 'pasien',
      description: 'Mendapat makanan aktif',
      icon: Utensils,
      color: 'text-primary dark:text-primary',
      bg: 'bg-primary/5 dark:bg-primary/10 border-l-primary',
      iconBg: 'bg-primary/15 text-primary',
    },
    {
      title: 'Pasien Diet Khusus',
      value: summary.specialDiet,
      unit: 'pasien',
      description: 'Diet terapeutik & modifikasi',
      icon: HeartPulse,
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-l-amber-600',
      iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    },
    {
      title: 'Pasien Lainnya',
      value: summary.othersNpo,
      unit: 'pasien',
      description: 'Puasa / NPO / Lainnya',
      icon: UserMinus,
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/50 border-l-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    },
    {
      title: 'Total Porsi',
      value: summary.totalPortions,
      unit: 'porsi',
      description: 'Total snack / porsi diproduksi',
      icon: Soup,
      color: 'text-teal-700 dark:text-teal-300',
      bg: 'bg-teal-50 dark:bg-teal-950/50 border-l-teal-600',
      iconBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Ringkasan Pasien
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Update real-time snapshot
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className={`border-l-4 ${card.bg} shadow-2xs hover:shadow-xs transition-all duration-200`}
            >
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-tight line-clamp-1">
                    {card.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${card.iconBg} shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                      {card.value}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {card.unit}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

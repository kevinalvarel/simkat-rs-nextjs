'use client';

import React from 'react';
import {
  Utensils,
  Building2,
  Users,
  HeartHandshake,
} from 'lucide-react';
import type { TabulasiHospitalData } from '@/types/tabulasitypes';
import TabulasiStatCard from '../ui/TabulasiStatCard';

interface TabulasiStatsCardsProps {
  hospitalData: TabulasiHospitalData;
  mode?: 'makan' | 'snack' | 'buah';
}

export default function TabulasiStatsCards({
  hospitalData,
  mode = 'makan',
}: TabulasiStatsCardsProps) {
  const cards = [
    {
      title: mode === 'snack' ? 'Total Porsi Snack' : mode === 'buah' ? 'Total Porsi Buah' : 'Total Porsi Makan',
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
    <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 no-print'>
      {cards.map((c) => (
        <TabulasiStatCard
          key={c.title}
          title={c.title}
          value={c.value}
          unit={c.unit}
          subtext={c.subtext}
          icon={c.icon}
          color={c.color}
          bg={c.bg}
          border={c.border}
        />
      ))}
    </div>
  );
}

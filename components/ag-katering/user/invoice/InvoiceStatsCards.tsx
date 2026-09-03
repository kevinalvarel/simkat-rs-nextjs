'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  UtensilsCrossed,
  Sunrise,
  Sun,
  Moon,
  Camera,
  UserPlus,
  Cookie,
  Layers,
} from 'lucide-react';
import type { InvoiceDailySummary } from '@/types/invoicetypes';

interface InvoiceStatsCardsProps {
  data: InvoiceDailySummary;
}

export default function InvoiceStatsCards({ data }: InvoiceStatsCardsProps) {
  const isRange = Boolean(data.isRange);
  const isPerSnapshot = Boolean(data.isPerSnapshot);

  // Cards layout for Per-Snapshot Mode
  const snapshotCards = [
    {
      title: `Total Porsi Tagihan (${data.waktuMakan || 'Snapshot'})`,
      value: data.grandTotalPorsi,
      unit: 'Porsi',
      description: 'Akumulasi Baseline + Revisi Susulan',
      icon: UtensilsCrossed,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-500/30',
      highlight: true,
    },
    {
      title: 'Baseline Snapshot Awal',
      value: data.baselineTotalPorsi ?? data.grandTotalPorsi,
      unit: 'Porsi',
      description: data.cutoffTime
        ? `Cut-off ${data.cutoffTime} WIB`
        : 'Data saat cut-off snapshot',
      icon: Camera,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/10 dark:bg-blue-950/40',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Revisi Tambah Pasien',
      value: data.revisiTambahPasienCount ?? 0,
      unit: 'Pasien (+Porsi)',
      description: 'Pasien baru pasca-cut-off (Approved)',
      icon: UserPlus,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderColor: 'border-amber-500/20',
      badgeNotice:
        (data.revisiTambahPasienCount ?? 0) > 0 ? '+Bertambah' : undefined,
    },
    {
      title: 'Total Pasien Terlayani',
      value: data.grandTotalPasien,
      unit: 'Pasien',
      description: 'Jumlah pasien aktif di snapshot ini',
      icon: Users,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgIcon: 'bg-purple-500/10 dark:bg-purple-950/40',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Extra / Buah / Snack',
      value: data.grandTotalExtra,
      unit: 'Porsi',
      description: 'Konsumsi tambahan di luar menu standar',
      icon: Cookie,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgIcon: 'bg-orange-500/10 dark:bg-orange-950/40',
      borderColor: 'border-orange-500/20',
    },
  ];

  // Cards layout for Full-Day or Range Mode
  const aggregatedCards = [
    {
      title: isRange ? 'Total Pasien-Hari' : 'Total Pasien Terlayani',
      value: data.grandTotalPasien,
      unit: isRange ? 'Pasien-Hari' : 'Pasien',
      description: isRange
        ? 'Akumulasi pasien terlayani periode ini'
        : 'Pasien rawat inap aktif',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/10 dark:bg-blue-950/40',
      borderColor: 'border-blue-500/20',
    },
    {
      title: isRange
        ? `Total Porsi (${data.totalDays || 1} Hari)`
        : 'Total Porsi Harian',
      value: data.grandTotalPorsi,
      unit: 'Porsi',
      description: isRange
        ? `Akumulasi periode ${data.tanggalFormatted}`
        : 'Akumulasi seluruh waktu makan',
      icon: UtensilsCrossed,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-500/20',
      highlight: true,
    },
    {
      title: 'Makan Pagi',
      value: data.grandTotalPagi,
      unit: 'Porsi',
      description: 'Jadwal sarapan pagi',
      icon: Sunrise,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Makan Siang',
      value: data.grandTotalSiang,
      unit: 'Porsi',
      description: 'Jadwal makan siang',
      icon: Sun,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgIcon: 'bg-orange-500/10 dark:bg-orange-950/40',
      borderColor: 'border-orange-500/20',
    },
    {
      title: 'Makan Malam',
      value: data.grandTotalMalam,
      unit: 'Porsi',
      description: 'Jadwal makan malam',
      icon: Moon,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgIcon: 'bg-indigo-500/10 dark:bg-indigo-950/40',
      borderColor: 'border-indigo-500/20',
    },
  ];

  const cards = isPerSnapshot ? snapshotCards : aggregatedCards;

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full'>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={`border rounded-2xl shadow-2xs transition-all hover:shadow-xs ${
              card.borderColor
            } ${
              card.highlight
                ? 'bg-emerald-500/5 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                : 'bg-card'
            }`}
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

              <p className='text-[11px] text-muted-foreground line-clamp-1'>
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

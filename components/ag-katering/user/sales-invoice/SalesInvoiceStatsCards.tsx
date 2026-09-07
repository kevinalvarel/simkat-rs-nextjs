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
  Banknote,
  Layers,
} from 'lucide-react';
import type { SalesInvoiceSummary } from '@/types/invoicetypes';

interface SalesInvoiceStatsCardsProps {
  data: SalesInvoiceSummary;
}

function formatCurrency(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function SalesInvoiceStatsCards({
  data,
}: SalesInvoiceStatsCardsProps) {
  const isRange = Boolean(data.isRange);
  const isPerSnapshot = Boolean(data.isPerSnapshot);

  const snapshotCards = [
    {
      title: 'Total Harga Tagihan',
      value: formatCurrency(data.totalHarga),
      rawValue: data.totalHarga,
      unit: '',
      description: 'Akumulasi harga satuan × porsi',
      icon: Banknote,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-500/30',
      highlight: true,
      isCurrency: true,
    },
    {
      title: `Total Porsi (${data.waktuMakan || 'Snapshot'})`,
      value: String(data.grandTotalPorsi),
      rawValue: data.grandTotalPorsi,
      unit: 'Porsi',
      description: 'Baseline + Revisi Susulan',
      icon: UtensilsCrossed,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/10 dark:bg-blue-950/40',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Baseline Snapshot',
      value: String(data.baselineTotalPorsi ?? data.grandTotalPorsi),
      rawValue: data.baselineTotalPorsi ?? data.grandTotalPorsi,
      unit: 'Porsi',
      description: data.cutoffTime
        ? `Cut-off ${data.cutoffTime} WIB`
        : 'Data saat cut-off snapshot',
      icon: Camera,
      iconColor: 'text-violet-600 dark:text-violet-400',
      bgIcon: 'bg-violet-500/10 dark:bg-violet-950/40',
      borderColor: 'border-violet-500/20',
    },
    {
      title: 'Revisi Tambah Pasien',
      value: String(data.revisiTambahPasienCount ?? 0),
      rawValue: data.revisiTambahPasienCount ?? 0,
      unit: 'Pasien',
      description: 'Pasien baru pasca-cut-off',
      icon: UserPlus,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Total Pasien',
      value: String(data.grandTotalPasien),
      rawValue: data.grandTotalPasien,
      unit: 'Pasien',
      description: 'Pasien aktif di snapshot ini',
      icon: Users,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgIcon: 'bg-purple-500/10 dark:bg-purple-950/40',
      borderColor: 'border-purple-500/20',
    },
  ];

  const aggregatedCards = [
    {
      title: 'Total Harga Tagihan',
      value: formatCurrency(data.totalHarga),
      rawValue: data.totalHarga,
      unit: '',
      description: isRange
        ? `Akumulasi harga periode ${data.totalDays || 1} hari`
        : 'Akumulasi harga seluruh waktu makan',
      icon: Banknote,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-500/30',
      highlight: true,
      isCurrency: true,
    },
    {
      title: isRange
        ? `Total Porsi (${data.totalDays || 1} Hari)`
        : 'Total Porsi Harian',
      value: String(data.grandTotalPorsi),
      rawValue: data.grandTotalPorsi,
      unit: 'Porsi',
      description: isRange
        ? `Akumulasi periode ${data.tanggalFormatted}`
        : 'Akumulasi seluruh waktu makan',
      icon: UtensilsCrossed,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-500/10 dark:bg-blue-950/40',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Makan Pagi',
      value: String(data.grandTotalPagi),
      rawValue: data.grandTotalPagi,
      unit: 'Porsi',
      description: 'Jadwal sarapan pagi',
      icon: Sunrise,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Makan Siang',
      value: String(data.grandTotalSiang),
      rawValue: data.grandTotalSiang,
      unit: 'Porsi',
      description: 'Jadwal makan siang',
      icon: Sun,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgIcon: 'bg-orange-500/10 dark:bg-orange-950/40',
      borderColor: 'border-orange-500/20',
    },
    {
      title: 'Makan Malam',
      value: String(data.grandTotalMalam),
      rawValue: data.grandTotalMalam,
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
                <h3
                  className={`font-extrabold tracking-tight text-foreground font-sans ${
                    card.isCurrency
                      ? 'text-lg sm:text-xl'
                      : 'text-2xl'
                  }`}
                >
                  {card.isCurrency
                    ? card.value
                    : card.rawValue.toLocaleString('id-ID')}
                </h3>
                {card.unit && (
                  <span className='text-xs text-muted-foreground font-medium'>
                    {card.unit}
                  </span>
                )}
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

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Utensils, Ban, CheckSquare } from 'lucide-react';

interface PemorsianStatsCardProps {
  totalCount: number;
  activeCount: number;
  npoCount: number;
  selectedCount: number;
}

export default function PemorsianStatsCard({
  totalCount,
  activeCount,
  npoCount,
  selectedCount,
}: PemorsianStatsCardProps) {
  const stats = [
    {
      title: 'Total Pasien Snapshot',
      value: totalCount,
      description: 'Pasien terdaftar dalam siklus',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      title: 'Porsi Diet Aktif',
      value: activeCount,
      description: 'Wajib diporsikan & dicetak',
      icon: Utensils,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Pasien Puasa / NPO',
      value: npoCount,
      description: 'Porsi ditahan sementara',
      icon: Ban,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      title: 'Terpilih untuk Cetak',
      value: selectedCount,
      description:
        selectedCount > 0
          ? `${selectedCount} etiket siap dicetak`
          : 'Pilih baris pada tabel',
      icon: CheckSquare,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
  ];

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full'>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className={`border ${stat.border} shadow-2xs hover:shadow-xs transition-shadow`}
          >
            <CardContent className='p-4 sm:p-5 flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-xs font-medium text-muted-foreground'>
                  {stat.title}
                </p>
                <p className='text-xl sm:text-2xl font-bold text-foreground font-sans'>
                  {stat.value}
                </p>
                <p className='text-[10px] sm:text-xs text-muted-foreground truncate'>
                  {stat.description}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className='w-5 h-5' />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

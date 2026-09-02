'use client';

import React from 'react';
import { Users, Utensils, Ban, CheckSquare } from 'lucide-react';
import CetakEtiketStatCard from '../ui/CetakEtiketStatCard';
import type { CetakEtiketStatsData } from '@/types/cetaketikettypes';

interface CetakEtiketStatsProps {
  stats: CetakEtiketStatsData;
}

export default function CetakEtiketStats({ stats }: CetakEtiketStatsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* Card 1: Total Pasien Snapshot */}
      <CetakEtiketStatCard
        title='Total Pasien Snapshot'
        value={stats.totalPasien}
        subtitle='Pasien terdaftar dalam siklus'
        icon={Users}
        iconContainerClass='bg-emerald-50 text-emerald-600 border border-emerald-100'
      />

      {/* Card 2: Porsi Diet Aktif */}
      <CetakEtiketStatCard
        title='Porsi Diet Aktif'
        value={stats.porsiDietAktif}
        subtitle='Wajib diporsikan & dicetak'
        icon={Utensils}
        iconContainerClass='bg-emerald-50 text-emerald-600 border border-emerald-100'
      />

      {/* Card 3: Pasien Puasa / NPO */}
      <CetakEtiketStatCard
        title='Pasien Puasa / NPO'
        value={stats.pasienPuasa}
        subtitle='Porsi ditahan sementara'
        icon={Ban}
        iconContainerClass='bg-rose-50 text-rose-600 border border-rose-100'
        cardBorderClass='border-rose-100'
      />

      {/* Card 4: Terpilih untuk Cetak */}
      <CetakEtiketStatCard
        title='Terpilih untuk Cetak'
        value={stats.terpilihCount}
        subtitle='Pilih baris pada tabel'
        icon={CheckSquare}
        iconContainerClass='bg-blue-50 text-blue-600 border border-blue-100'
      />
    </div>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import {
  getUnmappedDietItems,
  getKategoriMenuOptions,
  getMappingDietStats,
} from '@/servers/mapping-diet.service';
import MappingDietClient from '@/components/ag-katering/user/mapping-diet/MappingDietClient';

export const metadata: Metadata = {
  title: 'Mapping Diet Pasien - Ahli Gizi Katering',
  description:
    'Petakan diet free-text RS ke standar kategori diet katering untuk laporan dan etiket makanan pasien.',
};

export default async function MappingDietPage() {
  const [items, options] = await Promise.all([
    getUnmappedDietItems(),
    getKategoriMenuOptions(),
  ]);
  const stats = await getMappingDietStats(items);

  return (
    <MappingDietClient initialItems={items} options={options} stats={stats} />
  );
}

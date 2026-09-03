import React from 'react';
import type { Metadata } from 'next';
import {
  getUnmappedDietItems,
  getMappedDietItems,
  getKategoriMenuOptions,
  getMappingDietStats,
} from '@/servers/mapping-diet.service';
import MappingDietClient from '@/components/ag-katering/user/mapping-diet/MappingDietClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mapping Diet Pasien - Ahli Gizi Katering',
  description:
    'Petakan diet free-text RS ke standar kategori diet katering untuk laporan dan etiket makanan pasien.',
};

export default async function MappingDietPage() {
  const [unmappedItems, mappedItems, options] = await Promise.all([
    getUnmappedDietItems(),
    getMappedDietItems(),
    getKategoriMenuOptions(),
  ]);
  const stats = await getMappingDietStats(unmappedItems, mappedItems);

  return (
    <MappingDietClient
      initialUnmappedItems={unmappedItems}
      initialMappedItems={mappedItems}
      options={options}
      stats={stats}
    />
  );
}

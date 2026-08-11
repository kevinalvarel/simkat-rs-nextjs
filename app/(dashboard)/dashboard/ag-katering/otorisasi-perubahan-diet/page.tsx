import React from 'react';
import { Metadata } from 'next';
import {
  getOtorisasiList,
  getOtorisasiStats,
} from '@/servers/otorisasi-diet.service';
import OtorisasiPerubahanClient from '@/components/ag-katering/otorisasi-perubahan-diet/OtorisasiPerubahanClient';

export const metadata: Metadata = {
  title: 'Otorisasi Perubahan Diet - Ahli Gizi Katering',
  description:
    'Modul otorisasi dan persetujuan resmi Admin untuk pengajuan revisi diet pasca-snapshot.',
};

export default async function OtorisasiPerubahanDietPage() {
  const items = await getOtorisasiList();
  const stats = await getOtorisasiStats(items);

  return <OtorisasiPerubahanClient initialItems={items} stats={stats} />;
}

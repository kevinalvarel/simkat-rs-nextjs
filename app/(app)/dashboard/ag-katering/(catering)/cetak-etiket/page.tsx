import React from 'react';
import type { Metadata } from 'next';
import { getLivePemorsianData } from '@/servers/pemorsian.service';
import CetakEtiketClient from '@/components/ag-katering/user/cetak-etiket/layout/CetakEtiketClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pemorsian & Cetak Etiket Makanan - Ahli Gizi Katering',
  description:
    'Layar pemorsian makanan dan pencetakan etiket label pasien dari snapshot produksi & revisi susulan.',
};

export default async function CetakEtiketPage() {
  const initialData = await getLivePemorsianData();

  return <CetakEtiketClient initialData={initialData} />;
}

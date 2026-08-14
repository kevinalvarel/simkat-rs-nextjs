import React from 'react';
import type { Metadata } from 'next';
import { getPemorsianData } from '@/servers/pemorsian.service';
import PemorsianClient from '@/components/ag-katering/user/overview/pemorsian/layout/PemorsianClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pemorsian Makanan & Cetak Etiket - Ahli Gizi Katering',
  description:
    'Layar pemorsian makanan dan pencetakan etiket label pasien dari snapshot produksi saat ini.',
};

export default async function PemorsianPage() {
  const initialData = await getPemorsianData();

  return <PemorsianClient initialData={initialData} />;
}

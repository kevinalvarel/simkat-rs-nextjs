import React from 'react';
import type { Metadata } from 'next';
import { getLivePemorsianData } from '@/servers/pemorsian.service';
import PemorsianClient from '@/components/ag-katering/user/overview/pemorsian/layout/PemorsianClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pemantauan Live Pemorsian - Ahli Gizi Katering',
  description:
    'Layar monitoring status cetak etiket pasien pasca snapshot dan deteksi perubahan data diet real-time.',
};

export default async function LivePemorsianPage() {
  const initialData = await getLivePemorsianData();

  return <PemorsianClient initialData={initialData} />;
}

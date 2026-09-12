import React from 'react';
import type { Metadata } from 'next';
import { getLiveKateringData } from '@/servers/overview.service';
import LiveKateringClient from '@/components/ag-katering/user/overview/katering/LiveKateringClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Daftar Pasien Diet Khusus Katering — Ahli Gizi Katering',
  description:
    'Daftar pasien diet khusus katering (Bubur Saring, Sonde, Formula Khusus) yang dialihkan dari lini produksi umum.',
};

export default async function KateringPage() {
  const initialData = await getLiveKateringData();

  return <LiveKateringClient initialData={initialData} />;
}

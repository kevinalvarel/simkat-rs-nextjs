import React from 'react';
import type { Metadata } from 'next';
import { getTabulasiDashboardData } from '@/servers/tabulasi.service';
import TabulasiClient from '@/components/ag-katering/user/tabulasi-rekapitulasi/layout/TabulasiClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Tabulasi Gizi & Menu - Ahli Gizi Katering RS',
  description:
    'Kelola dan pantau kebutuhan makanan pasien berdasarkan jadwal makan, diet, dan distribusi ruangan.',
};

export default async function TabulationPage() {
  const initialData = await getTabulasiDashboardData();

  return <TabulasiClient initialData={initialData} />;
}

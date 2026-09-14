import type { Metadata } from 'next';
import { getTabulasiSnackData } from '@/servers/tabulasi.service';
import TabulasiSnackClient from '@/components/ag-katering/user/tabulasi-rekapitulasi/layout/TabulasiSnackClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Tabulasi Snack - Ahli Gizi Katering RS',
  description: 'Rekapitulasi porsi snack pasien berdasarkan mapping diet dan siklus menu.',
};

export default async function TabulasiSnackPage() {
  const initialData = await getTabulasiSnackData();
  return <TabulasiSnackClient initialData={initialData} />;
}

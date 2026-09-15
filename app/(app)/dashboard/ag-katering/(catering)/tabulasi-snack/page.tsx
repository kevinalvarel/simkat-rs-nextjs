import type { Metadata } from 'next';
import { getTabulasiSnackBuahData } from '@/servers/tabulasi.service';
import TabulasiSnackClient from '@/components/ag-katering/user/tabulasi-rekapitulasi/layout/TabulasiSnackClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Tabulasi Snack & Buah - Ahli Gizi Katering RS',
  description: 'Rekapitulasi porsi snack & buah pasien berdasarkan mapping diet dan siklus menu.',
};

export default async function TabulasiSnackPage() {
  const { snack, buah } = await getTabulasiSnackBuahData();
  return <TabulasiSnackClient initialSnackData={snack} initialBuahData={buah} />;
}

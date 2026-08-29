import React from 'react';
import type { Metadata } from 'next';
import { getKwitansiData } from '@/servers/kwitansi.service';
import KwitansiClient from '@/components/ag-katering/user/kwitansi/KwitansiClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Kwitansi & Tanda Terima Distribusi Makanan - Katering RS',
  description:
    'Bukti tanda terima dan kwitansi serah terima penyerahan makanan pasien per ruangan rawat inap rumah sakit lengkap dengan fitur cetak.',
};

export default async function KwitansiPage() {
  const initialData = await getKwitansiData();

  return <KwitansiClient initialData={initialData} />;
}

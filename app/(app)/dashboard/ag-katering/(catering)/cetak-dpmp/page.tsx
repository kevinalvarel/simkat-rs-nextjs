import React from 'react';
import type { Metadata } from 'next';
import { getDpmpData } from '@/servers/dpmp.service';
import DpmpClient from '@/components/ag-katering/user/dpmp/DpmpClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Cetak DPMP & Tanda Terima Distribusi Makanan - Katering RS',
  description:
    'Daftar Permintaan Makanan Pasien (DPMP) dan bukti tanda terima serah terima penyerahan makanan pasien per ruangan rawat inap rumah sakit lengkap dengan fitur cetak.',
};

export default async function DpmpPage() {
  const initialData = await getDpmpData();

  return <DpmpClient initialData={initialData} />;
}

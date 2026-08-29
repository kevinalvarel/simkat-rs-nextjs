import React from 'react';
import type { Metadata } from 'next';
import { getInvoiceDailyData } from '@/servers/invoice.service';
import InvoiceClient from '@/components/ag-katering/user/invoice/InvoiceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Rekapitulasi Konsumsi Harian per Kelas - Invoice Katering',
  description:
    'Laporan rekapitulasi total konsumsi makanan harian pasien per kelas perawatan rumah sakit lengkap dengan fitur cetak dokumen resmi.',
};

export default async function InvoicePage() {
  const initialData = await getInvoiceDailyData();

  return <InvoiceClient initialData={initialData} />;
}
import React from 'react';
import type { Metadata } from 'next';
import { getInvoiceDailyData } from '@/servers/invoice.service';
import InvoiceClient from '@/components/ag-katering/user/invoice/InvoiceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Invoice Konsumsi Snapshot & Rekapitulasi per Kelas - Katering RS',
  description:
    'Laporan invoice konsumsi makanan pasien per snapshot waktu makan (Pagi, Siang, Malam) terakumulasi dengan revisi tambah pasien pasca-snapshot serta fitur cetak berita acara resmi.',
};

export default async function InvoicePage() {
  const initialData = await getInvoiceDailyData();

  return <InvoiceClient initialData={initialData} />;
}
import React from 'react';
import type { Metadata } from 'next';
import { getSalesInvoiceData } from '@/servers/sales-invoice.service';
import SalesInvoiceClient from '@/components/ag-katering/user/sales-invoice/SalesInvoiceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Faktur Penjualan Katering RS — Harga Satuan & Jumlah per Kelas',
  description:
    'Faktur penjualan makanan pasien rumah sakit dengan rincian harga satuan per kelas, jumlah harga, dan terbilang. Mendukung cetak harian, periode, dan bulanan.',
};

export default async function FakturPenjualanPage() {
  const initialData = await getSalesInvoiceData();

  return <SalesInvoiceClient initialData={initialData} />;
}

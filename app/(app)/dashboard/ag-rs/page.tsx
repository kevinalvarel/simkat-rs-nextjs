import React from 'react';
import type { Metadata } from 'next';
import SelectionClient from '@/components/ag-rs/selection/layout/SelectionClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilih Waktu Makan & Lokasi - Ahli Gizi RS',
  description:
    'Pilih jadwal waktu makan, gedung, dan ruangan rawat inap untuk input dan monitoring diet pasien.',
};

export default function AhliGiziRSPage() {
  return <SelectionClient />;
}

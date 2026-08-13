import React from 'react';
import type { Metadata } from 'next';
import { getGedungHierarkis, getKelasOptions } from '@/servers/tempat.service';
import KonfigurasiRuanganClient from '@/components/ag-katering/admin/konfigurasi-ruangan/KonfigurasiRuanganClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Tempat & Ruangan - Supervisor',
  description:
    'Modul khusus supervisor untuk pengelolaan hierarkis Gedung, Ruangan, Kelas, dan Kapasitas Bed.',
};

export default async function KonfigurasiRuanganPage() {
  const gedungHierarkis = await getGedungHierarkis();
  const kelasList = await getKelasOptions();

  return (
    <KonfigurasiRuanganClient
      initialGedungList={gedungHierarkis}
      kelasList={kelasList}
    />
  );
}
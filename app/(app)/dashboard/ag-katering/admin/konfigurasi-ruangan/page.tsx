import React from 'react';
import type { Metadata } from 'next';
import { getGedungHierarkis } from '@/servers/tempat.service';
import { getKelasList, getKelasOptions } from '@/servers/kelas.service';
import KonfigurasiTempatTabsClient from '@/components/ag-katering/admin/konfigurasi-ruangan/KonfigurasiTempatTabsClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Ruangan & Kelas - Supervisor',
  description:
    'Modul khusus supervisor untuk pengelolaan hierarkis Gedung, Ruangan, Kelas, dan Kapasitas Bed dalam satu halaman bertab.',
};

interface PageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function KonfigurasiRuanganPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultTab = params?.tab === 'kelas' ? ('kelas' as const) : ('ruangan' as const);

  const [gedungHierarkis, kelasOptions, kelasList] = await Promise.all([
    getGedungHierarkis(),
    getKelasOptions(),
    getKelasList(),
  ]);

  return (
    <KonfigurasiTempatTabsClient
      initialGedungList={gedungHierarkis}
      kelasOptions={kelasOptions}
      initialKelasList={kelasList}
      defaultTab={defaultTab}
    />
  );
}

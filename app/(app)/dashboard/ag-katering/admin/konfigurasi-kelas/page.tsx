import React from 'react';
import type { Metadata } from 'next';
import { getKelasList } from '@/servers/kelas.service';
import KonfigurasiKelasClient from '@/components/ag-katering/admin/konfigurasi-kelas/KonfigurasiKelasClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Kelas - Supervisor',
  description:
    'Modul khusus supervisor untuk pengelolaan jenis kelas perawatan (KELAS I, KELAS II, KELAS III).',
};

export default async function KonfigurasiKelasPage() {
  const kelasList = await getKelasList();

  return <KonfigurasiKelasClient initialKelasList={kelasList} />;
}

import React from 'react';
import type { Metadata } from 'next';
import { getKategoriMenuAll } from '@/servers/konfigurasi-menu.service';
import KonfigurasiMenuClient from '@/components/ag-katering/admin/konfigurasi-menu/KonfigurasiMenuClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Master Menu - Admin Katering',
  description:
    'Modul khusus Admin Katering untuk pengelolaan master data item menu (Bentuk Makanan, Hewani, Nabati, Sayur, Buah, Snack).',
};

export default async function KonfigurasiMenuPage() {
  const initialItems = await getKategoriMenuAll();

  return <KonfigurasiMenuClient initialItems={initialItems} />;
}

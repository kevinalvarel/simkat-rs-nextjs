import React from 'react';
import type { Metadata } from 'next';
import {
  getSiklusMenuList,
  getAvailableSiklusList,
  getKategoriMenuDietList,
} from '@/servers/siklus-menu.service';
import KonfigurasiSiklusMenuClient from '@/components/ag-katering/admin/konfigurasi-siklus-menu/KonfigurasiSiklusMenuClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Siklus Menu - Admin Katering',
  description:
    'Modul khusus Admin Katering untuk pengelolaan siklus menu makanan rumah sakit (Pagi, Siang, Sore, Saring).',
};

export default async function KonfigurasiSiklusMenuAdminPage() {
  const [initialItems, availableCycles, dietOptions] = await Promise.all([
    getSiklusMenuList(1),
    getAvailableSiklusList(),
    getKategoriMenuDietList(),
  ]);

  return (
    <KonfigurasiSiklusMenuClient
      initialItems={initialItems}
      availableCycles={availableCycles}
      dietOptions={dietOptions}
    />
  );
}

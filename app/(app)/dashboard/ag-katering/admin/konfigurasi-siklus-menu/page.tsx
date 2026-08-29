import React from 'react';
import type { Metadata } from 'next';
import {
  getSiklusMenuList,
  getMasterSiklusList,
  getKategoriMenuDietList,
} from '@/servers/siklus-menu.service';
import KonfigurasiSiklusMenuClient from '@/components/ag-katering/admin/konfigurasi-siklus-menu/KonfigurasiSiklusMenuClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Siklus Menu - Admin Katering',
  description:
    'Modul khusus Admin Katering untuk pengelolaan siklus menu makanan rumah sakit (Pagi, Siang, Sore, Saring).',
};

export default async function KonfigurasiSiklusMenuAdminPage() {
  const [masterSiklusList, dietOptions] = await Promise.all([
    getMasterSiklusList(),
    getKategoriMenuDietList(),
  ]);

  const defaultCycle =
    masterSiklusList.length > 0 ? masterSiklusList[0].nomor_siklus : 1;
  const initialItems = await getSiklusMenuList(defaultCycle);

  return (
    <KonfigurasiSiklusMenuClient
      initialItems={initialItems}
      initialMasterSiklus={masterSiklusList}
      dietOptions={dietOptions}
    />
  );
}


import type { Metadata } from 'next';
import {
  getSiklusMenuList,
  getMasterSiklusList,
  getKategoriMenuDietList,
} from '@/servers/siklus-menu.service';
import { getKelasList } from '@/servers/kelas.service';
import { resolveTodayCycleNum } from '@/lib/siklus-menu-utils';
import KonfigurasiSiklusMenuClient from '@/components/ag-katering/admin/konfigurasi-siklus-menu/KonfigurasiSiklusMenuClient';

export const metadata: Metadata = {
  title: 'Konfigurasi Siklus Menu - Admin Katering',
  description:
    'Modul khusus Admin Katering untuk pengelolaan siklus menu makanan rumah sakit (Pagi, Siang, Sore, Saring).',
};

export default async function KonfigurasiSiklusMenuAdminPage() {
  const [masterSiklusList, dietOptions, kelasList] = await Promise.all([
    getMasterSiklusList(),
    getKategoriMenuDietList(),
    getKelasList(),
  ]);

  // Default tab mengikuti siklus hari ini (anchor Siklus 1 yang customizable).
  const defaultCycle =
    masterSiklusList.length > 0
      ? resolveTodayCycleNum(
          masterSiklusList,
          masterSiklusList[0].nomor_siklus,
          new Date(),
        )
      : 1;
  const initialItems = await getSiklusMenuList(defaultCycle);

  return (
    <KonfigurasiSiklusMenuClient
      initialItems={initialItems}
      initialMasterSiklus={masterSiklusList}
      dietOptions={dietOptions}
      kelasOptions={kelasList.map((k) => k.namaKelas)}
    />
  );
}

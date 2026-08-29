import React from 'react';
import type { Metadata } from 'next';
import {
  getRiwayatDietPasienList,
  getRiwayatDietStats,
  getGiziRsUsers,
  getActivePatientsForRiwayat,
} from '@/servers/riwayat-diet.service';
import RiwayatDietClient from '@/components/ag-katering/admin/riwayat/RiwayatDietClient';

export const metadata: Metadata = {
  title: 'Tracker Perubahan Diet Pasien - Ahli Gizi RS',
  description:
    'Modul pemantauan dan audit log histori perubahan diet pasien oleh Staf Ahli Gizi Rumah Sakit secara real-time dan terintegrasi.',
};

export default async function RiwayatDietPasienPage() {
  const [items, giziRsUsers, patients] = await Promise.all([
    getRiwayatDietPasienList(),
    getGiziRsUsers(),
    getActivePatientsForRiwayat(),
  ]);

  const stats = await getRiwayatDietStats(items);

  return (
    <RiwayatDietClient
      initialItems={items}
      initialStats={stats}
      giziRsUsers={giziRsUsers}
      patients={patients}
    />
  );
}


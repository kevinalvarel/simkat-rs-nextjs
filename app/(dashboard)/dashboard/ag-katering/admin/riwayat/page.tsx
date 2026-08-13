import React from 'react';
import type { Metadata } from 'next';
import {
  getRiwayatDietPasienList,
  getRiwayatDietStats,
  getGiziRsUsers,
} from '@/servers/riwayat-diet.service';
import RiwayatDietClient from '@/components/ag-katering/admin/riwayat/RiwayatDietClient';

export const metadata: Metadata = {
  title: 'Riwayat Perubahan Diet Pasien - Gizi-RS',
  description:
    'Halaman audit log dan riwayat transaksi perubahan diet pasien oleh staf Ahli Gizi Rumah Sakit (gizi-rs) dengan tampilan nama dan email terdaftar.',
};

export default async function RiwayatDietPasienPage() {
  const [items, giziRsUsers] = await Promise.all([
    getRiwayatDietPasienList(),
    getGiziRsUsers(),
  ]);

  const stats = await getRiwayatDietStats(items);

  return (
    <RiwayatDietClient
      initialItems={items}
      initialStats={stats}
      giziRsUsers={giziRsUsers}
    />
  );
}

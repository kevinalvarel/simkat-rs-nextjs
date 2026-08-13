import React from 'react';
import type { Metadata } from 'next';
import { getUsers, getUserStats } from '@/servers/user.service';
import TambahPenggunaClient from '@/components/ag-katering/admin/tambah-pengguna/TambahPenggunaClient';

export const metadata: Metadata = {
  title: 'Tambah & Manajemen Pengguna - Supervisor',
  description:
    'Halaman khusus supervisor untuk pendaftaran dan pengelolaan akun pengguna Ahli Gizi Katering, Ahli Gizi RS, dan Supervisor.',
};

export default async function AddUserPage() {
  const users = await getUsers();
  const stats = await getUserStats(users);

  return <TambahPenggunaClient initialUsers={users} stats={stats} />;
}

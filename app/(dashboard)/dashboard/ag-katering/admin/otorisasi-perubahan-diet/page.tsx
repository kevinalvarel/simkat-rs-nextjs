import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getOtorisasiList,
  getOtorisasiStats,
} from '@/servers/otorisasi-diet.service';
import OtorisasiPerubahanClient from '@/components/ag-katering/otorisasi-perubahan-diet/OtorisasiPerubahanClient';
import { Forbidden } from '@/components/auth/forbidden';

export const metadata: Metadata = {
  title: 'Otorisasi Perubahan Diet - Ahli Gizi Katering',
  description:
    'Modul otorisasi dan persetujuan resmi Admin untuk pengajuan revisi diet pasca-snapshot.',
};

export default async function OtorisasiPerubahanDietPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/');
  }

  if (session.user.role !== 'supervisor') {
    return (
      <Forbidden
        currentUserRole={session.user.role}
        requiredRole='supervisor'
      />
    );
  }

  const items = await getOtorisasiList();
  const stats = await getOtorisasiStats(items);

  return <OtorisasiPerubahanClient initialItems={items} stats={stats} />;
}

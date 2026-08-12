import React from 'react';
import type { Metadata } from 'next';
import { getLiveMonitoringData } from '@/servers/overview.service';
import OverviewClient from '@/components/ag-katering/overview/OverviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pemantauan Snapshot - Ahli Gizi Katering',
  description:
    'Layar monitoring real-time perubahan jumlah porsi diet pasca snapshot terkunci.',
};

export default async function OverviewPage() {
  const initialData = await getLiveMonitoringData();

  return <OverviewClient initialData={initialData} />;
}

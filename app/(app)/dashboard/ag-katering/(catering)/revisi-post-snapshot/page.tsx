import React from 'react';
import { Metadata } from 'next';
import {
  getRevisiPostSnapshot,
  getRevisiStats,
} from '@/servers/revisi-snapshot.service';
import RevisiPostSnapshotClient from '@/components/ag-katering/user/revisi-post-snapshot/RevisiPostSnapshotClient';

export const metadata: Metadata = {
  title: 'Revisi Post-Snapshot - Ahli Gizi Katering',
  description:
    'Monitoring dan pengolahan data diet pasien yang direvisi pasca snapshot batch terkunci.',
};

export default async function RevisiPostSnapshotPage() {
  const items = await getRevisiPostSnapshot();
  const stats = await getRevisiStats(items);

  return <RevisiPostSnapshotClient initialItems={items} stats={stats} />;
}

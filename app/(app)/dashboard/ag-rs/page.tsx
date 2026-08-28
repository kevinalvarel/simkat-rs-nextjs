import React from 'react';
import type { Metadata } from 'next';
import SelectionClient from '@/components/ag-rs/selection/layout/SelectionClient';
import { getGedungWithRuangan } from '@/servers/tempat.service';
import {
  getWaktuMakanConfig,
  getSnapshotBatches,
} from '@/servers/snapshot.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilih Waktu Makan & Lokasi - Ahli Gizi RS',
  description:
    'Pilih jadwal waktu makan, gedung, dan ruangan rawat inap untuk input dan monitoring diet pasien.',
};

export default async function AhliGiziRSPage() {
  const [gedungList, waktuConfigs, snapshotBatches] = await Promise.all([
    getGedungWithRuangan(),
    getWaktuMakanConfig(),
    getSnapshotBatches(),
  ]);

  return (
    <SelectionClient
      initialGedungList={gedungList}
      initialWaktuConfigs={waktuConfigs}
      initialSnapshotBatches={snapshotBatches}
    />
  );
}

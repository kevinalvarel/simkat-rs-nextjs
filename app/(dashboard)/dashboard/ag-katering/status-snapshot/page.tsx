import {
  getSnapshotBatches,
  getWaktuMakanConfig,
} from '@/servers/snapshot.service';
import StatusSnapshotClient from '@/components/ag-katering/status-snapshot/StatusSnapshotClient';

export const metadata = {
  title: 'Snapshot & Waktu Kunci - Ahli Gizi Katering',
  description:
    'Pengaturan waktu cut-off dan snapshot data diet pasien untuk produksi katering rumah sakit.',
};

export default async function StatusSnapshotPage() {
  const [batches, configs] = await Promise.all([
    getSnapshotBatches(),
    getWaktuMakanConfig(),
  ]);

  return <StatusSnapshotClient initialBatches={batches} configs={configs} />;
}

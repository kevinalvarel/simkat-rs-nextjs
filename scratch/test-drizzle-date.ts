import { db } from '../drizzle';
import { snapshotBatchTable } from '../db/schemas/snapshot/snapshot-batch';
import { desc } from 'drizzle-orm';

async function main() {
  const batches = await db
    .select()
    .from(snapshotBatchTable)
    .orderBy(desc(snapshotBatchTable.timestamp_snapshot))
    .limit(5);

  console.log('Drizzle select result:');
  for (const b of batches) {
    console.log({
      id: b.id,
      batch_code: b.batch_code,
      waktu_makan: b.waktu_makan,
      tanggal_produksi: b.tanggal_produksi,
      type: typeof b.tanggal_produksi,
    });
  }
}

main().catch(console.error);

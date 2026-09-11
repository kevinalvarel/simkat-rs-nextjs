import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const batches = await sql`
    SELECT id, batch_code, waktu_makan, tanggal_produksi, status_batch, total_pasien, cutoff_time, timestamp_snapshot
    FROM snapshot_batch
    ORDER BY id DESC
    LIMIT 10;
  `;
  console.log('Recent Batches:');
  console.log(JSON.stringify(batches, null, 2));

  const configs = await sql`
    SELECT id, jenis_makan, waktu FROM waktu_makan ORDER BY id;
  `;
  console.log('\nWaktu Makan Configs:');
  console.log(JSON.stringify(configs, null, 2));
}

main().catch(console.error);

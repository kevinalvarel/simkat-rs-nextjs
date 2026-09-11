import {
  resolveActiveCycleForDate,
  normalizeDishName,
  consolidateSlotMenuItems,
} from '../lib/siklus-menu-utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log('=== TEST 1: Continuous Auto-Looping Cycles ===');

  const mockCycles = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    nomor_siklus: i + 1,
    nama_siklus: `Siklus ${i + 1}`,
    tanggal: `2026-09-${String(i + 1).padStart(2, '0')}`,
    hari: 'SENIN',
    is_active: true,
  }));

  // Add Siklus 11 (Khusus Tanggal 31)
  mockCycles.push({
    id: 11,
    nomor_siklus: 11,
    nama_siklus: 'Siklus 11 (Tgl 31)',
    tanggal: null as any,
    hari: null as any,
    is_active: true,
  });

  // Test day 1..10
  assert(
    resolveActiveCycleForDate('2026-09-01', mockCycles).activeCycleNum === 1,
    '2026-09-01 resolves to Siklus 1',
  );
  assert(
    resolveActiveCycleForDate('2026-09-05', mockCycles).activeCycleNum === 5,
    '2026-09-05 resolves to Siklus 5',
  );
  assert(
    resolveActiveCycleForDate('2026-09-10', mockCycles).activeCycleNum === 10,
    '2026-09-10 resolves to Siklus 10',
  );

  // Test auto-looping on day 11..20
  assert(
    resolveActiveCycleForDate('2026-09-11', mockCycles).activeCycleNum === 1,
    '2026-09-11 (day 11) loops back to Siklus 1',
  );
  assert(
    resolveActiveCycleForDate('2026-09-12', mockCycles).activeCycleNum === 2,
    '2026-09-12 (day 12) loops to Siklus 2',
  );
  assert(
    resolveActiveCycleForDate('2026-09-20', mockCycles).activeCycleNum === 10,
    '2026-09-20 (day 20) loops to Siklus 10',
  );
  assert(
    resolveActiveCycleForDate('2026-09-21', mockCycles).activeCycleNum === 1,
    '2026-09-21 (day 21) loops back to Siklus 1 (Iteration 3)',
  );

  // Test Day 31: Must choose Siklus 11!
  const day31Result = resolveActiveCycleForDate('2026-10-31', mockCycles);
  assert(
    day31Result.activeCycleNum === 11,
    '2026-10-31 (Day 31) automatically selects Siklus 11 (Khusus Tanggal 31)',
  );
  assert(
    day31Result.isSpecialDay31 === true,
    'Day 31 is flagged as specialDay31',
  );

  console.log('\n=== TEST 2: normalizeDishName ===');
  assert(
    normalizeDishName('  Loaf Ayam  Tahu  ') === 'loaf ayam tahu',
    'normalizeDishName trims, lowers, and collapses spaces',
  );

  console.log('\n=== TEST 3: consolidateSlotMenuItems (Lauk Tergabung) ===');
  const mockSlotItems = [
    {
      id: 101,
      siklus_ke: 9,
      kelas: 'Kelas 1',
      jenis_makanan: 'HEWANI',
      waktu_makan: 'SIANG',
      nama_makanan: 'LOAF AYAM TAHU',
      kategori_menu: 'B',
    },
    {
      id: 102,
      siklus_ke: 9,
      kelas: 'Kelas 1',
      jenis_makanan: 'NABATI',
      waktu_makan: 'SIANG',
      nama_makanan: 'Loaf Ayam Tahu',
      kategori_menu: 'B',
    },
    {
      id: 103,
      siklus_ke: 9,
      kelas: 'Kelas 1',
      jenis_makanan: 'SAYUR',
      waktu_makan: 'SIANG',
      nama_makanan: 'SUP SAYURAN',
      kategori_menu: 'B',
    },
    {
      id: 104,
      siklus_ke: 9,
      kelas: 'Kelas 2 - 3',
      jenis_makanan: 'NABATI',
      waktu_makan: 'SIANG',
      nama_makanan: 'DADAR JAGUNG SAYUR',
      kategori_menu: 'B',
    },
    {
      id: 105,
      siklus_ke: 9,
      kelas: 'Kelas 2 - 3',
      jenis_makanan: 'SAYUR',
      waktu_makan: 'SIANG',
      nama_makanan: 'Dadar Jagung Sayur',
      kategori_menu: 'B',
    },
  ];

  const consolidated = consolidateSlotMenuItems(mockSlotItems);
  assert(
    consolidated.length === 3,
    `Consolidated from 5 items to 3 items (expected 3, got ${consolidated.length})`,
  );

  const loafItem = consolidated.find(
    (c) => normalizeDishName(c.nama_makanan) === 'loaf ayam tahu',
  );
  assert(Boolean(loafItem), 'Loaf Ayam Tahu exists in consolidated list');
  assert(
    loafItem?.jenis_makanan === 'HEWANI & NABATI',
    `Loaf Ayam Tahu category is "HEWANI & NABATI" (got ${loafItem?.jenis_makanan})`,
  );

  const dadarItem = consolidated.find(
    (c) => normalizeDishName(c.nama_makanan) === 'dadar jagung sayur',
  );
  assert(Boolean(dadarItem), 'Dadar Jagung Sayur exists in consolidated list');
  assert(
    dadarItem?.jenis_makanan === 'NABATI & SAYUR',
    `Dadar Jagung Sayur category is "NABATI & SAYUR" (got ${dadarItem?.jenis_makanan})`,
  );

  const supItem = consolidated.find(
    (c) => normalizeDishName(c.nama_makanan) === 'sup sayuran',
  );
  assert(
    supItem?.jenis_makanan === 'SAYUR',
    'Sup Sayuran remains individual "SAYUR"',
  );

  console.log('\nAll tests passed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

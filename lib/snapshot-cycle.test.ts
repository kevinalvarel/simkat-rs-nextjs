import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeMealCycleStatuses, getWibDate } from './snapshot-cycle';
import type { SnapshotBatch, WaktuMakanConfig } from './snapshot-cycle';

const configs: WaktuMakanConfig[] = [
  { id: 1, jenis_makan: 'PAGI', waktu: '05:30' },
  { id: 2, jenis_makan: 'SIANG', waktu: '10:30' },
  { id: 3, jenis_makan: 'MALAM', waktu: '16:00' },
];
const batch = (date: string, meal: string, status = 'LOCKED') => ({
  tanggal_produksi: date, waktu_makan: meal, status_batch: status,
}) as SnapshotBatch;

test('night lock immediately opens tomorrow morning in WIB', () => {
  const now = new Date('2026-09-13T09:00:00Z'); // 16:00 WIB
  const cycle = computeMealCycleStatuses(configs, [batch('2026-09-13', 'MALAM')], now);
  assert.equal(cycle.activeCycle?.jenis_makan, 'PAGI');
  assert.equal(cycle.activeCycle?.targetDate, '2026-09-14');
  assert.equal(cycle.statuses.find((item) => item.jenis_makan === 'MALAM')?.isLocked, true);
});

test('passing cutoff without a locked batch does not open the next slot', () => {
  const now = new Date('2026-09-13T05:00:00Z'); // 12:00 WIB
  const cycle = computeMealCycleStatuses(configs, [batch('2026-09-13', 'PAGI')], now);
  assert.equal(cycle.activeCycle?.jenis_makan, 'SIANG');
  assert.equal(cycle.statuses.find((item) => item.jenis_makan === 'SIANG')?.isLocked, false);
  assert.equal(cycle.statuses.find((item) => item.jenis_makan === 'MALAM')?.isAvailable, false);
});

test('tomorrow morning can be locked early and opens tomorrow noon', () => {
  const now = new Date('2026-09-13T09:00:00Z');
  const cycle = computeMealCycleStatuses(configs, [
    batch('2026-09-13', 'MALAM'), batch('2026-09-14', 'PAGI'),
  ], now);
  assert.equal(cycle.activeCycle?.jenis_makan, 'SIANG');
  assert.equal(cycle.activeCycle?.targetDate, '2026-09-14');
});

test('unlocked batch does not advance and WIB date crosses UTC midnight correctly', () => {
  const now = new Date('2026-09-13T18:00:00Z'); // 14 September 01:00 WIB
  assert.equal(getWibDate(now), '2026-09-14');
  const cycle = computeMealCycleStatuses(configs, [
    batch('2026-09-13', 'MALAM'), batch('2026-09-14', 'PAGI', 'OPEN'),
  ], now);
  assert.equal(cycle.activeCycle?.jenis_makan, 'PAGI');
  assert.equal(cycle.activeCycle?.isLocked, false);
});

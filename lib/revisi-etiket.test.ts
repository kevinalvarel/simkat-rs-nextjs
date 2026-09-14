import assert from 'node:assert/strict';
import test from 'node:test';
import { canPrintRevision, effectivePrintedPatientIds, revisionSignature, revisionTypeLabel } from './revisi-etiket';
import type { PemorsianPatientItem, PemorsianRevisiItem } from '../types/pemorsiantypes';

test('only revisions with a replacement meal label are printable', () => {
  assert.equal(canPrintRevision('DIET_CHANGE'), true);
  assert.equal(canPrintRevision('ROOM_TRANSFER'), true);
  assert.equal(canPrintRevision('NEW_PATIENT'), true);
  assert.equal(canPrintRevision('KOREKSI_NAMA'), true);
  assert.equal(canPrintRevision('KOREKSI_NO_RM'), true);
  assert.equal(canPrintRevision('KOREKSI_KELAS'), true);
  assert.equal(canPrintRevision('KOREKSI_KAMAR'), true);
  assert.equal(canPrintRevision('KOREKSI_BED'), true);
  assert.equal(canPrintRevision('NPO'), false);
  assert.equal(canPrintRevision('DISCHARGE'), false);
});

test('revision labels use Indonesian without changing stored codes', () => {
  assert.equal(revisionTypeLabel('DIET_CHANGE'), 'Perubahan Diet');
  assert.equal(revisionTypeLabel('ROOM_TRANSFER'), 'Pindah Ruangan');
  assert.equal(revisionTypeLabel('NEW_PATIENT'), 'Pasien Baru');
  assert.equal(revisionTypeLabel('DISCHARGE'), 'Pasien Pulang');
  assert.equal(revisionTypeLabel('NPO'), 'Puasa');
  assert.equal(revisionTypeLabel('KOREKSI_NAMA'), 'Koreksi Nama');
  assert.equal(revisionTypeLabel('KOREKSI_NO_RM'), 'Koreksi No RM');
  assert.equal(revisionTypeLabel('KOREKSI_KELAS'), 'Koreksi Kelas');
  assert.equal(revisionTypeLabel('KOREKSI_KAMAR'), 'Koreksi No Kamar');
  assert.equal(revisionTypeLabel('KOREKSI_BED'), 'Koreksi Bed');
});

test('a later patient change gets a new print version even if diet returns to an earlier value', () => {
  const base = { jenis: 'DIET_CHANGE', diet: 'Diet A', ruangan: 'Melati', bed: '1', kelas: 'II' };
  const first = revisionSignature({ ...base, updatedAt: new Date('2026-09-14T01:00:00Z') });
  const second = revisionSignature({ ...base, updatedAt: new Date('2026-09-14T02:00:00Z') });
  assert.notEqual(first, second);
  assert.equal(first, revisionSignature({ ...base, updatedAt: new Date('2026-09-14T01:00:00Z') }));
});

test('revision print status overrides the snapshot status without double counting a patient', () => {
  const patients = [
    { id: 3, no_rm: 'RM-1', print_status: 'SUDAH_DICETAK' },
    { id: 8, no_rm: 'RM-2', print_status: 'BELUM_DICETAK' },
  ] as PemorsianPatientItem[];
  const revisions = [{ id: 3, no_rm: 'RM-1', revision_print_status: 'BELUM_DICETAK' }] as PemorsianRevisiItem[];
  assert.equal(effectivePrintedPatientIds(patients, revisions).size, 0);
  revisions[0].revision_print_status = 'SUDAH_DICETAK';
  assert.deepEqual([...effectivePrintedPatientIds(patients, revisions)], [3]);
});

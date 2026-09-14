import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBedOptions,
  countKamarOccupancy,
  effectiveKamarCapacity,
  getBedOccupantName,
  getOccupiedBedLabels,
  isKamarFull,
} from './kamar-occupancy';

const PATIENTS = [
  { id: 1, ruangan: 'Melati', gedung: 'Kamar 101', bed: 'Bed 1', status_pasien: 'AKTIF', nama_pasien: 'Budi' },
  { id: 2, ruangan: 'Melati', gedung: 'Kamar 101', bed: 'Bed 2', status_pasien: 'AKTIF', nama_pasien: 'Siti' },
  { id: 3, ruangan: 'Melati', gedung: 'Kamar 102', bed: 'Bed 1', status_pasien: 'AKTIF', nama_pasien: 'Andi' },
  { id: 4, ruangan: 'Melati', gedung: 'Kamar 101', bed: 'Bed 3', status_pasien: 'PULANG', nama_pasien: 'Pulang' },
  { id: 5, ruangan: 'Mawar', gedung: 'Kamar 101', bed: 'Bed 1', status_pasien: 'AKTIF', nama_pasien: 'Rina' },
];

test('menghitung hunian per kamar tanpa pasien pulang', () => {
  assert.equal(countKamarOccupancy(PATIENTS, 'Melati', 'Kamar 101'), 2);
  assert.equal(countKamarOccupancy(PATIENTS, 'Melati', 'Kamar 102'), 1);
  assert.equal(countKamarOccupancy(PATIENTS, 'Mawar', 'Kamar 101'), 1);
});

test('perbandingan case-insensitive dan trim', () => {
  assert.equal(countKamarOccupancy(PATIENTS, '  melati ', 'kamar 101'), 2);
});

test('kamar penuh sesuai kapasitas dan mengecualikan pasien yang dipindah', () => {
  assert.equal(isKamarFull(PATIENTS, 'Melati', 'Kamar 101', 2), true);
  assert.equal(isKamarFull(PATIENTS, 'Melati', 'Kamar 101', 3), false);
  // Pasien id 1 sedang dipindah keluar dari kamar itu
  assert.equal(isKamarFull(PATIENTS, 'Melati', 'Kamar 101', 2, 1), false);
});

test('label bed terisi dan nama penghuni', () => {
  assert.deepEqual(
    [...getOccupiedBedLabels(PATIENTS, 'Melati', 'Kamar 101')].sort(),
    ['bed 1', 'bed 2'],
  );
  assert.equal(
    getBedOccupantName(PATIENTS, 'Melati', 'Kamar 101', 'Bed 1'),
    'Budi',
  );
  assert.equal(
    getBedOccupantName(PATIENTS, 'Melati', 'Kamar 101', 'Bed 3'),
    null,
  );
});

test('kapasitas fallback dan opsi bed', () => {
  assert.equal(effectiveKamarCapacity(4), 4);
  assert.equal(effectiveKamarCapacity(0), 6);
  assert.equal(effectiveKamarCapacity(undefined), 6);
  assert.deepEqual(buildBedOptions(2), ['Bed 1', 'Bed 2']);
});

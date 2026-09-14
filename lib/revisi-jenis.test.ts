import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRevisiAlasan,
  detectJenisPerubahan,
  diffPasienFields,
} from './revisi-jenis';

const OLD = {
  nama_pasien: 'Budi',
  no_rm: 'RM-1',
  diet: 'Diet Biasa',
  kelas: 'Kelas 1',
  gedung: 'Kamar 1',
  ruangan: 'Melati',
  bed: 'Bed 1',
  status_pasien: 'AKTIF',
  is_npo: false,
};

test('nama-only change is KOREKSI_NAMA, not DIET_CHANGE', () => {
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, nama_pasien: 'Budi Santoso' }),
    'KOREKSI_NAMA',
  );
});

test('each identity field maps to its own jenis', () => {
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, no_rm: 'RM-2' }),
    'KOREKSI_NO_RM',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, kelas: 'Kelas 2' }),
    'KOREKSI_KELAS',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, gedung: 'Kamar 2' }),
    'KOREKSI_KAMAR',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, bed: 'Bed 2' }),
    'KOREKSI_BED',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, ruangan: 'Mawar' }),
    'ROOM_TRANSFER',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, diet: 'Diet Lunak' }),
    'DIET_CHANGE',
  );
});

test('combined diet + nama change uses DIET_CHANGE priority', () => {
  assert.equal(
    detectJenisPerubahan(OLD, {
      ...OLD,
      diet: 'Diet Lunak',
      nama_pasien: 'Budi Santoso',
    }),
    'DIET_CHANGE',
  );
  const diffs = diffPasienFields(OLD, {
    ...OLD,
    diet: 'Diet Lunak',
    nama_pasien: 'Budi Santoso',
  });
  assert.deepEqual(
    diffs.map((d) => d.field),
    ['nama_pasien', 'diet'],
  );
});

test('npo and discharge take top priority', () => {
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, is_npo: true }),
    'NPO',
  );
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, status_pasien: 'PULANG' }),
    'DISCHARGE',
  );
});

test('whitespace/case-only differences are ignored', () => {
  assert.equal(
    detectJenisPerubahan(OLD, { ...OLD, nama_pasien: '  budi ' }),
    'DIET_CHANGE',
  );
  assert.deepEqual(
    diffPasienFields(OLD, { ...OLD, nama_pasien: '  budi ' }),
    [],
  );
});

test('partial inline update only inspects provided fields', () => {
  assert.equal(
    detectJenisPerubahan(OLD, { nama_pasien: 'Budi Santoso' }),
    'KOREKSI_NAMA',
  );
  assert.equal(detectJenisPerubahan(OLD, { bed: 'Bed 2' }), 'KOREKSI_BED');
});

test('alasan otomatis merinci field yang berubah', () => {
  assert.equal(
    buildRevisiAlasan(OLD, { ...OLD, nama_pasien: 'Budi Santoso' }),
    'Nama: Budi → Budi Santoso',
  );
  assert.equal(
    buildRevisiAlasan(OLD, { ...OLD, is_npo: true }),
    'Instruksi Pasien Puasa / NPO',
  );
});

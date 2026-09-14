import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMenuTagOptions, normalizeMenuTags, type MenuTagOption } from './siklus-menu-tags';

const options: MenuTagOption[] = [
  { kode: 'DM', label: 'Diabetes', kategori: 'DIIT' },
  { kode: 'SNACK_PAGI', label: 'Snack Pagi', kategori: 'SNACK' },
  { kode: 'SNACK_SORE', label: 'Snack Sore', kategori: 'SNACK' },
];

test('snack only exposes tags from the SNACK master category', () => {
  assert.deepEqual(getMenuTagOptions(options, 'SNACK').map((option) => option.kode), [
    'SNACK_PAGI',
    'SNACK_SORE',
  ]);
  assert.deepEqual(getMenuTagOptions(options, 'HEWANI'), []);
});

test('stored tags are canonicalized and wrong-category tags are rejected', () => {
  const snackOptions = getMenuTagOptions(options, 'SNACK');
  assert.deepEqual(normalizeMenuTags('snack_pagi, SNACK_PAGI, DM', snackOptions), {
    codes: ['SNACK_PAGI'],
    invalid: ['DM'],
  });
  assert.deepEqual(normalizeMenuTags(null, snackOptions), { codes: [], invalid: [] });
});

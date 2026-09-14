import assert from 'node:assert/strict';
import test from 'node:test';
import { hasFoodMapping, hasFormFoodMapping, mergeFoodMapping, selectBentukMakanan } from './mapping-diet-fields';
import { mappingDietFormSchema } from './mapping-diet-schema';

const empty = { bentuk_makanan: null, kategori_diet: null, nabati: null, sayur: null, buah: null, snack: null };
const formEmpty = { mode: 'STANDARD' as const, bentukMakanan: '', hewani: '', nabati: '', sayur: '', buah: '', snack: '' };

test('each of six food fields can stand alone', () => {
  for (const field of Object.keys(empty) as Array<keyof typeof empty>) {
    assert.equal(hasFoodMapping({ ...empty, [field]: 'A' }), true, field);
  }
  for (const field of ['bentukMakanan', 'hewani', 'nabati', 'sayur', 'buah', 'snack'] as const) {
    assert.equal(mappingDietFormSchema.safeParse({ ...formEmpty, [field]: 'A' }).success, true, field);
  }
});

test('standard mapping rejects an entirely empty selection', () => {
  assert.equal(hasFoodMapping(empty), false);
  assert.equal(hasFormFoodMapping(formEmpty), false);
  assert.equal(mappingDietFormSchema.safeParse(formEmpty).success, false);
  assert.equal(mappingDietFormSchema.safeParse({ ...formEmpty, mode: 'NPO' }).success, true);
});

test('bulk patch preserves other fields and does not copy sayur into nabati', () => {
  const merged = mergeFoodMapping({ ...empty, kategori_diet: 'H', sayur: 'S' }, { snack: 'Snack' });
  assert.deepEqual(merged, { ...empty, kategori_diet: 'H', sayur: 'S', snack: 'Snack' });
});

test('switching food shape applies special modes and clears their sentinel values on return', () => {
  const initial = { hewani: 'H', nabati: 'N', sayur: 'S', buah: 'B', snack: 'SK' };
  const npo = selectBentukMakanan(initial, 'NPO');
  assert.equal(npo.mode, 'NPO');
  assert.deepEqual([npo.hewani, npo.nabati, npo.sayur, npo.buah, npo.snack], Array(5).fill('NPO'));

  const ordinary = selectBentukMakanan(npo, 'BN');
  assert.equal(ordinary.mode, 'STANDARD');
  assert.equal(ordinary.bentukMakanan, 'BN');
  assert.deepEqual([ordinary.hewani, ordinary.nabati, ordinary.sayur, ordinary.buah, ordinary.snack], Array(5).fill(''));
});

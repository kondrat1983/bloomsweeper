import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reachWithin, GREEN } from '../src/rules/cells.mjs';
import { creatureRule } from '../src/rules/creatures.mjs';

// Line graph: 0 - 1 - 2 - 3
const line = [[1], [0, 2], [1, 3], [2]];

test('reachWithin counts steps and includes the start', () => {
  assert.deepEqual(reachWithin(line, 0, 0), [0]);
  assert.deepEqual(reachWithin(line, 0, 1), [0, 1]);
  assert.deepEqual(reachWithin(line, 1, 2), [0, 1, 2, 3]);
});

test('bee: exactly n of its neighbours are BLOOM, its own cell is GREEN', () => {
  const r = creatureRule({ id: 'k01', type: 'bee', cell: 1, n: 2 }, line);
  assert.deepEqual(r.green, [1]);
  assert.deepEqual(r.constraint, { source: 'k01', cells: [0, 2], bloom: 2 });
});

test('bee without a number is rejected', () => {
  assert.throws(() => creatureRule({ id: 'k01', type: 'bee', cell: 1, n: null }, line), /integer/);
});

test('rabbit: its cell and all neighbours are GREEN (bloom 0 over that set)', () => {
  const r = creatureRule({ id: 'k02', type: 'rabbit', cell: 0 }, line);
  assert.deepEqual(r.green, [0]);
  assert.deepEqual(r.constraint, { source: 'k02', cells: [0, 1], bloom: 0 });
});

test('fox: no BLOOM within two steps', () => {
  const r = creatureRule({ id: 'k03', type: 'fox', cell: 0 }, line);
  assert.deepEqual(r.constraint, { source: 'k03', cells: [0, 1, 2], bloom: 0 });
});

test('unknown creature type is rejected', () => {
  assert.throws(() => creatureRule({ id: 'k04', type: 'owl', cell: 0 }, line), /unknown creature/);
});

test('green constant is exported for solver use', () => {
  assert.equal(typeof GREEN, 'number');
});

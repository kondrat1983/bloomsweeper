import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countSolutions } from '../src/solver/count.mjs';

const base = { cellCount: 2 };

test('two cells, one bloom: two solutions', () => {
  const r = countSolutions({ ...base, constraints: [{ cells: [0, 1], bloom: 1 }] });
  assert.equal(r.count, 2);
});

test('adding a clue makes the solution unique', () => {
  const r = countSolutions({
    ...base,
    constraints: [{ cells: [0, 1], bloom: 1 }, { cells: [0], bloom: 1 }],
  });
  assert.equal(r.count, 1);
  assert.deepEqual(r.first, [1, 0]);
});

test('impossible clue gives zero solutions', () => {
  const r = countSolutions({ ...base, constraints: [{ cells: [0], bloom: 2 }] });
  assert.equal(r.count, 0);
});

test('green cells and page total are respected', () => {
  const r = countSolutions({
    ...base,
    constraints: [{ cells: [0, 1], bloom: 1 }],
    greenCells: [0],
    total: 1,
  });
  assert.equal(r.count, 1);
  assert.deepEqual(r.first, [0, 1]);
});

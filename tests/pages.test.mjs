// Content checks of the shipped Garden pages against GDD 8.2 (sizes) and a minimum share of blooms,
// so a page that is valid but almost all green (nothing to find) cannot ship.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MIN_BLOOM_SHARE } from '../src/limits.mjs';

const ROOT = new URL('../pages/garden/', import.meta.url);
const MAIN = { '03-small': [40, 80], '04-medium': [120, 180], '05-large': [250, 350] };

for (const [id, [lo, hi]] of Object.entries(MAIN)) {
  test(`garden/${id}: size within GDD 8.2 and enough blooms`, () => {
    const page = JSON.parse(readFileSync(new URL(`${id}/page.json`, ROOT), 'utf8'));
    const n = page.cells.length;
    assert.ok(n >= lo && n <= hi, `${n} cells, GDD says ${lo} to ${hi}`);
    const blooms = Object.values(page.solution).filter((v) => v === 'BLOOM').length;
    assert.ok(blooms / n >= MIN_BLOOM_SHARE, `${blooms} blooms of ${n} cells, need at least ${MIN_BLOOM_SHARE * 100}%`);
  });
}

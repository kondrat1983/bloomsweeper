import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generatePage } from '../src/gen/generate.mjs';
import { validatePage } from '../src/page/validate.mjs';

for (const profile of ['teach-rabbit', 'teach-fox']) {
  test(`${profile}: a generated page passes the validator and teaches its creature`, () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'bsg-')), profile);
    const r = generatePage({ profile, seed: 3, out: dir, maxTries: 12 });
    assert.equal(r.ok, true, r.reason);
    const v = validatePage(dir);
    assert.deepEqual(v.errors, []);
    const svg = readFileSync(join(dir, 'page.svg'), 'utf8');
    const type = profile.split('-')[1];
    assert.ok(svg.includes(`data-type="${type}"`), `has a ${type}`);
    assert.ok(v.report.cells >= 12 && v.report.cells <= 20, `cells ${v.report.cells}`);
    rmSync(dir, { recursive: true, force: true });
  });
}

test('the same seed gives the same page', () => {
  const a = join(mkdtempSync(join(tmpdir(), 'bsg-')), 'a'), b = join(mkdtempSync(join(tmpdir(), 'bsg-')), 'b');
  generatePage({ profile: 'teach-rabbit', seed: 5, out: a, maxTries: 12 });
  generatePage({ profile: 'teach-rabbit', seed: 5, out: b, maxTries: 12 });
  assert.equal(readFileSync(join(a, 'page.svg'), 'utf8'), readFileSync(join(b, 'page.svg'), 'utf8'));
});

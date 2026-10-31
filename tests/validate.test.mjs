import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage } from '../src/page/validate.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const testPage = join(repo, 'pages', 'garden', 'test-m0');

function copyPage() {
  const dir = join(mkdtempSync(join(tmpdir(), 'bs-')), 'test-m0');
  cpSync(testPage, dir, { recursive: true });
  return dir;
}

test('the hand-made M0 test page is valid', () => {
  const r = validatePage(testPage);
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.equal(r.report.unique, true);
});

test('removing a clue breaks uniqueness or solvability', () => {
  const dir = copyPage();
  const svgPath = join(dir, 'page.svg');
  const svg = readFileSync(svgPath, 'utf8');
  const firstCreature = svg.match(/<g id="k01"[\s\S]*?<\/g>/)[0];
  writeFileSync(svgPath, svg.replace(firstCreature, ''));
  const r = validatePage(dir);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /not unique|stage|no-guess/.test(e)), r.errors.join('\n'));
  rmSync(dir, { recursive: true, force: true });
});

test('a stale page.json is reported', () => {
  const dir = copyPage();
  const pj = join(dir, 'page.json');
  const json = JSON.parse(readFileSync(pj, 'utf8'));
  json.adjacency.c001 = [];
  writeFileSync(pj, JSON.stringify(json, null, 2));
  const r = validatePage(dir);
  assert.ok(r.errors.some((e) => /stale/.test(e)), r.errors.join('\n'));
  rmSync(dir, { recursive: true, force: true });
});

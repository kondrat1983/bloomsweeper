#!/usr/bin/env node
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage } from '../src/page/validate.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

function findPages(pagesRoot) {
  const out = [];
  if (!existsSync(pagesRoot)) return out;
  for (const ch of readdirSync(pagesRoot, { withFileTypes: true })) {
    if (!ch.isDirectory()) continue;
    for (const p of readdirSync(join(pagesRoot, ch.name), { withFileTypes: true })) {
      const dir = join(pagesRoot, ch.name, p.name);
      if (p.isDirectory() && existsSync(join(dir, 'page.svg'))) out.push(dir);
    }
  }
  return out;
}

const arg = process.argv[2];
if (!arg) {
  console.error('usage: tools/validate <pageDir|all>');
  process.exit(2);
}
const dirs = arg === 'all' ? findPages(join(root, 'pages')) : [resolve(arg)];
if (dirs.length === 0) console.log('no pages found');
let failed = 0;
for (const dir of dirs) {
  const r = validatePage(dir);
  console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${dir.replace(root + '/', '')}`);
  for (const e of r.errors) console.log(`   - ${e}`);
  for (const w of r.warnings) console.log(`   ~ ${w}`);
  if (r.ok) console.log(`   cells ${r.report.cells}, creatures ${r.report.creatures}, unique ${r.report.unique}, difficulty ${JSON.stringify(r.report.difficulty)}`);
  if (!r.ok) failed++;
}
process.exit(failed ? 1 : 0);

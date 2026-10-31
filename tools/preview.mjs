#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPage } from '../src/page/model.mjs';
import { previewStates } from '../src/page/preview.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: tools/preview <pageDir>');
  process.exit(2);
}
const model = loadPage(dir);
if (model.errors.length) {
  for (const e of model.errors) console.error(`error: ${e}`);
  process.exit(1);
}
const out = join(root, 'docs', 'previews');
mkdirSync(out, { recursive: true });
const states = previewStates(model);
for (const [name, svg] of Object.entries(states)) {
  writeFileSync(join(out, `${model.id}-${name}.svg`), svg);
}
console.log(`wrote 3 SVG previews to docs/previews/ for ${model.id}`);

// PNG through the preinstalled Chromium (Playwright). Skipped if Playwright is not available.
try {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const opts = existsSync('/opt/pw-browsers/chromium') ? {} : {};
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 600, height: 800 } });
  for (const name of Object.keys(states)) {
    const svgPath = join(out, `${model.id}-${name}.svg`);
    await page.goto('file://' + svgPath);
    await page.screenshot({ path: join(out, `${model.id}-${name}.png`) });
  }
  await browser.close();
  console.log('wrote 3 PNG previews');
} catch (e) {
  console.log(`PNG skipped: ${e.message.split('\n')[0]}`);
}

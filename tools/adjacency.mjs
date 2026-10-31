#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadPage } from '../src/page/model.mjs';
import { analyze } from '../src/page/analyze.mjs';
import { buildPageJson } from '../src/page/pagejson.mjs';

const dir = resolve(process.argv[2] ?? '');
if (!process.argv[2]) {
  console.error('usage: tools/adjacency <pageDir>');
  process.exit(2);
}
const model = loadPage(dir);
if (model.errors.length) {
  for (const e of model.errors) console.error(`error: ${e}`);
  process.exit(1);
}
const degrees = model.adjacency.map((a) => a.length);
const json = buildPageJson(model, analyze(model));
writeFileSync(join(dir, 'page.json'), JSON.stringify(json, null, 2) + '\n');
const avg = (degrees.reduce((a, b) => a + b, 0) / degrees.length).toFixed(2);
console.log(`wrote ${join(dir, 'page.json')}: ${degrees.length} cells, neighbours min ${Math.min(...degrees)} max ${Math.max(...degrees)} avg ${avg}`);

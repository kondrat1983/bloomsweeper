#!/usr/bin/env node
// node tools/generate.mjs <profile> <pageDir> [--seed N] [--tries N] [--title "..."]
// Profiles: teach-rabbit, teach-fox, small, medium, large (see src/gen/generate.mjs).
import { resolve } from 'node:path';
import { generatePage, PROFILES } from '../src/gen/generate.mjs';

const [profile, out, ...rest] = process.argv.slice(2);
if (!profile || !out || !PROFILES[profile]) {
  console.error(`usage: tools/generate <${Object.keys(PROFILES).join('|')}> <pageDir> [--seed N] [--tries N] [--title "..."]`);
  process.exit(2);
}
const opt = (name, def) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : def; };
const r = generatePage({ profile, out: resolve(out), seed: Number(opt('seed', 1)), maxTries: Number(opt('tries', 20)), title: opt('title'), log: rest.includes('--verbose') ? (m) => console.error(m) : undefined });
console.log(JSON.stringify(r));
process.exit(r.ok ? 0 : 1);

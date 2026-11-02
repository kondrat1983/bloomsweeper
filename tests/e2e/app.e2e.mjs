// End-to-end checks of the play screen (index.html) in Chromium at iPhone size.
// Run: npm run test:e2e. Skips when Playwright is not installed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium = null;
try { ({ chromium } = require('playwright')); } catch { /* not installed */ }
const skip = chromium ? false : 'playwright not installed';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const PAGE = JSON.parse(await readFile(join(ROOT, 'pages/garden/sample-p3/page.json'), 'utf8'));
const blooms = Object.entries(PAGE.solution).filter(([, v]) => v === 'BLOOM').map(([id]) => id);
const greens = Object.entries(PAGE.solution).filter(([, v]) => v === 'GREEN').map(([id]) => id);
const creatureCells = new Set(PAGE.creatures.map((k) => k.cell));
const plainGreen = greens.find((id) => !creatureCells.has(id) && PAGE.cells.find((c) => c.id === id).kind === 'flower');

let server, base, browser;
before(async () => {
  if (skip) return;
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
    try {
      const body = await readFile(join(ROOT, path || 'index.html'));
      res.writeHead(200, { 'content-type': TYPES[extname(path || 'index.html')] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { if (browser) await browser.close(); if (server) server.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base);
  await page.waitForSelector('#cells path');
  return { ctx, page, errors };
}
async function tool(page, t) {
  await page.click(`[data-tool="${t}"]`);
  // the tool tip covers the bottom of the page; a player would pan, the test closes it
  if (t !== 'hint' && await page.locator('#msg [data-act="close"]').isVisible()) await page.click('#msg [data-act="close"]');
}
const tapCell = (page, id) => page.locator(`path#${id}`).click({ force: true });

test('play screen loads the page with all cells and the bloom counter', { skip }, async () => {
  const { ctx, page, errors } = await open();
  assert.equal(await page.locator('#cells path').count(), PAGE.cells.length);
  assert.equal(await page.textContent('#counterText'), `0 / ${blooms.length}`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('finding a creature adds its badge and updates the tray', { skip }, async () => {
  const { ctx, page } = await open();
  const k = PAGE.creatures.find((c) => !c.reveal.length && c.type === 'bee');
  await tool(page, 'find');
  await page.locator(`[data-creature="${k.id}"]`).click({ force: true });
  assert.ok((await page.locator('#ov-badges > *').count()) > 0, 'badge drawn');
  assert.match(await page.textContent('#msg'), /Bee found/);
  await ctx.close();
});

test('a wrong mark leaves a blot; a correct mark washes it and fills the cell', { skip }, async () => {
  const { ctx, page } = await open();
  await tool(page, 'bloom');
  await tapCell(page, plainGreen);
  assert.equal(await page.locator('[data-blot]').count(), 1);
  await tapCell(page, blooms[0]);
  assert.equal(await page.locator('[data-blot]').count(), 0);
  assert.equal(await page.getAttribute(`path#${blooms[0]}`, 'data-mark'), 'BLOOM');
  assert.equal(await page.textContent('#counterText'), `1 / ${blooms.length}`);
  await ctx.close();
});

test('progress survives a reload', { skip }, async () => {
  const { ctx, page } = await open();
  await tool(page, 'bloom');
  await tapCell(page, blooms[1]);
  await page.reload();
  await page.waitForSelector('#cells path');
  assert.equal(await page.getAttribute(`path#${blooms[1]}`, 'data-mark'), 'BLOOM');
  await ctx.close();
});

test('hint explains a step and never marks a cell', { skip }, async () => {
  const { ctx, page } = await open();
  const before = await page.locator('path[data-mark="BLOOM"], path[data-mark="GREEN"]').count();
  await tool(page, 'hint');
  assert.match(await page.textContent('#msg'), /Hint\./);
  assert.equal(await page.locator('path[data-mark="BLOOM"], path[data-mark="GREEN"]').count(), before);
  await ctx.close();
});

test('all blooms marked: mark the rest green completes the page', { skip }, async () => {
  const { ctx, page } = await open();
  await tool(page, 'bloom');
  for (const id of blooms) await tapCell(page, id);
  await page.click('[data-act="rest"]');
  assert.match(await page.textContent('#msg'), /Page complete/);
  assert.equal(await page.locator('path[data-mark=""]').count(), 0);
  await ctx.close();
});

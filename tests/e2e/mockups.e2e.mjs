// End-to-end checks of the static mock-ups in Chromium (Playwright).
// Run: npm run test:e2e. Skips when Playwright is not installed (CI has no browser yet).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium = null;
try { ({ chromium } = require('playwright')); } catch { /* not installed */ }
const url = (f) => 'file://' + fileURLToPath(new URL(`../../mockup/${f}`, import.meta.url));
const skip = chromium ? false : 'playwright not installed';

async function open(file) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url(file));
  return { browser, page, errors };
}
const stepOf = (page) => page.evaluate(() => [...document.querySelectorAll('.dots i')].findIndex((i) => i.classList.contains('on')));

test('play screen mock-up: three screens, no errors, no sideways scroll', { skip }, async () => {
  const { browser, page, errors } = await open('index.html');
  assert.equal(await page.locator('.screen').count(), 3);
  assert.equal(await page.locator('.tools').first().locator('.tool').count(), 6);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const small = await page.evaluate(() => [...document.querySelectorAll('.screen *')]
    .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((el) => !el.closest('svg'))
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 17).length);
  assert.equal(small, 0, 'all UI text is at least 17 px');
  assert.deepEqual(errors, []);
  await browser.close();
});

test('tutorial: every step advances, wrong mark leaves a blot, skip and replay work', { skip }, async () => {
  const { browser, page, errors } = await open('tutorial.html');
  assert.equal(await stepOf(page), 0);
  await page.click('[data-act="next"]');
  await page.click('path[data-id="d"]');
  assert.equal(await stepOf(page), 1, 'a wrong tap does not advance');
  await page.click('[data-id="bee"]');
  assert.equal(await stepOf(page), 2);
  await page.click('[data-act="next"]');
  await page.click('[data-tool="bloom"]');
  await page.click('path[data-id="e"]');
  assert.equal(await page.locator('.blot').count(), 1, 'wrong mark shows a blot');
  await page.click('path[data-id="a"]');
  assert.equal(await page.locator('.blot').count(), 0, 'next correct mark washes the blot');
  await page.click('path[data-id="c"]');
  assert.equal(await stepOf(page), 5);
  await page.click('[data-tool="green"]');
  for (const id of ['d', 'e', 'g']) await page.click(`path[data-id="${id}"]`);
  await page.click('[data-id="bee"]');
  assert.equal(await stepOf(page), 7);
  await page.click('[data-tool="paint"]');
  await page.click('#auto');
  assert.equal(await stepOf(page), 9);
  await page.click('[data-act="next"]');
  assert.equal(await page.locator('.newcard').count(), 1, 'last card explains a new creature');
  await page.click('[data-act="replay"]');
  assert.equal(await stepOf(page), 0);
  await page.click('#skip');
  assert.equal(await page.locator('.newcard').count(), 1, 'skip lands on the last card');
  assert.deepEqual(errors, []);
  await browser.close();
});

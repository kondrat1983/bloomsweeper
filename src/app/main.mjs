// Bloomsweeper play screen. Rules and state live in src/game and src/rules; this file draws and listens.
import { Game } from '../game/state.mjs';
import { saveGame, loadGame } from '../game/save.mjs';
import { nextHint } from '../game/hint.mjs';
import { HIT_R } from '../limits.mjs';

const NS = 'http://www.w3.org/2000/svg';
const PAGE_W = 1200, PAGE_H = 1600;
const SPRING = { flowers: ['#f2a7b8', '#f6c27a', '#c7a8e0', '#f08f7a', '#9cc7ec', '#f7dc7c'], leaves: ['#a9cf94', '#7fb17a', '#c9dc9a', '#8fbfa6'] };
const TYPE_NAME = { bee: 'Bee', rabbit: 'Rabbit', fox: 'Fox' };
const FOUND_TEXT = {
  bee: 'Its number counts the blooming shapes it touches.',
  rabbit: 'Rabbits eat flowers: its leaf and everything it touches stay green.',
  fox: 'Foxes keep a shady den: nothing blooms within two steps.',
};
const TOOL_TEXT = {
  find: 'Find the creatures hiding in the garden. Tap one when you spot it.',
  bloom: 'Tap a shape that must bloom.',
  green: 'Tap a shape that stays green.',
  paint: 'Pick a colour and tap a marked shape.',
  eraser: 'Tap a shape to clear its mark.',
};
const TRAY_ICON = {
  bee: '<svg viewBox="0 0 32 32" fill="#fffaf0" stroke="#1f1d1a" stroke-width="1.6" aria-hidden="true"><ellipse cx="12" cy="10" rx="5" ry="3.2" transform="rotate(-25 12 10)"/><ellipse cx="18" cy="9.5" rx="5" ry="3.2" transform="rotate(20 18 9.5)"/><ellipse cx="15" cy="18" rx="9" ry="6"/><path d="M12 12.5q-1.6 5.5 0 11M17 12.3q-1.6 5.7 0 11.4"/><circle cx="25.5" cy="17" r="3.4"/></svg>',
  rabbit: '<svg viewBox="0 0 32 32" fill="#fffaf0" stroke="#1f1d1a" stroke-width="1.6" aria-hidden="true"><ellipse cx="13" cy="21" rx="9" ry="7"/><circle cx="22" cy="15" r="5"/><ellipse cx="20.5" cy="6" rx="2" ry="6" transform="rotate(-12 20.5 6)"/><ellipse cx="25" cy="6.5" rx="2" ry="6" transform="rotate(14 25 6.5)"/><circle cx="4" cy="20" r="2.4"/></svg>',
  fox: '<svg viewBox="0 0 32 32" fill="#fffaf0" stroke="#1f1d1a" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5 9l3-7 5 5h6l5-5 3 7q-2 12-11 14Q7 21 5 9z"/><path d="M12 14l2 1M20 14l-2 1M15 19h2"/></svg>',
  hidden: '<svg viewBox="0 0 32 32" fill="none" stroke="#6b655c" stroke-width="1.8" stroke-dasharray="3 3" aria-hidden="true"><circle cx="16" cy="16" r="12"/></svg>',
};

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (parent) parent.appendChild(e); return e; };
const storage = (() => { try { return window.localStorage; } catch { return null; } })();

const params = new URLSearchParams(location.search);
const PAGE = params.get('page') || 'garden/sample-p3';

let game, svg, cellPaths = new Map(), centroids = new Map(), layers = {};
let tool = 'find', colour = SPRING.flowers[0], paletteTab = 'flowers';
let msgTimer = null;

async function boot() {
  const wrap = $('wrap');
  try {
    const [pageJson, svgText] = await Promise.all([
      fetch(`pages/${PAGE}/page.json`).then((r) => { if (!r.ok) throw new Error(`page.json ${r.status}`); return r.json(); }),
      fetch(`pages/${PAGE}/page.svg`).then((r) => { if (!r.ok) throw new Error(`page.svg ${r.status}`); return r.text(); }),
    ]);
    const saved = storage ? loadGame(storage, PAGE) : null;
    game = new Game(pageJson, saved);
    mountSvg(svgText, pageJson);
  } catch (e) {
    wrap.innerHTML = `<p class="loading">Could not open this page (${e.message}).</p>`;
    return;
  }
  $('title').textContent = PAGE.split('/')[0].replace(/^\w/, (c) => c.toUpperCase());
  buildPalette();
  bindTools();
  setupPanZoom();
  setTool('find', true);
  renderAll();
  if (game.isComplete()) showComplete();
}

function mountSvg(svgText, page) {
  const stage = $('stage');
  stage.innerHTML = svgText;
  svg = stage.querySelector('svg');
  svg.setAttribute('width', PAGE_W);
  svg.setAttribute('height', PAGE_H);
  const defs = el('defs', {}, null);
  defs.innerHTML = '<pattern id="bsBloom" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fbe1e7"/><circle cx="5" cy="5" r="2" fill="#c9506f"/></pattern><pattern id="bsGreen" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e3efd8"/><line x1="0" y1="0" x2="0" y2="7" stroke="#6f9b5f" stroke-width="1.6"/></pattern>';
  svg.insertBefore(defs, svg.firstChild);
  for (const c of page.cells) centroids.set(c.id, c.centroid);
  for (const p of svg.querySelectorAll('#cells path')) cellPaths.set(p.id, p);
  const top = svg.querySelector('#deco-top');
  if (top) top.setAttribute('pointer-events', 'none');
  layers.hint = el('g', { id: 'ov-hint', 'pointer-events': 'none' }, svg);
  layers.blots = el('g', { id: 'ov-blots' }, svg);
  layers.badges = el('g', { id: 'ov-badges', 'pointer-events': 'none' }, svg);
  layers.hits = el('g', { id: 'ov-hits' }, svg);
  for (const k of game.creatures) {
    const [x, y] = centroids.get(k.cell);
    el('circle', { cx: x, cy: y, r: HIT_R, fill: 'transparent', 'data-creature': k.id }, layers.hits);
  }
}

// ---------- rendering ----------
function renderCells() {
  for (const [id, p] of cellPaths) {
    const paint = game.paintOf(id), m = game.markOf(id);
    p.style.fill = paint || (m === 'BLOOM' ? 'url(#bsBloom)' : m === 'GREEN' ? 'url(#bsGreen)' : '#fffaf0');
    p.dataset.mark = m || '';
  }
}
function renderCreatures() {
  for (const g of svg.querySelectorAll('#creatures > g')) {
    const k = game.creature(g.id);
    g.style.display = k && game.isHidden(k) ? 'none' : '';
  }
  for (const c of layers.hits.children) {
    const k = game.creature(c.dataset.creature);
    c.style.pointerEvents = tool === 'find' && !game.isHidden(k) ? 'all' : 'none';
  }
  layers.badges.replaceChildren();
  for (const k of game.creatures) {
    if (!game.isFound(k.id)) continue;
    const [x, y0] = centroids.get(k.cell), y = y0 - 52;
    if (k.type === 'bee') {
      let d = ''; for (let i = 0; i < 6; i++) { const t = (i * Math.PI) / 3 + Math.PI / 6; d += `${i ? 'L' : 'M'}${(x + 24 * Math.cos(t)).toFixed(1)} ${(y + 24 * Math.sin(t)).toFixed(1)}`; }
      el('path', { d: d + 'Z', fill: '#f3e6c4', stroke: '#b8913f', 'stroke-width': 3 }, layers.badges);
      const t = el('text', { x, y: y + 10, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 700, 'font-family': 'Helvetica, Arial, sans-serif', fill: '#1f1d1a' }, layers.badges);
      t.textContent = String(k.n);
    } else {
      el('circle', { cx: x, cy: y, r: 23, fill: '#f3e6c4', stroke: '#b8913f', 'stroke-width': 3 }, layers.badges);
      const g = el('g', { transform: `translate(${x} ${y}) scale(1.15)`, fill: '#1f1d1a' }, layers.badges);
      g.innerHTML = k.type === 'rabbit' ? '<circle cx="0" cy="5" r="6"/><ellipse cx="-3" cy="-6" rx="2.2" ry="7"/><ellipse cx="3" cy="-6" rx="2.2" ry="7"/>' : '<ellipse cx="0" cy="5" rx="6" ry="5"/><circle cx="-7" cy="-3" r="2.6"/><circle cx="-2.5" cy="-8" r="2.6"/><circle cx="2.5" cy="-8" r="2.6"/><circle cx="7" cy="-3" r="2.6"/>';
    }
  }
}
function renderBlots() {
  layers.blots.replaceChildren();
  for (const id of game.blots()) {
    const [x, y] = centroids.get(id);
    const pts = [];
    for (let i = 0; i < 18; i++) { const t = (i / 18) * 2 * Math.PI, r = 20 * (1 + 0.28 * Math.sin(3 * t + 0.4) + 0.16 * Math.sin(7 * t + 1.3)); pts.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z';
    el('path', { d, fill: '#1f1d1a', opacity: 0.86, 'data-blot': id }, layers.blots);
    el('circle', { cx: x + 28, cy: y - 12, r: 3.6, fill: '#1f1d1a', opacity: 0.86, 'pointer-events': 'none' }, layers.blots);
  }
}
function renderTray() {
  const tray = $('tray');
  const types = ['bee', 'rabbit', 'fox'].filter((t) => game.creatures.some((k) => k.type === t));
  let html = '';
  for (const t of types) {
    const vis = game.visibleCreatures().filter((k) => k.type === t);
    if (!vis.length) continue;
    const found = vis.filter((k) => game.isFound(k.id)).length;
    html += `<div class="chip${found === vis.length ? ' done' : ''}">${TRAY_ICON[t]}<span>${found} of ${vis.length}</span></div>`;
  }
  const hidden = game.creatures.filter((k) => game.isHidden(k)).length;
  if (hidden) html += `<div class="chip hidden">${TRAY_ICON.hidden}<span>${hidden} hidden</span></div>`;
  tray.innerHTML = html;
}
function renderCounter() {
  $('counterText').textContent = `${game.bloomsMarked()} / ${game.total}`;
  $('counter').classList.toggle('done', game.bloomsMarked() === game.total);
}
function renderAll() { renderCells(); renderCreatures(); renderBlots(); renderTray(); renderCounter(); }

// ---------- messages ----------
function say(html, { buttons = [], sticky = false } = {}) {
  const m = $('msg');
  clearTimeout(msgTimer);
  m.innerHTML = `<p>${html}</p>` + buttons.map((b) => `<button class="btn" data-act="${b.act}">${b.label}</button>`).join('') + (sticky ? '' : '<button class="close" data-act="close" aria-label="Close">×</button>');
  m.classList.add('show');
  for (const b of m.querySelectorAll('[data-act]')) b.onclick = () => onMessageAction(b.dataset.act);
  if (!sticky && !buttons.length) msgTimer = setTimeout(() => m.classList.remove('show'), 6000);
}
function hush() { $('msg').classList.remove('show'); }
function onMessageAction(act) {
  if (act === 'close') return hush();
  if (act === 'hint') return showHint();
  if (act === 'rest') { const n = game.markRestGreen(); persist(); renderAll(); say(`<b>${n} shapes marked green.</b>`); return afterMark(); }
}

// ---------- actions ----------
function persist() { if (storage) saveGame(storage, PAGE, game.toJSON()); }

function onTap(target) {
  clearHint();
  if (!target) return;
  if (target.blot) { game.washBlot(target.blot); persist(); return renderBlots(); }
  if (tool === 'find') {
    if (!target.creature) return;
    const r = game.find(target.creature);
    if (r.ok) {
      persist(); renderAll();
      say(`<b>${TYPE_NAME[r.creature.type]} found.</b> ${FOUND_TEXT[r.creature.type]}`);
    }
    return;
  }
  const cell = target.cell;
  if (!cell) return;
  if (tool === 'bloom' || tool === 'green') {
    const r = game.mark(cell, tool === 'bloom' ? 'BLOOM' : 'GREEN');
    persist(); renderAll();
    if (r.result === 'blot') {
      if (game.shouldOfferHint()) say('Three blots in a row. Want a hint?', { buttons: [{ act: 'hint', label: 'Show hint' }] });
      else say('<b>An ink blot.</b> That one does not fit the clues. It washes away with your next good mark.');
    } else if (r.result === 'ok') afterMark();
    return;
  }
  if (tool === 'eraser') { game.erase(cell); persist(); renderAll(); return; }
  if (tool === 'paint') {
    const r = game.paint(cell, colour);
    if (!r.ok) return say('Mark this shape first, then paint it.');
    persist(); renderAll();
    if (r.revealed.length) revealed(r.revealed);
  }
}
function revealed(ids) {
  const k = game.creature(ids[0]);
  say(`<b>Painting revealed a ${k.type}.</b> ${FOUND_TEXT[k.type]}`);
}
function afterMark() {
  if (game.isComplete()) return showComplete();
  if (game.canMarkRestGreen()) say(`<b>All ${game.total} blooms found.</b> Everything else is green.`, { buttons: [{ act: 'rest', label: 'Mark the rest green' }] });
}
function showComplete() {
  saveAlbum();
  say('<b>Page complete.</b> Solved by logic. Now paint it your way: it is saved in your album.', {});
}
function saveAlbum() {
  if (!storage) return;
  try { storage.setItem(`bloomsweeper:v1:album:${PAGE}`, JSON.stringify({ at: Date.now(), painted: game.toJSON().painted })); } catch { /* storage full or blocked */ }
}

// ---------- hint ----------
function clearHint() { if (layers.hint) layers.hint.replaceChildren(); }
function showHint() {
  clearHint();
  const h = nextHint(game);
  for (const id of h.cells) {
    const p = cellPaths.get(id);
    if (p) el('path', { d: p.getAttribute('d'), fill: 'none', stroke: '#b8913f', 'stroke-width': 6, 'stroke-dasharray': '12 8', 'stroke-linecap': 'round' }, layers.hint);
  }
  const src = h.source && game.creature(h.source);
  if (src) { const [x, y] = centroids.get(src.cell); el('circle', { cx: x, cy: y, r: 40, fill: 'none', stroke: '#b8913f', 'stroke-width': 4 }, layers.hint); }
  say(`<b>Hint.</b> ${h.text}`);
  if (h.cells.length) focusOn(h.cells);
}

// ---------- tools and palette ----------
function setTool(t, quiet = false) {
  if (t === 'hint') return showHint();
  tool = t;
  for (const b of document.querySelectorAll('.tool')) b.classList.toggle('on', b.dataset.tool === t);
  $('palette').hidden = t !== 'paint';
  renderCreatures();
  if (!quiet) say(TOOL_TEXT[t]);
}
function bindTools() {
  for (const b of document.querySelectorAll('.tool')) b.onclick = () => setTool(b.dataset.tool);
  $('back').onclick = () => { location.href = 'mockup/'; };
  $('menu').onclick = () => say('Menu, album and settings arrive in the next build.');
}
function buildPalette() {
  const draw = () => {
    const list = paletteTab === 'flowers' ? SPRING.flowers : SPRING.leaves;
    $('swatches').innerHTML = list.map((c) => `<button class="sw${c === colour ? ' on' : ''}" data-c="${c}" aria-label="Colour ${c}"><span style="background:${c}"></span></button>`).join('');
    for (const s of $('swatches').children) s.onclick = () => { colour = s.dataset.c; draw(); };
    $('palFlowers').classList.toggle('on', paletteTab === 'flowers');
    $('palLeaves').classList.toggle('on', paletteTab === 'leaves');
  };
  $('palFlowers').onclick = () => { paletteTab = 'flowers'; colour = SPRING.flowers[0]; draw(); };
  $('palLeaves').onclick = () => { paletteTab = 'leaves'; colour = SPRING.leaves[0]; draw(); };
  $('auto').onclick = () => { const r = game.autoPaint(SPRING); persist(); renderAll(); if (r.length) revealed(r); };
  draw();
}

// ---------- pan, zoom, tap, long press ----------
const view = { s: 1, x: 0, y: 0, fit: 1 };
function applyView() { $('stage').style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; }
// Keeps the page on screen: centred when smaller than the view, at most 60 px of margin when larger.
function clampView() {
  const w = $('wrap').clientWidth, h = $('wrap').clientHeight, pw = PAGE_W * view.s, ph = PAGE_H * view.s, m = 60;
  view.x = pw <= w ? (w - pw) / 2 : Math.min(m, Math.max(w - pw - m, view.x));
  view.y = ph <= h ? (h - ph) / 2 : Math.min(m, Math.max(h - ph - m, view.y));
}
function zoomAt(cx, cy, factor) {
  const s = Math.min(view.fit * 5, Math.max(view.fit, view.s * factor));
  const k = s / view.s;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.s = s;
  clampView(); applyView(); showZoom();
}
let zoomTimer = null;
function showZoom() {
  const z = $('zoom');
  z.hidden = false;
  z.textContent = `${Math.round((view.s / view.fit) * 100)}%`;
  clearTimeout(zoomTimer);
  zoomTimer = setTimeout(() => { z.hidden = true; }, 900);
}
function focusOn(ids) {
  const pts = ids.map((id) => centroids.get(id)).filter(Boolean);
  if (!pts.length) return;
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const w = $('wrap').clientWidth, h = $('wrap').clientHeight;
  view.x = w / 2 - cx * view.s; view.y = h / 2 - cy * view.s;
  clampView(); applyView();
}
function targetAt(clientX, clientY) {
  const e = document.elementFromPoint(clientX, clientY);
  if (!e || !svg.contains(e)) return null;
  const blot = e.closest('[data-blot]');
  if (blot) return { blot: blot.dataset.blot };
  const hit = e.closest('[data-creature]');
  if (hit) { const k = game.creature(hit.dataset.creature); return { creature: k.id, cell: k.cell }; }
  const cg = e.closest('#creatures > g');
  if (cg) return { creature: cg.id, cell: cg.dataset.cell };
  const p = e.closest('#cells path');
  if (p) return { cell: p.id };
  return null;
}
function showNeighbours(cell) {
  clearHint();
  const n = game.page.adjacency[cell] || [];
  for (const id of [cell, ...n]) {
    const p = cellPaths.get(id);
    if (p) el('path', { d: p.getAttribute('d'), fill: 'none', stroke: id === cell ? '#1f1d1a' : '#b8913f', 'stroke-width': id === cell ? 4 : 6 }, layers.hint);
  }
  say(`This shape touches <b>${n.length}</b> ${n.length === 1 ? 'shape' : 'shapes'}.`);
}
function setupPanZoom() {
  const wrap = $('wrap');
  const fit = () => { view.fit = wrap.clientWidth / PAGE_W; if (view.s < view.fit || !view.ready) { view.s = view.fit; view.x = 0; view.y = 0; view.ready = true; } clampView(); applyView(); };
  fit();
  window.addEventListener('resize', fit);
  const pts = new Map();
  let start = null, moved = false, longTimer = null, longDone = false, pinch = null;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.msg')) return;
    wrap.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      start = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      moved = false; longDone = false;
      clearTimeout(longTimer);
      longTimer = setTimeout(() => { const t = targetAt(e.clientX, e.clientY); if (!moved && t && t.cell) { longDone = true; showNeighbours(t.cell); } }, 500);
    } else if (pts.size === 2) {
      clearTimeout(longTimer); moved = true;
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = wrap.getBoundingClientRect();
    if (pts.size === 1 && start) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) > 8) { moved = true; clearTimeout(longTimer); }
      if (moved) { view.x = start.vx + dx; view.y = start.vy + dy; clampView(); applyView(); }
    } else if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      view.x += mx - pinch.mx; view.y += my - pinch.my;
      zoomAt(mx - r.left, my - r.top, d / pinch.d);
      pinch = { d, mx, my };
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    const single = pts.size === 1;
    pts.delete(e.pointerId);
    clearTimeout(longTimer);
    if (single && !moved && !longDone && e.type === 'pointerup') onTap(targetAt(e.clientX, e.clientY));
    if (pts.size < 2) pinch = null;
    if (pts.size === 0) start = null;
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('wheel', (e) => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
}

boot();

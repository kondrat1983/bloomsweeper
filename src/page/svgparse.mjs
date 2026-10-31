import { CREATURE_TYPES } from '../rules/creatures.mjs';

export const VIEWBOX = '0 0 1200 1600';

function attr(s, name) {
  const m = s.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return m ? m[1] : null;
}

// Reads page.svg as written by hand or by the artist. The format is machine-checked, not a general SVG parser.
export function parsePage(svgText) {
  const errors = [];
  const root = svgText.match(/<svg\b([^>]*)>/);
  if (!root) return { cells: [], creatures: [], totalBlooms: null, errors: ['no <svg> root element'] };
  if (attr(root[1], 'viewBox') !== VIEWBOX) errors.push(`viewBox must be "${VIEWBOX}"`);
  const bl = attr(root[1], 'data-blooms');
  const totalBlooms = bl === null ? null : Number(bl);
  if (bl !== null && !Number.isInteger(totalBlooms)) errors.push('data-blooms must be an integer');

  const block = svgText.match(/<g\s+id="cells"[^>]*>([\s\S]*?)<\/g>/);
  if (!block) errors.push('missing <g id="cells">');
  const cells = [];
  const seenCells = new Set();
  for (const m of (block ? block[1] : '').matchAll(/<path\b([^>]*)>/g)) {
    const id = attr(m[1], 'id'), kind = attr(m[1], 'data-kind'), d = attr(m[1], 'd');
    if (!/^c\d{3}$/.test(id ?? '')) errors.push(`bad cell id "${id}"`);
    if (seenCells.has(id)) errors.push(`duplicate cell id ${id}`);
    seenCells.add(id);
    if (!['flower', 'leaf'].includes(kind)) errors.push(`cell ${id}: data-kind must be flower or leaf`);
    if (d === null) errors.push(`cell ${id}: missing d`);
    cells.push({ id, kind, d });
  }

  const creatures = [];
  for (const m of svgText.matchAll(/<g\s+([^>]*)>/g)) {
    const id = attr(m[1], 'id');
    if (!id || !/^k\d{2}$/.test(id)) continue;
    const type = attr(m[1], 'data-type');
    const cell = attr(m[1], 'data-cell');
    const nRaw = attr(m[1], 'data-n');
    const reveal = attr(m[1], 'data-reveal');
    if (!CREATURE_TYPES.includes(type)) errors.push(`creature ${id}: unknown data-type "${type}"`);
    if (!/^c\d{3}$/.test(cell ?? '')) errors.push(`creature ${id}: bad data-cell`);
    let n = null;
    if (type === 'bee') {
      n = nRaw === null ? NaN : Number(nRaw);
      if (!Number.isInteger(n) || n < 0) errors.push(`creature ${id}: bee needs data-n, an integer >= 0`);
    }
    const rv = reveal === null ? [] : reveal.split(',').map((s) => s.trim()).filter(Boolean);
    for (const r of rv) if (!/^c\d{3}$/.test(r)) errors.push(`creature ${id}: bad reveal id "${r}"`);
    creatures.push({ id, type, cell, n, reveal: rv });
  }
  return { cells, creatures, totalBlooms, errors };
}

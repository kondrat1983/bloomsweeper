import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parsePage } from './svgparse.mjs';
import { parseClosedPolygon, area, centroid, bbox } from './geometry.mjs';
import { computeAdjacency, applyOverrides } from './graph.mjs';
import { BLOOM, GREEN } from '../rules/cells.mjs';

// Loads pages/<chapter>/<id>/ into indexed form. Problems go to model.errors; nothing throws.
export function loadPage(dir) {
  const errors = [];
  const model = {
    id: basename(dir), dir, svgText: '', cells: [], index: new Map(), adjacency: [],
    creatures: [], totalBlooms: null, solution: null, errors,
  };
  const svgPath = join(dir, 'page.svg');
  if (!existsSync(svgPath)) { errors.push('page.svg not found'); return model; }
  model.svgText = readFileSync(svgPath, 'utf8');
  const parsed = parsePage(model.svgText);
  errors.push(...parsed.errors);
  if (errors.length) return model;

  for (const c of parsed.cells) {
    try {
      const polygon = parseClosedPolygon(c.d);
      model.cells.push({ id: c.id, kind: c.kind, polygon, area: area(polygon), centroid: centroid(polygon), bbox: bbox(polygon) });
    } catch (e) {
      errors.push(`cell ${c.id}: ${e.message}`);
    }
  }
  if (errors.length) return model;
  model.cells.forEach((c, i) => model.index.set(c.id, i));
  model.totalBlooms = parsed.totalBlooms;

  const computed = computeAdjacency(model.cells.map((c) => c.polygon));
  const overridesPath = join(dir, 'page.overrides.json');
  const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};
  try {
    model.adjacency = applyOverrides(computed, model.index, overrides);
  } catch (e) {
    errors.push(`page.overrides.json: ${e.message}`);
  }

  for (const k of parsed.creatures) {
    const cell = model.index.get(k.cell);
    if (cell === undefined) { errors.push(`creature ${k.id}: unknown cell ${k.cell}`); continue; }
    const reveal = [];
    for (const r of k.reveal) {
      const ri = model.index.get(r);
      if (ri === undefined) errors.push(`creature ${k.id}: unknown reveal cell ${r}`);
      else reveal.push(ri);
    }
    model.creatures.push({ id: k.id, type: k.type, n: k.n, cell, reveal });
  }

  const solPath = join(dir, 'page.solution.json');
  if (existsSync(solPath)) {
    const raw = JSON.parse(readFileSync(solPath, 'utf8'));
    const sol = new Uint8Array(model.cells.length);
    let ok = true;
    model.cells.forEach((c, i) => {
      const v = raw[c.id];
      if (v === 'BLOOM') sol[i] = BLOOM;
      else if (v === 'GREEN') sol[i] = GREEN;
      else { ok = false; errors.push(`page.solution.json: cell ${c.id} must be BLOOM or GREEN`); }
    });
    if (ok) model.solution = sol;
  }
  return model;
}

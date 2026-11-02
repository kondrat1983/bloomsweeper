import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadPage } from './model.mjs';
import { analyze } from './analyze.mjs';
import { buildPageJson } from './pagejson.mjs';
import { creatureRule } from '../rules/creatures.mjs';
import { BLOOM, GREEN } from '../rules/cells.mjs';
import { countSolutions } from '../solver/count.mjs';
import { MIN_CELL_PX, HIT_R, GAP_TOUCH_MAX, GAP_APART_MIN } from '../limits.mjs';
import { narrowestWidth, distance } from './geometry.mjs';

// The gate (SPEC section 5). Returns { ok, errors, warnings, report }.
export function validatePage(dir) {
  const model = loadPage(dir);
  const errors = [...model.errors];
  const warnings = [];
  if (errors.length) return { ok: false, errors, warnings, report: null };

  for (const c of model.cells) {
    const w = Math.min(c.bbox.width, c.bbox.height) < MIN_CELL_PX ? Math.min(c.bbox.width, c.bbox.height) : narrowestWidth(c.polygon);
    if (w < MIN_CELL_PX) errors.push(`cell ${c.id} is ${w.toFixed(1)} px across at its narrowest, minimum ${MIN_CELL_PX}`);
  }
  for (let i = 0; i < model.creatures.length; i++) {
    for (let j = i + 1; j < model.creatures.length; j++) {
      const a = model.creatures[i], b = model.creatures[j];
      const [ax, ay] = model.cells[a.cell].centroid, [bx, by] = model.cells[b.cell].centroid;
      const d = Math.hypot(ax - bx, ay - by);
      if (d < 2 * HIT_R) errors.push(`tap areas of ${a.id} and ${b.id} overlap (${d.toFixed(1)} px apart, need ${2 * HIT_R})`);
    }
  }
  for (let i = 0; i < model.cells.length; i++) {
    for (let j = i + 1; j < model.cells.length; j++) {
      const A = model.cells[i], B = model.cells[j];
      if (A.bbox.x0 - B.bbox.x1 > GAP_APART_MIN || B.bbox.x0 - A.bbox.x1 > GAP_APART_MIN || A.bbox.y0 - B.bbox.y1 > GAP_APART_MIN || B.bbox.y0 - A.bbox.y1 > GAP_APART_MIN) continue;
      const d = distance(A.polygon, B.polygon);
      if (d > GAP_TOUCH_MAX && d < GAP_APART_MIN) warnings.push(`cells ${A.id} and ${B.id} are ${d.toFixed(1)} px apart: touching should be at most ${GAP_TOUCH_MAX} px, apart at least ${GAP_APART_MIN} px`);
    }
  }
  for (const k of model.creatures) {
    if (model.cells[k.cell].kind !== 'leaf') errors.push(`creature ${k.id} sits on flower ${model.cells[k.cell].id} (creatures sit on leaves)`);
  }
  if (!model.solution) {
    errors.push('missing page.solution.json');
    return { ok: false, errors, warnings, report: null };
  }

  const n = model.cells.length;
  const sol = model.solution;
  const rules = model.creatures.map((k) => creatureRule(k, model.adjacency));
  for (const r of rules) {
    for (const c of r.green) {
      if (sol[c] !== GREEN) errors.push(`solution: creature cell ${model.cells[c].id} must be GREEN`);
    }
    const blooms = r.constraint.cells.filter((c) => sol[c] === BLOOM).length;
    if (blooms !== r.constraint.bloom) errors.push(`solution breaks clue ${r.constraint.source}: ${blooms} blooms, clue says ${r.constraint.bloom}`);
  }
  const totalSol = sol.reduce((s, v) => s + (v === BLOOM ? 1 : 0), 0);
  if (model.totalBlooms !== null && totalSol !== model.totalBlooms) {
    errors.push(`solution has ${totalSol} blooms, page total says ${model.totalBlooms}`);
  }

  const greenCells = rules.flatMap((r) => r.green);
  const cnt = countSolutions({
    cellCount: n,
    constraints: rules.map((r) => r.constraint),
    total: model.totalBlooms,
    greenCells,
  });
  if (cnt.count === 0) errors.push('no solution satisfies the clues');
  else if (cnt.count > 1) errors.push('solution is not unique: at least 2 solutions satisfy the clues');

  const a = analyze(model);
  for (const id of a.uselessReveals) errors.push(`creature ${id} is revealed after every cell is solved, so its clue is never needed`);
  for (const id of a.neverRevealed) errors.push(`creature ${id} never appears: its reveal cells are never all solved`);
  if (a.error) {
    errors.push(`stage ${a.error.stage}: contradiction while solving: ${a.error.message}`);
  } else if (!a.allDetermined) {
    const open = model.cells.filter((_, i) => a.state[i] === 0).map((c) => c.id);
    errors.push(`stage ${a.finalStage}: needs a guess, ${open.length} cells undetermined (${open.slice(0, 8).join(', ')})`);
  } else {
    model.cells.forEach((c, i) => {
      if (a.state[i] !== sol[i]) errors.push(`deduction disagrees with the solution at ${c.id}`);
    });
  }

  const fresh = buildPageJson(model, a);
  const pjPath = join(dir, 'page.json');
  if (!existsSync(pjPath)) {
    errors.push('page.json missing: run tools/adjacency');
  } else {
    const old = JSON.parse(readFileSync(pjPath, 'utf8'));
    const { validated: _v1, ...oldRest } = old;
    const { validated: _v2, ...freshRest } = fresh;
    if (JSON.stringify(oldRest) !== JSON.stringify(freshRest)) errors.push('page.json is stale: run tools/adjacency');
  }

  const report = {
    id: model.id,
    cells: n,
    creatures: model.creatures.length,
    unique: cnt.count === 1,
    stages: a.stages.length,
    difficulty: a.difficulty,
  };
  return { ok: errors.length === 0, errors, warnings, report };
}

// Game state for one page. Pure logic, no DOM: used by the app and by tests.
// Marks are checked against the solution at once (GDD 4.6): a wrong mark leaves a blot.

export class Game {
  constructor(page, saved = null) {
    this.page = page;
    this.cellIds = page.cells.map((c) => c.id);
    this.index = new Map(this.cellIds.map((id, i) => [id, i]));
    this.kinds = new Map(page.cells.map((c) => [c.id, c.kind]));
    this.solution = page.solution;
    this.total = page.total ?? Object.values(page.solution).filter((v) => v === 'BLOOM').length;
    this.creatures = page.creatures;
    const s = saved || {};
    this._marks = new Map(Object.entries(s.marks || {}));
    this._paint = new Map(Object.entries(s.painted || {}));
    this._found = new Set(s.found || []);
    this._revealed = new Set(s.revealed || []);
    this._blots = new Set(s.blots || []);
    this._blotCount = s.blotCount || 0;
    this._streak = s.streak || 0;
    this.elapsed = s.elapsed || 0;
  }

  creature(id) { return this.creatures.find((k) => k.id === id) || null; }
  isHidden(k) { return Boolean(k.reveal && k.reveal.length) && !this._revealed.has(k.id); }
  visibleCreatures() { return this.creatures.filter((k) => !this.isHidden(k)); }
  isFound(id) { return this._found.has(id); }

  find(id) {
    const k = this.creature(id);
    if (!k) return { ok: false, reason: 'unknown' };
    if (this.isHidden(k)) return { ok: false, reason: 'hidden' };
    if (this._found.has(id)) return { ok: false, reason: 'already' };
    this._found.add(id);
    return { ok: true, creature: k };
  }

  markOf(id) { return this._marks.get(id) ?? null; }
  paintOf(id) { return this._paint.get(id) ?? null; }
  blots() { return [...this._blots]; }

  mark(id, value) {
    if (!this.index.has(id)) throw new Error(`unknown cell ${id}`);
    if (this._marks.has(id)) return { result: 'same' };
    if (this.solution[id] !== value) {
      this._blots.add(id);
      this._blotCount++;
      this._streak++;
      return { result: 'blot' };
    }
    this._marks.set(id, value);
    this._blots.clear();
    this._streak = 0;
    return { result: 'ok' };
  }

  washBlot(id) { this._blots.delete(id); }
  shouldOfferHint() { return this._streak >= 3; }

  erase(id) {
    this._marks.delete(id);
    this._paint.delete(id);
  }

  paint(id, color) {
    if (!this._marks.has(id)) return { ok: false, reason: 'unmarked' };
    this._paint.set(id, color);
    return { ok: true, revealed: this._checkReveals() };
  }

  autoPaint(palette) {
    let fi = 0, li = 0;
    for (const id of this.cellIds) {
      const m = this._marks.get(id);
      if (!m || this._paint.has(id)) continue;
      this._paint.set(id, m === 'BLOOM' ? palette.flowers[fi++ % palette.flowers.length] : palette.leaves[li++ % palette.leaves.length]);
    }
    return this._checkReveals();
  }

  // GDD 4.5: a revealed creature is found automatically once all its cells are painted.
  _checkReveals() {
    const out = [];
    for (const k of this.creatures) {
      if (!k.reveal || !k.reveal.length || this._revealed.has(k.id)) continue;
      if (k.reveal.every((c) => this._paint.has(c))) {
        this._revealed.add(k.id);
        this._found.add(k.id);
        out.push(k.id);
      }
    }
    return out;
  }

  bloomsMarked() { let n = 0; for (const v of this._marks.values()) if (v === 'BLOOM') n++; return n; }
  unknownCells() { return this.cellIds.filter((id) => !this._marks.has(id)); }
  canMarkRestGreen() { return this.bloomsMarked() === this.total && this.unknownCells().length > 0; }

  markRestGreen() {
    if (!this.canMarkRestGreen()) return 0;
    let n = 0;
    for (const id of this.unknownCells()) {
      if (this.solution[id] !== 'GREEN') continue;
      this._marks.set(id, 'GREEN');
      n++;
    }
    this._blots.clear();
    this._streak = 0;
    return n;
  }

  isComplete() { return this._marks.size === this.cellIds.length; }
  stats() { return { blots: this._blotCount, found: this._found.size, elapsed: this.elapsed }; }

  toJSON() {
    return {
      marks: Object.fromEntries(this._marks),
      painted: Object.fromEntries(this._paint),
      found: [...this._found],
      revealed: [...this._revealed],
      blots: [...this._blots],
      blotCount: this._blotCount,
      streak: this._streak,
      elapsed: this.elapsed,
    };
  }
}

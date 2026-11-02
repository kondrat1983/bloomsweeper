# Phase 3: page art

Canvas (private, Claude Design): https://claude.ai/artifact/Hzwen9jf48WH8totQzWxiJ (row "Phase 3 · Page art").

- `motifs/flowers/`: five-petal, daisy, bell, rosette, star in sizes s, m, l. `motifs/leaves/`: lens, oak,
  fern-tip, heart. Each file: centred viewBox, `#cell` (one closed outline, `M Q Z`) and `#deco`.
- `motifs/deco/`: curls, berries, dots, stems (6 each), moths (3).
- `tools/gen-page.mjs`: builds the motif files and the sample page `pages/garden/sample-p3`
  (seed 67: `SEED=67 node art/phase3/tools/gen-page.mjs`). Cells either touch (gap 0.5 to 3 px) or
  stay 12 px apart; clues are chosen until the page is unique and solvable without guessing, then
  pruned; one bee is hidden until painted and is needed when it appears.
- `report.json`: numbers for the sample page.

Sample page: 64 cells (34 flowers, 30 leaves, 16 bloom), 14 creatures (12 bees, one revealed by paint,
1 rabbit, 1 fox). `tools/validate` passes. No gaps between 3 and 12 px. Smallest cell 63 px.

## Deviations from the brief (to fix in M1 tooling)

- Creature art inside `<g id="creatures">` uses a `translate`/`scale` transform. The import step will bake it.
- Details over the paint (centres, midribs) live in a fourth group `<g id="deco-top">` after the cells,
  so fills do not hide them. The brief and the page-format skill now allow it.
- 14 creatures is more than the GDD's 4 to 8 for a small page: the layout graph is sparse
  (2.2 neighbours per cell). The M1 generator should pack cells into pockets for 3 to 6 neighbours.

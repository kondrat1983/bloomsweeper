---
name: page-format
description: Use when creating, editing, validating or debugging a Bloomsweeper page (page.svg, page.json, page.overrides.json) or when cells, neighbours or creatures behave unexpectedly.
---

# Bloomsweeper page format

A page lives in `pages/<chapter>/<id>/`:

- `page.svg`: viewBox `0 0 1200 1600`. Cells are `<path id="c001" data-kind="flower|leaf">` at the
  top level of `<g id="cells">`. Decoration in `<g id="deco">` (under the cells) and
  `<g id="deco-top">` (details over the paint, never interactive). Creatures in `<g id="creatures">`
  as `<g id="k01" data-type="bee" data-cell="c014" data-n="2">`; reveal creatures add
  `data-reveal="c020,c021"`.
- `page.json`: generated, never edited by hand. Cells, adjacency, creatures, solution, stages,
  difficulty, validated stamp.
- `page.overrides.json`: optional manual adjacency fixes, `{ "add": [["c001","c002"]], "remove": [] }`.

Cell paths may use absolute `M L H V Q C Z` (curves are flattened for geometry).

Workflow for a new page:

1. Create `page.svg` (artist).
2. Run `tools/adjacency <page>` to build the cell graph; inspect neighbour counts.
3. Run `tools/generate <page>` or place creatures by hand.
4. Run `tools/validate <page>`; fix until it passes.
5. Run `tools/preview <page>` and look at the three PNGs.
6. Commit SVG, JSON, overrides and previews together.

Common problems: two shapes that look separate but are within `TOUCH_PX` (add a remove override or
widen the gap); a cell split by a decoration line (decoration never splits cells); a creature whose
`data-cell` points to a flower (creatures sit on leaves unless the rule says otherwise).

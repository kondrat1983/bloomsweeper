# Decisions

Newest first. Each entry: date, decision, why, who decided.

## 2026-10-31: M0 tools started

- **Stack:** Node 22 ESM, no npm dependencies. Tests with node:test. Playwright only for PNG previews (preinstalled Chromium). Decided by Kondrat (start M0), implementation by Claude, pending review.
- **Adjacency:** exact polygon distance, neighbours within TOUCH_PX = 6. SPEC section 3 asks for raster dilation. Deferred: results match for simple shapes. Overrides supported (remove first, then add).
- **Solver:** L1 (single clue), L2 (subset of unknowns between two clues), L3 (page total). **Gap:** L3 chains of three or more clues are not implemented yet.
- **Uniqueness:** exact backtracking count (stops at 2) instead of a SAT library. Revisit when pages get large.
- **Staged solving:** implemented as SPEC section 4: reveal creatures become visible when all their cells are determined.
- **Data:** `page.solution.json` is author input. `data-blooms` on the root `<svg>` holds the page total. `page.json` is generated.
- **Proposals, not approved:** MIN_CELL_PX = 22 (DOC-07). Difficulty weights L1 = 1, L2 = 3, L3 = 5.
- **M0 fixture:** `pages/garden/test-m0` has 12 cells and 4 creatures (rabbit, fox, two bees), one reveal creature. Only one BLOOM cell, so it is a pipeline check, not a playable page.
- **Not done in M0:** creature hit-box check (44 pt), `tools/generate`, Playwright tests (no UI yet).

## 2026-10-31: answers to SPEC section 9 and test policy

- **Rabbit and fox rules (SPEC 9.1):** yes, as in GDD for M1, revisit after playtest. Kondrat.
- **Mistakes (9.2):** immediate ink blot, no penalty. Kondrat.
- **Painting in M1 (9.3):** tap fills whole cell; free brush later. Kondrat.
- **Marking before finding (9.4):** allowed at any time. Kondrat.
- **Art for M1 (9.5):** procedural vector art by the `artist` agent; human illustrator later. Kondrat.
- **UI language (9.6):** English first. Kondrat.
- **Public repo (9.7):** yes, all content original. Kondrat.
- **Tests from day one:** autotests (Node test runner for tools and rules, Playwright for the app) are written with each feature from M0. Manual checks run through Chrome. Test cases live in Google Sheets folder "Bloomsweeper QA" (https://drive.google.com/drive/folders/1XuNuF3HPi5lQ4BMUFF-78RFNVBwPirpi). Documentation tests first. Columns for Kondrat's approval. Kondrat.
- **Open doc gaps found by QA (for Kondrat, see sheet DOC-03, DOC-07, DOC-09):** Find tool in GDD but not in SPEC 6; MIN_CELL_PX has no value; data-n attribute in page-format skill but not in SPEC 3. Open, not decided.

## 2026-10-31: project started

- Working title Bloomsweeper; pitch v0.1 exists (landscape and mobile PDFs).
- Stack proposed: vanilla JS + SVG, Node tools, PWA on GitHub Pages. To be confirmed by Kondrat.
- M1 scope: three pages, bee, rabbit and fox, full find, deduce and paint loop. To be confirmed.

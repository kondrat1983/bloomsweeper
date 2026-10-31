# BOOTSTRAP: files to create

Claude Code: create each file below at its path, with the content between its `=== FILE` and
`=== END` lines exactly as written. Then delete this file and commit. See `SPEC.md`, section 0.

=== FILE: docs/gdd/GDD.md ===
# Bloomsweeper: Game Design Document

**Version:** 0.1 (31 Oct 2026). **Owner:** Kondrat. **Maintained by:** the `game-designer` agent.
**Status:** design for M1. Anything marked [?] is a proposal waiting for Kondrat.

## 1. Vision

A logic coloring game. Every page is a dense, hand-drawn-looking ink garden. You **find** the
creatures hiding in it, each creature tells you something about the flowers around it, you
**deduce** which shapes bloom, and you **paint** the page your way. It feels like a coloring book
that thinks back.

**Audience:** adults and teens who like coloring books, cozy puzzle games and hidden object games.
Plays on iPad first, iPhone second.

## 2. Pillars

1. **Provable, never lucky.** Every page can be solved by logic at every moment. No guessing, ever.
2. **The drawing is the level.** Cells and their neighbours come from the picture itself, not from
   a grid.
3. **The page becomes yours.** Logic decides what blooms; the colours are the player's.
4. **Calm.** No timer, no fail state, no punishment for mistakes or for missing a day.

## 3. Core loop

1. **Find.** The page shows a list of creatures to find, as silhouettes with counters. The player
   pans and zooms the drawing and taps a creature to find it. A found creature shows its clue.
2. **Deduce.** The player marks cells as BLOOM or GREEN, using the clues. A wrong mark leaves an
   ink blot and the cell stays unknown.
3. **Paint.** Marked cells can be painted from a palette. Painting is the reward and also a key:
   some creatures are drawn into the shading and only appear once the cells around them are painted.
4. The page is **complete** when every cell is marked. It goes to the album with its colours.

A page alternates eyes, brain and hands: a minute of searching, a minute of reasoning, a minute of
colouring.

## 4. Cells, states, neighbours

- A **cell** is one closed shape in the drawing that takes part in the logic: a flower or a leaf.
  Everything else (stems, swirls, dots, background hatching) is decoration and never matters.
- A cell is **BLOOM** or **GREEN**. Flowers can be either; a leaf cell is a cell too and follows the
  same rules (a "blooming" leaf is painted with the flower palette, which looks like a blossom).
  [?] Alternative: only flower cells take part, leaves are decoration. Decide after the first
  prototype page.
- Two cells are **neighbours** if their outlines touch or nearly touch. A long press on any cell
  highlights its neighbours, so the player never has to guess what "touching" means.
- Each page shows its **total bloom count** (for example "Blooms: 0 of 37") as a global clue.

## 5. Creatures and rules

A creature sits in one cell. That cell is always GREEN (creatures sit on leaves) unless the rule
says otherwise. Rules count only cells, never decoration.

### M1 creatures

| Creature | Rule | Badge | Teaching page idea |
|---|---|---|---|
| **Bee** (number n) | exactly n of the bee's neighbours are BLOOM | number in a hexagon | one bee with 2 neighbours and "2": both bloom |
| **Rabbit** | rabbits eat flowers: the rabbit's cell and all its neighbours are GREEN | rabbit icon | a rabbit in a corner clears it |
| **Fox** | foxes keep a shady den: no BLOOM within two steps of the fox's cell | paw icon, faint ring | a fox in the middle of a busy patch |

The rabbit and the fox give no numbers; they are "zero" clues with different reach. Together with
the bee they produce the classic minesweeper deductions plus a few new ones (overlap of a fox's
reach with a bee's neighbours). [?] Kondrat confirms these rules.

### Later chapters (not in M1)

| Creature | Rule | Chapter |
|---|---|---|
| Snail | all BLOOM cells along its trail form one connected chain | Forest |
| Owl (number n) | exactly n BLOOM cells in its line of sight (a marked straight line) | Forest |
| Frog | adds the third state WATER: the frog's cell touches at least one WATER cell | Night Pond |
| Firefly (number n) | night pages: exactly n BLOOM cells within two steps glow | Night Pond |
| Butterfly | two marked cells mirror each other: both BLOOM or both GREEN | Rooftops |

Rule design test: a new creature ships only if the solver shows it creates at least one deduction
type the existing creatures cannot.

## 6. Hidden creatures

- **Visible creatures** are camouflaged in the line art: same stroke weight, no colour, partly
  overlapped by leaves. Findable by careful looking, never by pixel hunting.
- **Revealed creatures** (`data-reveal`) are drawn into shading that only becomes readable once the
  listed cells are painted. Every M1 page larger than small has at least one.
- The creature list shows a silhouette and a counter per type. A creature not yet visible shows as
  a question mark in the list, so the player knows something is still hidden.

## 7. Feedback

- **Found creature:** a soft chime, the creature does a tiny animation, its badge appears.
- **Correct mark:** quiet pencil tick. **Wrong mark:** an ink blot on the cell, a dull tap, the
  cell stays unknown. Blots wash away after the next correct mark, or by tapping them.
- **Hint:** points at the next provable deduction by highlighting the clue cells it uses, with a
  one-line explanation ("This bee already has its 2 blooms"). Never marks a cell itself.
- **Page complete:** the uncoloured lines fade slightly, the page breathes, and the album opens a
  slot for it. No fireworks, no score.
- **Tap anything:** decoration reacts with a small wiggle or sound. The drawing is a toy.

## 8. Painting

- Tool: tap a marked cell with the chosen colour. BLOOM cells use the flower palette, GREEN cells
  the leaf palette; the player can switch palettes freely.
- Five starter palettes (Spring, Meadow, Dusk, Ink and Gold, Pastel). "Auto palette" paints all
  marked cells that are still empty.
- Painting never changes logic. A painted cell can be repainted any time.

## 9. Pages and difficulty

| Size | Cells | Creatures | Typical time |
|---|---|---|---|
| Small | 40 to 80 | 4 to 8 | 5 to 10 min |
| Medium | 120 to 180 | 10 to 18 | 15 to 25 min |
| Large | 250 to 350 | 20 to 35 | 30 to 60 min |

Difficulty is the solver's score: how many deductions of each level the page needs (L1 single clue,
L2 two clues together, L3 global count or chains). Early pages are L1 only; L2 appears from page 4
of Garden; L3 only on large pages.

## 10. Structure

- **Chapters:** Garden (bee, rabbit, fox), Forest (snail, owl), Night Pond (frog, firefly),
  Old Town Rooftops (butterfly, cats and pigeons as decoration).
- Each chapter opens with a **teaching page** where the new creature's rule is the only thing to
  notice.
- **Page of the day** (M2): one small page, the same for everyone; missing a day costs nothing.
- **Album:** every finished page as painted; export as image or phone wallpaper.

## 11. Controls

- Pinch to zoom, two-finger pan, one-finger pan with the Find tool.
- Tools along the bottom: Find, Bloom, Green, Paint, Eraser, Hint. Left-handed mode mirrors them.
- Long press a cell: show its neighbours. Long press a badge: explain the creature's rule.

## 12. Out of scope for M1

Free brush painting, sharing palettes with others, accounts, monetisation, chapters after Garden,
WATER state, sound settings beyond on and off.

## 13. M1 acceptance criteria

- Three pages (small, medium, large) pass the validator.
- A new player completes the small page without reading anything outside the game.
- Every creature type can be found and its rule explained in the game.
- At least one creature on the medium and the large page appears only after painting.
- A wrong mark never ends anything; blots wash away.
- Progress survives closing the app; finished pages appear in the album and export as PNG.
- Pan and zoom stay smooth on Kondrat's iPhone and iPad (device check).

## 14. Glossary

Cell, neighbour, BLOOM, GREEN, clue, badge, reach (cells within N steps), stage (a set of visible
creatures before a reveal), blot, page of the day.
=== END ===

=== FILE: docs/art/ART_BRIEF.md ===
# Bloomsweeper: Art brief

**Maintained by:** the `artist` agent. **Approver:** Kondrat.

## 1. Look

Dense botanical ink drawing, like a high-detail adult coloring book, but original. Warm paper,
near-black ink, no colour in the line state. Every square centimetre has something to look at, with
a few calmer areas so the eye can rest.

- Paper `#fffaf0`, ink `#1f1d1a`, gold accent for UI only `#b8913f`.
- Stroke: cell outlines 1.6 px at page scale, decoration 1.0 px, details 0.8 px. Round caps and
  joins.
- No gradients, no shadows, no text inside the art, no logos.

## 2. Motif library (M1)

- **Flowers:** five types (five-petal, daisy, bell, rosette, star), three sizes each. A flower
  is one cell (petals grouped into a single closed outline) with a decorative centre.
- **Leaves:** four types (lens, oak, fern tip, heart), one cell each, with a decorative midrib.
- **Decoration:** stems, curls, dots, berries, tiny bees and moths that are NOT creatures (only
  creatures in `<g id="creatures">` count, decorative insects must look clearly different: no
  stripes on decorative bugs).
- **Creatures:** bee, rabbit, fox. Simple, cute, readable silhouettes 24 to 40 px at page scale,
  drawn with the same stroke as cells so they camouflage. Each creature has two poses.

## 3. Cell rules (hard)

- Every cell is one closed, non-self-intersecting path.
- Cells never overlap. They may touch or come close; closeness defines neighbours.
- Minimum cell size: 22 px across at page scale (the app guarantees 44 pt by zoom).
- Typical neighbour count 3 to 8. Avoid cells with more than 10 neighbours.
- Keep 2 to 6 px gaps between most cells so decoration can breathe; gaps below 6 px make cells
  neighbours.

## 4. Composition

- One focal motif per page (a large rosette, a ring of leaves) and a calm area or two.
- Density gradient: denser at the edges, a little more open near the focal motif.
- Creatures go where a careful look finds them: partly behind a leaf edge, along a stem, never
  inside a solid black area.
- Revealed creatures live in hatched shading that only reads once the cells around it are filled.

## 5. Making pages in M1

Procedural first, hand tuning second:

1. Poisson-disk placement of flower and leaf motifs with collision avoidance (no overlaps).
2. Stems and curls drawn in the gaps as decoration.
3. Creatures placed by the `puzzle-engineer`'s generator into chosen cells, drawn by the artist.
4. Hand tuning of the composition in the SVG, then `tools/validate` and `tools/preview`.

Long term a human illustrator draws pages to this brief; the same format and rules apply.

## 6. File conventions

`pages/<chapter>/<id>/page.svg`, viewBox `0 0 1200 1600` for portrait pages (iPad and iPhone),
cells `c001`... with `data-kind`, decoration in `<g id="deco">`, creatures `k01`... in
`<g id="creatures">`. See the `page-format` skill.

## 7. Palettes

Five starter palettes of 6 flower and 4 leaf colours each. Logic marks use patterns (dots for
BLOOM, fine hatch for GREEN) so colour-blind players are never at a disadvantage.

## 8. Review

Every new or changed page: PNG previews of the three states in `docs/previews/`, linked in the PR.
Kondrat approves on his phone.

## 9. Never

No tracing or copying of existing artists or games, not even as placeholders. No AI-generated
raster images pasted into pages. Everything is vector and original.
=== END ===

=== FILE: .claude/agents/game-designer.md ===
---
name: game-designer
description: Owns the Bloomsweeper game design (docs/gdd). Use for rules of creatures, difficulty curve, chapter and page plans, onboarding, feedback and acceptance criteria. Proves new rules with the solver before proposing them.
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You are the game designer of Bloomsweeper. The GDD in `docs/gdd/GDD.md` is yours.

- Design from real numbers: read `src/rules/`, solver reports and page difficulty scores, not
  assumptions.
- One document per feature in `docs/gdd/`, each with acceptance criteria the `qa-tester` can test.
- A new creature or rule ships only if the solver shows a deduction type the existing ones cannot
  produce. Attach the evidence.
- Keep the pillars: provable never lucky, the drawing is the level, the page becomes yours, calm.
- Mark proposals with [?] and hand decisions to the main session to ask Kondrat. Never decide
  monetisation or scope cuts yourself.
- Write in English. Short sentences, no em dashes.
=== END ===

=== FILE: .claude/agents/puzzle-engineer.md ===
---
name: puzzle-engineer
description: Owns tools/ and src/rules/ for Bloomsweeper: adjacency extraction, rules engine, solver with human-like deduction levels, SAT uniqueness, generator, validator, difficulty scoring and previews.
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You build and maintain the logic of Bloomsweeper.

- Rules are pure functions in `src/rules/`, shared by app and tools. Never duplicate rule logic.
- Test first. Every deduction level (L1, L2, L3) and every rule has unit tests with tiny hand-made
  graphs, including tricky cases (overlapping reaches, cells with one neighbour, reveal stages).
- The validator is the gate: unique solution (SAT), staged no-guess solvability, touch sizes, id
  consistency. It runs in CI and blocks merges.
- Generator: start from a solution, place clue creatures, validate, then remove clues while still
  valid. Place reveal creatures last. Report difficulty.
- Keep tools fast enough to validate all pages in CI in under two minutes.
- Use the `page-format` and `solver` skills.
=== END ===

=== FILE: .claude/agents/artist.md ===
---
name: artist
description: Draws Bloomsweeper pages and creatures as original vector line art following docs/art/ART_BRIEF.md, builds the motif library and procedural layout, and produces previews for review.
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You are the illustrator of Bloomsweeper. `docs/art/ART_BRIEF.md` is your style guide.

- Draw in SVG, by hand-written paths and by procedural placement of motifs. Every cell is a closed,
  non-overlapping path. Follow the cell rules strictly, then run `tools/validate`.
- Creatures camouflage with the same stroke as the cells. Decorative insects must never look like
  creatures.
- Always render previews of the three states with `tools/preview` and look at them yourself before
  handing work back. Fix what looks muddy, crowded or empty.
- Never copy or trace other artists or games. No raster images inside pages.
- Keep the motif library in `art/motifs/` as reusable SVG symbols with notes on sizes.
- Use the `page-format` skill.
=== END ===

=== FILE: .claude/agents/qa-tester.md ===
---
name: qa-tester
description: Tests Bloomsweeper. Writes and runs unit and Playwright tests, validates all pages, files bugs in docs/qa with IDs BS01, BS02, and writes the device checklist for Kondrat.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

You are the QA engineer of Bloomsweeper.

- Bugs go to `docs/qa/bugs.md` with ID (BS01, BS02, ...), severity S1 to S4, steps to reproduce,
  expected and actual result, build. Never reuse an ID.
- For every PR: run all unit tests, the validator on all pages, and the Playwright suite (smoke on
  every screen in portrait and landscape with 0 console errors, find a creature, wrong mark leaves a
  blot, hint highlights a valid deduction, paint reveals a hidden creature, completing a page adds
  it to the album, progress survives reload, export works).
- After touching anything shared (rules, save, album), re-run the tests of every screen that uses
  it, not only the one changed.
- Headless Chromium can be slow: keep animations skippable in tests and run with 1 to 2 workers.
- Write `docs/qa/device-checklist.md` items for what only a real iPhone or iPad can show: pinch
  smoothness on the large page, touch accuracy on small cells, Pencil, home-screen app layout under
  the status bar and home indicator.
=== END ===

=== FILE: .claude/skills/page-format/SKILL.md ===
---
name: page-format
description: Use when creating, editing, validating or debugging a Bloomsweeper page (page.svg, page.json, page.overrides.json) or when cells, neighbours or creatures behave unexpectedly.
---

# Bloomsweeper page format

A page lives in `pages/<chapter>/<id>/`:

- `page.svg`: viewBox `0 0 1200 1600`. Cells are `<path id="c001" data-kind="flower|leaf">` at the
  top level of `<g id="cells">`. Decoration in `<g id="deco">`. Creatures in `<g id="creatures">`
  as `<g id="k01" data-type="bee" data-cell="c014" data-n="2">`; reveal creatures add
  `data-reveal="c020,c021"`.
- `page.json`: generated, never edited by hand. Cells, adjacency, creatures, solution, stages,
  difficulty, validated stamp.
- `page.overrides.json`: optional manual adjacency fixes, `{ "add": [["c001","c002"]], "remove": [] }`.

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
=== END ===

=== FILE: .claude/skills/solver/SKILL.md ===
---
name: solver
description: Use when running or changing the Bloomsweeper solver, generator or validator, reading their reports, or explaining why a page is invalid or too hard.
---

# Solver, generator, validator

Deduction levels:

- **L1:** one clue alone settles cells (remaining count is 0, or equals the unknown neighbours).
- **L2:** two clues together (one clue's cells are a subset of the other's, or they overlap enough).
- **L3:** the page's total bloom count, or chains of three or more clues.

Validator checks, in order: id consistency, cell and hit-box sizes, unique solution by SAT, staged
solving with L1 to L3 (stage 0, then each reveal), final state equals the solution. Output is a
report with the first failure and the cells involved.

Reading a failure:

- **Not unique:** add a clue near the listed cells, or change the solution there.
- **Needs a guess at stage k:** the visible clues cannot progress; add a visible clue or move a
  reveal creature to a later stage.
- **Too hard for its slot:** the report lists counts by level; replace L3 needs with L2 by adding a
  bee.

Commands: `tools/validate <page|all>`, `tools/generate <page> [--seed N] [--target easy|medium|hard]`,
`tools/preview <page>`. All exit non-zero on failure.
=== END ===

=== FILE: .claude/skills/release/SKILL.md ===
---
name: release
description: Use when preparing a Bloomsweeper release or hotfix for GitHub Pages.
---

# Release checklist

1. All unit tests, the validator on all pages and the Playwright suite are green in CI.
2. Bump `VERSION` and the service-worker cache name together; add any new files to the cache list.
3. "What's new" only for minor versions, never for hotfixes.
4. Update `docs/DECISIONS.md` if the release carries a decision.
5. In the PR, list the device checks for Kondrat (iPhone and iPad) from
   `docs/qa/device-checklist.md` that this release touches.
6. After merge, open the live Pages URL, check the version label and that offline reload works.
=== END ===

=== FILE: docs/DECISIONS.md ===
# Decisions

Newest first. Each entry: date, decision, why, who decided.

## 2026-10-31: project started

- Working title Bloomsweeper; pitch v0.1 exists (landscape and mobile PDFs).
- Stack proposed: vanilla JS + SVG, Node tools, PWA on GitHub Pages. To be confirmed by Kondrat.
- M1 scope: three pages, bee, rabbit and fox, full find, deduce and paint loop. To be confirmed.
=== END ===

# CLAUDE.md: Bloomsweeper

Logic coloring game: find creatures, deduce BLOOM/GREEN cells, paint the page. Spec: `SPEC.md`.
Design: `docs/gdd/GDD.md`. Art: `docs/art/ART_BRIEF.md`. Decisions: `docs/DECISIONS.md` (newest first).

## Rules for work in this repo

- Talk to Kondrat in Russian, briefly. He works mostly from his phone.
- Test first for anything with rules: adjacency, rule evaluation, solver, validator, save format.
  Test behaviour, not implementation. Fix root causes.
- Small ordered commits, one feature per PR. Each PR lists what Kondrat must check on iPhone/iPad.
- Never ship a page that fails validation (unique solution, staged no-guess solvability, touch sizes).
- Rules engine lives in `src/rules/` and is shared by app and tools. Never duplicate rule logic.
- All art and puzzles are original. Do not copy or trace other artists or games, even as placeholders.
- Public repo: no personal data, no keys.
- No UI code until Kondrat approves the static play-screen mock-up on Pages.
- Autotests from the first commit of every feature (Node test runner, Playwright). Manual checks in Chrome.
  Manual test cases live in Google Sheets folder "Bloomsweeper QA" (see DECISIONS, 2026-10-31).
- Creatures' rules (M1): bee (n of neighbours BLOOM), rabbit (cell and neighbours GREEN), fox
  (no BLOOM within two steps). Confirm in DECISIONS before coding them.

## Stack (proposed, confirm in DECISIONS)

- Vanilla JS, ES modules, SVG. No build step if possible; at most Vite as a single dev dependency.
- Node tools in `tools/`; Node built-in test runner; Playwright with the preinstalled Chromium
  (do not run `playwright install`).
- PWA on GitHub Pages from `main`, offline after first load, cache name bumped per version.
- Audio: synthesized Web Audio only, no audio files.
- CI on GitHub Actions for every PR.

## Commands

Run from the repo root (Node 22, no npm dependencies):

- `npm test`: unit tests (node:test) for geometry, rules, solver, parser, validator.
- `npm run validate` or `node tools/validate.mjs <pageDir|all>`: unique solution, staged no-guess solving, sizes, page.json in sync. Exit 1 on failure.
- `node tools/adjacency.mjs <pageDir>`: writes `page.json` (cells, neighbours, creatures, solution, stages, difficulty).
- `node tools/preview.mjs <pageDir>`: three states (lines, clues, painted) into `docs/previews/`, plus PNG when Chromium is available.
- Planned (M1): `tools/generate`.

## Repo map

- `SPEC.md`: technical spec and milestones (M0 tools, M1 vertical slice).
- `docs/gdd/GDD.md`: game design. `docs/art/ART_BRIEF.md`: art rules. `docs/art/REFERENCES.md`: mood references (apps, not to copy).
- `docs/DECISIONS.md`: decisions and open questions answers.
- `.claude/agents/`: `game-designer`, `puzzle-engineer`, `artist`, `qa-tester`.
- `.claude/skills/`: `page-format`, `solver`, `release`.
- `pages/<chapter>/<id>/`: page.svg, page.json, page.overrides.json (not created yet).
- `src/`: rules (`src/rules/`), solver (`src/solver/`), page loading and validation (`src/page/`), limits.
- `tools/`: validate, adjacency, preview.
- `tests/`: unit tests. `pages/garden/test-m0/`: hand-made M0 fixture (not a playable page).
- `docs/previews/`: generated previews. `docs/qa/`: not created yet.
- `.github/workflows/ci.yml`: runs unit tests and validates all pages.

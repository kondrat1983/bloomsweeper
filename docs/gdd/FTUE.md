# First-time experience (FTUE)

**Status:** mock-up for review (`mockup/tutorial.html`). Owner: `game-designer`. Approver: Kondrat.

## Goal

A new player understands the core loop in about two minutes, without reading anything outside the
game: find a creature, deduce with its clue, mark, paint. No fail state, no timer.

## The teaching page

Six shapes. One bee on a leaf touches exactly two flowers and says 2, so both bloom (GDD section 5
teaching idea). The page total is 2 blooms, so the other four shapes are green. Solvable by L1 and
the page total only.

## Steps

| Step | Player sees | Player does | Teaches |
|---|---|---|---|
| 0 | Welcome card | Start | What the game is |
| 1 | "Find the bee hiding on a leaf" | Taps the bee (wrong taps only shake the card) | Find |
| 2 | Badge 2, the two touching flowers glow; tip about long press | Got it | Bee rule, "touching" |
| 3 | Bloom tool pulses | Picks Bloom | Tools |
| 4 | "Tap the two glowing flowers" | Marks both; a wrong tap leaves an ink blot that washes away | BLOOM mark, blots |
| 5 | Counter 2 / 2 pulses, Green tool pulses | Picks Green | Page total (L3) |
| 6 | "Tap the other 4 shapes" | Marks them green | GREEN mark, creatures sit on green |
| 7 | "Solved by logic" | Picks Paint | Logic is done, colour is free |
| 8 | Palette appears | Paints a shape or taps Auto | Paint, Auto |
| 9 | Page complete | Next | Album |
| 10 | Card explaining the rabbit | Let's play / Replay | New creatures explain themselves on first find |

Skip is always visible and ends the tutorial.

## Acceptance criteria (for `qa-tester`)

- Every step can be completed by taps only; no step needs reading outside the card.
- Only the expected target advances a step; other taps never break the flow.
- A wrong mark in step 4 shows an ink blot, leaves the shape unknown, and the next correct mark removes it.
- Skip from any step lands on the last card; Replay returns to step 0.
- All text is at least 17 pt; all tap targets are at least 44 pt.
- No console errors in portrait at 390x844.

## Decided (2026-10-31, Kondrat)

- Shown automatically on first launch. Skip is always visible; replay from Settings.
- Rabbit and fox: a rule card on first find, and the first page with that creature is a simple
  teaching page where its rule is the only thing to notice (GDD section 10).

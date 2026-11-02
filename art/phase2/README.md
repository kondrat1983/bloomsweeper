# Phase 2: visual language

Canvas (private, Claude Design): https://claude.ai/artifact/Hzwen9jf48WH8totQzWxiJ
(rows "Phase 2 · Visual language" and "Phase 2 · Screens").

- `tokens/tokens.json`: colours, BLOOM and GREEN mark specs, five palettes (6 flowers + 4 leaves each),
  type, radii, spacing, sizes, strokes, motion.
- `ui/icons/`: 24 px stroke icons, `currentColor`: six tools, back, menu, counter, sound on and off,
  settings, album.
- `ui/badges/`: bee hexagon (number drawn by the app), rabbit and fox round badges.
- `ui/patterns/`: seamless mark tiles. `ui/feedback/`: three blots, sparkle, found ring.
- `creatures/`: bee, rabbit, fox in two poses, moth, revealed fox before and after.
- `tools/`: `gen-p2.mjs` draws the garden in every game state (find, deduce, paint, complete in each
  palette, plain), `gen-teach.mjs` draws the tutorial page, `creatures.mjs` holds the creature paths.

Screens on the canvas: Find, Deduce, Paint, Tutorial step 2, rule cards (rabbit, fox), Page complete,
Album, Title. The wordmark uses Caveat (OFL); the name Bloomsweeper is still a working title.

Still open for phase 3: motif library as single-path cells, a sample page that passes the validator.

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

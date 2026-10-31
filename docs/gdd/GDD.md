# Bloomsweeper: Game Design Document

| | |
|---|---|
| **Version** | 0.2 (31 Oct 2026) |
| **Owner** | Kondrat (producer, final say) |
| **Maintained by** | the `game-designer` agent |
| **Status** | Design for M1 (vertical slice). Mock-ups of the play screen and tutorial wait for Kondrat's OK on iPhone. |
| **Related** | `SPEC.md` (tech), `docs/art/ART_BRIEF.md` (art), `docs/art/REFERENCES.md`, `docs/gdd/FTUE.md` (tutorial), `docs/DECISIONS.md` (decision log) |

**How to read this document.** Plain statements are decided. Items marked **[?]** are proposals
waiting for Kondrat. Decisions are logged with date and reason in `docs/DECISIONS.md`; this document
shows the current state only.

---

## 1. Game overview

### 1.1 High concept

A coloring book that thinks back: find creatures hidden in a dense ink garden, use their clues to
work out which shapes bloom, then paint the page your way.

### 1.2 Elevator pitch

Bloomsweeper mixes three things people already love: the calm of an adult coloring book, the joy of
spotting hidden things in a busy drawing, and the clean logic of Minesweeper. Every page is a
hand-drawn garden. Bees, rabbits and foxes hide in it. Each creature you find tells you something
about the flowers around it. With pure logic, never guessing, you mark which shapes bloom and which
stay green. Then the page is yours to paint. Some creatures only show up once you paint around them,
so colouring feeds the search.

### 1.3 Key facts

| | |
|---|---|
| Genre | Logic puzzle + hidden object + coloring |
| Platform | Web (PWA) on GitHub Pages; iPad first, iPhone second. Store builds later (M3+). |
| Orientation | Portrait and landscape |
| Session | 5 to 60 minutes per page, can stop any time |
| Players | Single player |
| Language | English first (decided). Other languages later. |
| Rating target | Everyone. No violence, no text chat, no ads in M1. |
| Business model | Not decided [?] (see section 15) |

### 1.4 Target audience

- **Primary:** adults 25 to 55 who use coloring books or coloring apps to relax and like "cozy"
  games.
- **Secondary:** puzzle players (Minesweeper, nonograms, Sudoku) who want a calmer, prettier logic
  game; hidden-object fans.
- **Player motivations:** relaxation, a sense of mastery without pressure, making something
  beautiful, small "aha" moments.
- **Not for:** players looking for speed, competition or a story.

### 1.5 Player fantasy

"I'm sitting with a beautiful ink drawing and a cup of tea. The drawing is alive: little creatures
whisper hints, I work it out, and the page blooms in my colours."

### 1.6 Unique selling points

1. **The drawing is the level.** Neighbours come from the art itself, not from a grid.
2. **Provable, never lucky.** Every page is solvable by logic at every moment; checked by a solver
   before it ships.
3. **Painting is a key.** Colouring reveals hidden creatures that unlock the rest of the puzzle.
4. **Calm by design.** No timer, no fail state, no lives, no punishment for missing a day.

### 1.7 Comparable titles

| Title | What we share | How we differ |
|---|---|---|
| Hidden Folks (main mood reference) | Hand-drawn line art, finding small creatures | Finding is only one third of the loop; creatures carry logic clues |
| Minesweeper | Number clues about neighbours, pure deduction | No mines, no fail state, organic cells, no guessing ever |
| Nonograms / Picross | Logic reveals a picture | The picture exists first; the player colours it freely |
| Coloring apps | Relaxing painting of line art | Painting has meaning: it reveals creatures |

---

## 2. Design pillars

Every feature is checked against these. If it fights a pillar, it is cut or changed.

1. **Provable, never lucky.** Every page can be solved by logic at every moment. No guessing, ever.
2. **The drawing is the level.** Cells and their neighbours come from the picture itself.
3. **The page becomes yours.** Logic decides what blooms; the colours are the player's.
4. **Calm.** No timer, no fail state, no punishment for mistakes or for missing a day.

---

## 3. Core gameplay

### 3.1 Core loop

1. **Find.** Pan and zoom the drawing, tap a hidden creature to find it. A found creature shows its
   clue badge.
2. **Deduce.** Use the clues to mark shapes as BLOOM or GREEN. A wrong mark leaves an ink blot and
   the shape stays unknown.
3. **Paint.** Colour marked shapes with your own palette. Painting can reveal more creatures, which
   brings you back to step 1.
4. **Complete.** When every shape is marked, the page is complete and goes to the album with your
   colours.

A page alternates eyes, brain and hands: a minute of searching, a minute of reasoning, a minute of
colouring.

### 3.2 Session flow

Title → Continue (last page) or Chapters → Page → play → page complete → Album slot opens →
next page or back to Chapter.

### 3.3 Goals and end conditions

- **Page goal:** mark every shape. Painting is optional, but needed to reveal hidden creatures.
- **No fail state.** Nothing can be lost. Blots are only counted in stats.
- **Chapter goal:** complete its pages to fill the chapter's album spread.

### 3.4 Order of actions

The player can mark at any time; finding all creatures first is not required (decided). The game
never forces an order except in the tutorial.

---

## 4. Game mechanics

### 4.1 Cells

- A **cell** is one closed shape in the drawing that takes part in the logic: a flower or a leaf.
- Everything else (stems, curls, dots, hatching) is decoration and never matters.
- A cell is **BLOOM** or **GREEN**. Flowers can be either; leaves can be either (a blooming leaf is
  painted from the flower palette). [?] Alternative: only flowers take part. Decide after the first
  real page.

### 4.2 Neighbours

- Two cells are **neighbours** if their outlines touch or nearly touch (within `TOUCH_PX` = 6 px at
  page scale). Manual overrides exist for edge cases.
- **Long press** any cell to highlight its neighbours, so "touching" is never a guess.

### 4.3 Page total

Each page shows its total bloom count ("4 / 37" in the top bar). It is a global clue: when all
blooms are found, everything else is green.

### 4.4 Creatures and rules

A creature sits on one cell. That cell is always GREEN (creatures sit on leaves). Rules count cells
only, never decoration.

**M1 creatures (rules confirmed by Kondrat for M1, revisit after playtest):**

| Creature | Rule | Badge | Reach |
|---|---|---|---|
| **Bee** (number n) | Exactly n of the bee's neighbours are BLOOM | Number in a hexagon | 1 step |
| **Rabbit** | Rabbits eat flowers: its cell and all its neighbours are GREEN | Rabbit icon | 1 step |
| **Fox** | Foxes keep a shady den: no BLOOM within two steps | Paw icon, faint ring | 2 steps |

Rabbit and fox are "zero" clues with different reach. Together with the bee they give the classic
Minesweeper deductions plus new ones (a fox's reach overlapping a bee's neighbours).

**Later chapters (not in M1):**

| Creature | Rule | Chapter |
|---|---|---|
| Snail | All BLOOM cells along its trail form one connected chain | Forest |
| Owl (n) | Exactly n BLOOM cells in its line of sight (a marked straight line) | Forest |
| Frog | Adds the state WATER: the frog's cell touches at least one WATER cell | Night Pond |
| Firefly (n) | Night pages: exactly n BLOOM cells within two steps glow | Night Pond |
| Butterfly | Two marked cells mirror each other: both BLOOM or both GREEN | Rooftops |

**Rule design test:** a new creature ships only if the solver shows it creates at least one
deduction type the existing creatures cannot.

### 4.5 Hidden and revealed creatures

- **Visible creatures** are camouflaged in the line art: same stroke, no colour, partly overlapped.
  Findable by careful looking, never by pixel hunting.
- **Revealed creatures** are drawn into shading that only reads once the listed cells are painted.
  Every M1 page larger than small has at least one.
- The creature tray shows a silhouette and a counter per type ("Bees 1 of 3"). A creature not yet
  visible shows as "? hidden", so the player knows something is still out there.

### 4.6 Marking and mistakes

- **Bloom** and **Green** tools mark a cell. **Eraser** clears a mark.
- A wrong mark (one that contradicts the solution) is caught **immediately** (decided): an ink blot
  appears, a dull tap sounds, the cell stays unknown. No penalty.
- Blots wash away after the next correct mark, or when tapped. They only appear in stats.

### 4.7 Hints

- **Hint** points at the next provable deduction: it highlights the clue and the cells involved and
  gives a one-line explanation ("This bee already has its 2 blooms. Its other neighbours are green.").
- A hint never marks a cell by itself.
- Hints are unlimited and free in M1. [?] Whether hints are ever limited is a business decision.

### 4.8 Painting

- Tap a marked cell with the chosen colour (decided for M1). Free brush with Apple Pencil comes
  later.
- BLOOM cells use the flower palette, GREEN cells the leaf palette; the player can switch freely.
- Five starter palettes (Spring, Meadow, Dusk, Ink and Gold, Pastel). **Auto** paints all marked
  cells that are still empty.
- Painting never changes logic. A painted cell can be repainted any time.

### 4.9 Fairness guarantee (the solver)

Every page is checked before it ships:

- exactly one solution;
- at every reveal stage, the visible clues let a human progress with three levels of reasoning:
  - **L1 single clue:** a clue's remaining count is 0 or equals its unknown neighbours;
  - **L2 pairs:** one clue's unknowns sit inside another's;
  - **L3 global:** the page total, and chains of three or more clues (chains not built yet);
- cells and creatures are big enough to tap (cell at least 22 px at page scale, 44 pt when zoomed).

---

## 5. Controls and input

| Gesture | Action |
|---|---|
| Pinch | Zoom |
| Two-finger drag | Pan |
| One-finger drag (Find tool) | Pan |
| Tap (Find tool) | Find a creature |
| Tap (Bloom / Green / Eraser / Paint) | Apply the tool to a cell |
| Long press on a cell | Show its neighbours |
| Long press on a badge | Explain the creature's rule |

- **Tools along the bottom:** Find, Bloom, Green, Paint, Eraser, Hint (Find is a separate tool,
  decided).
- **Left-handed mode** mirrors the tool bar.
- **Apple Pencil:** works as a finger in M1; pressure brush later.

---

## 6. User interface and UX

### 6.1 Screen flow

```
Title ──> Continue ──────────────> Page (play)
  │                                   │
  ├──> Chapters ──> Chapter ──> Page  ├──> Page complete ──> Album slot
  ├──> Album ──> Page view / export   │
  └──> Settings                       └──> back to Chapter
```

- **Title:** Continue, Chapters, Album, Settings.
- **Chapter:** page thumbnails with progress (line, partly painted, complete).
- **Page:** the play screen (6.2).
- **Album:** finished pages as painted; export as image or phone wallpaper.
- **Settings:** sound on/off, hints on/off, left-handed mode, replay tutorial, reset progress,
  export/import progress.

### 6.2 Play screen layout (portrait)

Approved layout is the mock-up `mockup/index.html` once Kondrat signs it off on iPhone.

1. **Top bar:** back, page title, bloom counter ("4 / 37"), menu.
2. **Canvas:** the drawing fills the screen; zoom level shown briefly while zooming.
3. **Message area** (bottom of canvas): short feedback and hints, one at a time.
4. **Palette strip** (Paint tool only): Flowers / Leaves switch, swatches, Auto.
5. **Creature tray:** silhouettes with counters, "? hidden" for unrevealed creatures.
6. **Tool bar:** six tools with icon and label.

Safe areas: nothing under the notch or the home indicator. Landscape: tool bar moves to the side
[?] (layout to be mocked up).

### 6.3 Feedback

| Event | Visual | Sound |
|---|---|---|
| Creature found | Tiny animation, badge appears | Soft chime |
| Correct mark | Pattern fills the cell | Quiet pencil tick |
| Wrong mark | Ink blot, cell stays unknown | Dull tap |
| Hint | Clue and cells outlined, one-line text | None |
| Revealed creature | Sparkle, badge, tray counter turns gold | Chime |
| Page complete | Uncoloured lines fade slightly, the page "breathes", album slot opens. No fireworks, no score. | Page turn |
| Tap on decoration | Small wiggle | Tiny sound |

---

## 7. Onboarding (FTUE)

Full spec: `docs/gdd/FTUE.md`; mock-up: `mockup/tutorial.html`.

- Shown automatically on first launch; Skip always visible; replay from Settings (decided).
- One six-shape teaching page: find the bee, see that it touches exactly two flowers, mark both,
  use the page total to mark the rest green, paint, complete. A wrong mark shows how blots work.
- **New creatures:** a rule card on first find, and the first page with that creature is a simple
  teaching page where its rule is the only thing to notice (decided).

---

## 8. Content and progression

### 8.1 Chapters

| Chapter | Creatures | Milestone |
|---|---|---|
| Garden | bee, rabbit, fox | M1 (3 pages), M2 (12 pages) |
| Forest | snail, owl | M3 |
| Night Pond | frog (WATER), firefly | M3 |
| Old Town Rooftops | butterfly; cats and pigeons as decoration | later |

- Chapters unlock in order; pages inside a chapter unlock one after another [?].
- **Page of the day** (M2): one small page, the same for everyone. Missing a day costs nothing.

### 8.2 Page sizes

| Size | Cells | Creatures | Typical time |
|---|---|---|---|
| Small | 40 to 80 | 4 to 8 | 5 to 10 min |
| Medium | 120 to 180 | 10 to 18 | 15 to 25 min |
| Large | 250 to 350 | 20 to 35 | 30 to 60 min |

### 8.3 Difficulty curve

- Difficulty score = L1 + 3 × L2 + 5 × L3 (count of deductions by level; weights decided).
- Early pages use L1 only; L2 appears from page 4 of Garden; L3 only on large pages.
- Size and difficulty alternate so a long page is followed by a lighter one.

### 8.4 Rewards

- The painted page itself and its place in the album are the reward.
- No currency, no stars, no score in M1.

---

## 9. Level design

- A page is an SVG drawing plus generated data (cells, neighbours, creatures, solution, stages,
  difficulty). See `SPEC.md` section 3 and the `page-format` skill.
- Pipeline: draw (artist) → build neighbours → place creatures (generator or by hand) → validate →
  preview → Kondrat approves on phone.
- Revealed creatures are placed last, in shading next to cells that are solved in an earlier stage.
- Composition: one focal motif, one or two calm areas, denser at the edges.

---

## 10. Art direction

Full brief: `docs/art/ART_BRIEF.md`. Mood references: `docs/art/REFERENCES.md` (main: Hidden Folks).

- Dense botanical ink drawing, warm paper `#fffaf0`, near-black ink `#1f1d1a`, gold for UI only
  `#b8913f`.
- Line state has no colour. BLOOM marks use small dots, GREEN marks use fine hatch, so colour-blind
  players lose nothing.
- All art is original vector work. M1 art is procedural, made by the `artist` agent (decided); a
  human illustrator may join later with the same rules.

---

## 11. Audio

- Small synthesized effects through Web Audio: pencil tick, dull tap, soft chime, page turn, tiny
  decoration sounds. No audio files with unclear rights.
- Music: none in M1 [?]. A calm generative ambience is an option for M2.
- Settings: sound on/off only in M1.

---

## 12. Narrative and tone

- No story in M1. The tone comes from the art and the creatures: gentle, a little playful.
- Copy is short, warm and plain ("This bee already has its 2 blooms."). No exclamation spam.
- [?] A light frame for chapters (a gardener's sketchbook) can come in M2.

---

## 13. Technical overview

Details in `SPEC.md`.

- Vanilla JS, ES modules, SVG; each cell is one SVG path. No game engine.
- PWA: installable, offline after first load.
- Rules engine shared by app and tools; the validator runs in CI and blocks bad pages.
- Save: localStorage with a schema version; export and import all progress as JSON.
- **Performance targets** [?]: pan and zoom at 60 fps on Kondrat's iPhone and iPad on the large
  page; page opens in under 1 second after first load.

---

## 14. Accessibility

- Marks use patterns as well as colour.
- Text at least 17 pt; tap targets at least 44 pt.
- Clue badges are numbers or icons, never colour alone.
- Reduced motion respected (no pulsing or ripples).
- Left-handed mode; portrait and landscape.
- No time pressure anywhere.

---

## 15. Monetisation

Not decided. Kondrat decides; the design team does not. M1 is free, with no ads and no purchases.
Options for later discussion [?]: premium price, free first chapter with chapter packs, optional
supporter purchase. Whatever is chosen must not break pillar 4 (calm): no energy timers, no paid
hints that block progress.

---

## 16. Metrics and playtesting

- No analytics in M1 (public repo, no personal data).
- Playtest questions, answered by observation and short interviews [?]:
  - Does a new player finish the tutorial without help?
  - Time per page by size; where do players stop?
  - Blots and hints per page: is a page too hard for its slot?
  - Do players notice revealed creatures?

---

## 17. Scope and milestones

| Milestone | Content | Status |
|---|---|---|
| M0 tools | Page format, neighbours, rules, solver L1 to L3, uniqueness, validator, previews, test page, CI | Done (L3 chains and creature hit-box check pending) |
| Mock-ups | Play screen and tutorial | Waiting for Kondrat's OK on iPhone |
| M1 vertical slice | 3 pages (small, medium, large), bee, rabbit, fox, full loop, one revealed creature, hints, blots, album, save | Next |
| M2 Garden | 12 pages, difficulty curve, page of the day, palettes, sounds | Planned |
| M3 | Forest and Night Pond, store builds | Planned |

**Out of scope for M1:** free brush painting, sharing palettes, accounts, monetisation, chapters
after Garden, WATER state, sound settings beyond on and off.

### 17.1 M1 acceptance criteria

- Three pages (small, medium, large) pass the validator.
- A new player completes the tutorial and the small page without reading anything outside the game.
- Every creature type can be found and its rule explained in the game.
- At least one creature on the medium and the large page appears only after painting.
- A wrong mark never ends anything; blots wash away.
- Progress survives closing the app; finished pages appear in the album and export as PNG.
- Pan and zoom stay smooth on Kondrat's iPhone and iPad (device check).

---

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| "Touching" feels unclear in organic art | Players feel cheated | Long press shows neighbours; 2 to 6 px gaps rule in art; overrides |
| Procedural art looks generic | Weak appeal | Hand tuning, motif library, Hidden Folks mood, Kondrat reviews previews |
| Dense pages are hard to tap on iPhone | Frustration | 44 pt rule enforced by validator; zoom; iPad first |
| Pages too hard or too easy | Churn | Solver difficulty score, curve in section 8.3, playtests |
| Large pages slow on older phones | Bad feel | Performance targets, device checks every PR |
| Hidden creatures turn into pixel hunting | Frustration | Camouflage rules; "? hidden" counter; hint can point to the search area [?] |

---

## 19. Open questions [?]

1. Leaves in logic, or flowers only (4.1)?
2. Hints ever limited (4.7)?
3. Unlock order of pages (8.1)?
4. Landscape layout of the play screen (6.2)?
5. Music in M2 (11)?
6. Chapter frame story (12)?
7. Performance targets (13)?
8. Monetisation model (15)?
9. Can a hint point to the area of an unfound creature (18)?

---

## 20. Glossary

| Term | Meaning |
|---|---|
| Cell | A closed shape (flower or leaf) that takes part in the logic |
| Neighbour | A cell whose outline touches or nearly touches another |
| BLOOM / GREEN | The two states of a cell in M1 |
| Clue / badge | What a found creature tells you, shown as a number or icon |
| Reach | Cells within N steps of a creature |
| Stage | The set of visible creatures before a reveal |
| Revealed creature | A creature that appears only after painting given cells |
| Blot | The mark a wrong move leaves; washes away, no penalty |
| Page total | The number of BLOOM cells on the page, shown in the top bar |
| L1, L2, L3 | Levels of human reasoning the solver checks |
| Page of the day | One small daily page, same for everyone |

---

## 21. Change log

| Version | Date | Change |
|---|---|---|
| 0.2 | 31 Oct 2026 | Full GDD structure: overview, audience, USPs, controls, UI flow, FTUE, progression, audio, tone, tech, accessibility, monetisation (open), metrics, risks, open questions. Folded in all decisions to date. |
| 0.1 | 31 Oct 2026 | First version from the pitch. |

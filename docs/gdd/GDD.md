# Bloomsweeper: Game Design Document

| Field | Value |
|---|---|
| **Version** | 0.3 (1 Nov 2026) |
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

| Item | Value |
|---|---|
| Genre | Logic puzzle + hidden object + coloring |
| Platform | Web (PWA) on GitHub Pages. iPhone first: all M1 checks run on Kondrat's iPhone (decided). iPad later. Store builds later (M3+). |
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
- Touching must also be visible without long press: art keeps gaps either at most 3 px (neighbours) or at least 12 px (not neighbours). Gaps between 3 and 12 px look the same but play differently, so the validator will warn about them [?] (exact values after the first real page).

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

Rabbit and fox are zero clues, solved at L1 only. A rabbit is logically a bee with 0; a fox differs
from it only by reach. They differ from a bee in reading and in what they teach, not in logic, and
are kept for M1 by Kondrat's decision. After the playtest a variant is tested [?]: a fox with n =
exactly n blooms two steps away (a ring), which gives a non-local deduction a bee cannot. It ships
only if the solver shows a new step type (rule design test below).

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
- **Revealed creatures** are drawn into shading next to the listed cells. When all listed cells are
  painted, the creature is **found automatically** with a sparkle and its badge appears (decided).
  Every M1 page larger than small has at least one.
- A reveal must matter: when it fires, at least one cell on the page is still undetermined, so the
  new clue is needed (checked by the validator, pending).
- The creature tray shows a silhouette and a counter per type ("Bees 1 of 3"). A creature not yet
  visible shows as "? hidden", so the player knows something is still out there.

### 4.6 Marking and mistakes

- **Bloom** and **Green** tools mark a cell. **Eraser** clears a mark.
- A wrong mark (one that contradicts the solution) is caught **immediately** (decided): an ink blot
  appears, a dull tap sounds, the cell stays unknown. No penalty.
- Blots wash away after the next correct mark, or when tapped. They only appear in stats.
- Because blots are instant, a player could tap-guess. After **3 blots in a row** the message area
  offers a Hint. No penalty (decided).
- **Mark the rest green:** when the bloom counter reaches the page total, or a clue is fully
  resolved, a button marks all its remaining unknown cells green in one tap. It is a provable step
  (L1 or page total), so it keeps pillar 1 and removes busywork (decided).

### 4.7 Hints

- **Hint** points at the next provable deduction: it highlights the clue and the cells involved and
  gives a one-line explanation ("This bee already has its 2 blooms. Its other neighbours are green.").
- A hint never marks a cell by itself.
- Hints are unlimited and free in M1. [?] Whether hints are ever limited is a business decision.
- Before M1 UI work, `docs/gdd/HINTS.md` defines: hint text per level, the order hints are chosen
  in, and what Hint does when the next step needs a creature that is not found yet.

### 4.8 Painting

- Tap a marked cell with the chosen colour (decided for M1). Free brush with Apple Pencil comes
  later.
- BLOOM cells use the flower palette, GREEN cells the leaf palette; the player can switch freely.
- Five starter palettes are planned (Spring, Meadow, Dusk, Ink and Gold, Pastel). M1 ships at least
  Spring [?]; the rest come in M2. **Auto** paints all marked cells that are still empty.
- Painting never changes logic. A painted cell can be repainted any time.

### 4.9 Fairness guarantee (the solver)

Every page is checked before it ships. What is built today and what is pending:

| Check | Status |
|---|---|
| Exactly one solution (exact backtracking count) | Built |
| Staged no-guess solving: at every reveal stage the visible clues let a human progress | Built |
| L1 single clue: remaining count is 0 or equals its unknown cells | Built |
| L2 pairs: one clue's unknowns are a subset of another's | Built (subset only; overlap not built) |
| L3 page total: fires when the remaining total is 0 or equals all unknowns | Built |
| L3 chains of three or more clues | Pending |
| Final state equals the solution; page.json in sync with the SVG | Built |
| Cell at least 22 px across at page scale | Built (bounding box only; thin shapes can pass, pending a true width check) |
| Cell at least 44 pt at the zoom where it is painted | Pending |
| Creature hit box at least 44 pt at default zoom | Pending |
| Each reveal fires while at least one cell is undetermined | Pending |
| Warning for gaps between 3 and 12 px | Pending [?] |

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

### 5.1 Camera [?]

- Default: the whole page width fits the screen.
- Maximum zoom: the smallest cell is at least 88 pt (twice the tap minimum).
- Minimum zoom: the whole page fits the screen.
- Double tap zooms in on that spot; zoom level shows briefly while zooming.

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
- **Album:** finished pages as painted; export as PNG (M1). Phone wallpaper export later [?].
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
| Garden | bee, rabbit, fox | M1 (tutorial, 2 teaching mini pages, 3 main pages), M2 (12 pages) |
| Forest | snail, owl | M3 |
| Night Pond | frog (WATER), firefly | M3 |
| Old Town Rooftops | butterfly; cats and pigeons as decoration | later |

- **M1 content (decided):** the tutorial page, two teaching mini pages of about 15 cells (one for
  the rabbit, one for the fox), then three main pages: small (L1 only), medium and large (both bring
  in L2).
- Chapters unlock in order; pages inside a chapter unlock one after another [?].
- **Page of the day** (M2): one small page, the same for everyone. Missing a day costs nothing.

### 8.2 Page sizes

| Size | Cells | Creatures | Typical time [?] until playtest |
|---|---|---|---|
| Small | 40 to 80 | 4 to 8 | 5 to 10 min |
| Medium | 120 to 180 | 10 to 18 | 15 to 25 min |
| Large | 250 to 350 | 20 to 35 | 30 to 60 min |

### 8.3 Difficulty curve

- The solver reports the number of **cells resolved** at each level (L1, L2, L3). Score =
  L1 + 3 × L2 + 5 × L3 (weights decided). This score grows with page size, so on its own it is not
  a difficulty measure.
- **Difficulty for the curve** [?] = (3 × L2 + 5 × L3) / cells: the share of hard reasoning,
  independent of size.
- The page-total endgame (L3) can appear on any page, including the tutorial. L3 chains (not built)
  only on large pages.
- M1: the small page uses L1 only; medium and large bring in L2. M2: L2 from page 4 of Garden [?].
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
- Save edge cases: progress is saved after every mark; reset asks for confirmation; if a page changes
  in an update, its in-progress marks are kept only when the page's cell ids and solution are
  unchanged, otherwise the page restarts and the player is told [?].
- **Performance targets** [?]: pan and zoom at 60 fps on Kondrat's iPhone on the large
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
| M1 vertical slice | Tutorial, 2 teaching mini pages, 3 main pages (small, medium, large), bee, rabbit, fox, full loop, revealed creatures, hints, blots, mark-the-rest-green, album, save | Next |
| M2 Garden | 12 pages, difficulty curve, page of the day, palettes, sounds | Planned |
| M3 | Forest and Night Pond, store builds | Planned |

**Out of scope for M1:** free brush painting, sharing palettes, accounts, monetisation, chapters
after Garden, WATER state, sound settings beyond on and off.

### 17.1 M1 acceptance criteria

- All M1 pages (tutorial, two teaching pages, small, medium, large) pass the validator.
- At least 4 of 5 first-time testers finish the tutorial and the small page without help.
- Every creature type can be found and its rule explained in the game.
- At least one creature on the medium and the large page appears only after painting, and each
  reveal fires while at least one cell is still undetermined.
- Every creature silhouette is 24 to 40 px at page scale and its hit box is at least 44 pt at
  default zoom (findable, never pixel hunting).
- A wrong mark never ends anything; blots wash away.
- Progress survives closing the app; finished pages appear in the album and export as PNG.
- Pan and zoom stay smooth on Kondrat's iPhone (device check; target 60 fps [?]).

---

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| "Touching" feels unclear in organic art | Players feel cheated | Long press shows neighbours; gaps at most 3 px or at least 12 px, validator warns in between [?]; overrides |
| Procedural art looks generic | Weak appeal | Hand tuning, motif library, Hidden Folks mood, Kondrat reviews previews |
| Dense pages are hard to tap on iPhone | Frustration | 44 pt rules in the validator (pending); zoom; all checks on iPhone |
| Tap-guessing with instant blots | Logic gets skipped | After 3 blots in a row, offer a Hint |
| Long green-marking at the end of big pages | Busywork, breaks calm | Mark the rest green button |
| Score measures size, not difficulty | Bad curve | Use the normalised difficulty in 8.3 |
| Pages too hard or too easy | Churn | Solver difficulty score, curve in section 8.3, playtests |
| Large pages slow on older phones | Bad feel | Performance targets, device checks every PR |
| Hidden creatures turn into pixel hunting | Frustration | Camouflage rules; "? hidden" counter; hint can point to the search area [?] |

---

## 19. Open questions [?]

1. Leaves in logic, or flowers only (4.1)?
2. Gap thresholds for visible touching: 3 px and 12 px (4.2)?
3. Hints ever limited (4.7)?
4. Palettes in M1: Spring only, or all five (4.8)?
5. Camera values (5.1)?
6. Unlock order of pages (8.1)?
7. Typical times per page size, after playtest (8.2)?
8. Normalised difficulty formula (8.3)?
9. Landscape layout of the play screen (6.2)?
10. Phone wallpaper export (6.1)?
11. Music in M2 (11)?
12. Chapter frame story (12)?
13. Save edge cases after a page update (13)?
14. Performance targets (13)?
15. Monetisation model (15)?
16. Can a hint point to the area of an unfound creature (4.7, 18)?
17. Fox ring variant after the playtest (4.4)?

---

## 20. Glossary

| Term | Meaning |
|---|---|
| Cell | A closed shape (flower or leaf) that takes part in the logic |
| Neighbour | A cell whose outline touches or nearly touches another |
| BLOOM / GREEN | The two states of a cell in M1 |
| Clue / badge | What a found creature tells you, shown as a number or icon |
| Step | One move from a cell to a neighbour |
| Reach | Cells within N steps of a creature |
| Stage | The set of visible creatures before a reveal |
| Revealed creature | A creature that appears only after painting given cells |
| Blot | The mark a wrong move leaves; washes away, no penalty |
| Page total | The number of BLOOM cells on the page, shown in the top bar |
| L1, L2, L3 | Levels of human reasoning the solver checks |
| Page of the day | One small daily page, same for everyone |

---

## 21. Feature docs

Each feature gets its own document with acceptance criteria the `qa-tester` can test.

| Feature | Document | Status |
|---|---|---|
| Tutorial (FTUE) | `docs/gdd/FTUE.md` | Written, mock-up done |
| Hints | `docs/gdd/HINTS.md` | To write before M1 UI |
| Teaching pages (rabbit, fox) | `docs/gdd/TEACHING.md` | To write with M1 pages |
| Album and export | `docs/gdd/ALBUM.md` | To write in M1 |

---

## 22. Change log

| Version | Date | Change |
|---|---|---|
| 0.3 | 1 Nov 2026 | Review by the `game-designer` agent and Kondrat's answers: built and pending solver checks, rabbit and fox described as zero clues, L3 on any page, normalised difficulty, auto-found revealed creatures, mark-the-rest-green, blot nudge, M1 content with teaching pages, iPhone only for M1 checks, camera, save edge cases, gap rule, feature docs index, testable acceptance criteria. |
| 0.2 | 31 Oct 2026 | Full GDD structure: overview, audience, USPs, controls, UI flow, FTUE, progression, audio, tone, tech, accessibility, monetisation (open), metrics, risks, open questions. Folded in all decisions to date. |
| 0.1 | 31 Oct 2026 | First version from the pitch. |

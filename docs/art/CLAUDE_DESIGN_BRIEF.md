# Art brief for Claude Design: Bloomsweeper v1 art package

**From:** Kondrat (producer) and the Bloomsweeper dev team. **Date:** 2 Nov 2026.
**For:** the artist working in Claude Design.
**Goal:** a style and a complete, implementation-ready art package for the first playable version (M1).

This brief stands on its own. Attach the five mock-up screenshots from `docs/art/brief/` when you
send it.

---

## 1. What we are making

**Bloomsweeper** is a calm logic coloring game for iPhone (a web app, later in the stores).

- Every page is a **dense, hand-drawn-looking ink garden**: flowers, leaves, stems, curls, berries.
- Little **creatures hide in the drawing**: a bee, a rabbit, a fox. The player finds them, like in a
  hidden-object game.
- Each found creature gives a **logic clue** about the flowers around it. For example, a bee with
  the number 2 says: exactly 2 of the shapes it touches are in bloom.
- The player marks every shape as **BLOOM** or **GREEN** by pure logic, never guessing. Then the
  player **paints** the page in their own colours. Some creatures only appear once you paint around
  them.
- No timer, no fail state. A wrong mark leaves a small **ink blot** that washes away.

**Player fantasy:** "I'm sitting with a beautiful ink drawing and a cup of tea. The drawing is alive:
little creatures whisper hints, I work it out, and the page blooms in my colours."

**Audience:** adults 25 to 55 who relax with coloring books and cozy games.

## 2. Mood and references

**Main mood reference:** Hidden Folks (iOS). Secondary: Hidden Objects: The Journey, Find It:
Hidden Objects Game.

- Hidden Folks: https://apps.apple.com/ua/app/hidden-folks/id1584550483
- Hidden Objects: The Journey: https://apps.apple.com/ua/app/hidden-objects-the-journey/id1673457778
- Find It: Hidden Objects Game: https://apps.apple.com/ua/app/find-it-hidden-objects-game/id6446468634

Take the **feeling** only: hand-drawn line art, tiny figures camouflaged in a busy scene, charm and
humour, readable on a phone. **Never** copy or trace their drawings, characters, layouts or shapes,
and do not imitate any specific artist (for example Johanna Basford). Everything must be original.

**Our look in one line:** a high-detail adult coloring book page, drawn in warm black ink on cream
paper, where the drawing quietly hides a few cute creatures.

## 3. Style rules (hard)

| Item | Rule |
|---|---|
| Paper | `#fffaf0` |
| Ink | `#1f1d1a` (near black, warm) |
| UI accent | Gold `#b8913f`, UI only, never inside the art |
| Line state | No colour in the drawing at all. Pure ink on paper. |
| Strokes | Cell outlines 1.6 px, decoration 1.0 px, small details 0.8 px, at page scale (page is 1200 x 1600). Round caps and joins. |
| Forbidden | Gradients, shadows, text inside the art, logos, raster images, AI-generated raster textures |
| Density | Dense at the edges, a bit calmer around one focal motif; one or two calm areas per page so the eye can rest |
| Creatures | Same stroke as the cells so they camouflage. Cute, simple, readable at 24 to 40 px. |
| Decorative insects | Allowed, but must look clearly different from creatures: no stripes, no faces like the bee |

Colour lives in two places only: the player's paint palettes, and the logic marks (BLOOM is small
dots, GREEN is a fine hatch, so colour-blind players are never at a disadvantage).

## 4. What already exists

A working mock-up of the play screen and the tutorial (screenshots attached, approved by Kondrat
for layout). Its drawing is a **procedural placeholder** made by code. Your job is to replace it
with real art and a real visual language. Keep the layout:

1. Top bar: back, page title, bloom counter ("4 / 37"), menu.
2. Canvas: the drawing, full width.
3. Message area at the bottom of the canvas (dark rounded card).
4. Palette strip (only while painting): Flowers / Leaves switch, swatches, Auto.
5. Creature tray: chips with silhouettes and counters ("2 of 3", "? hidden").
6. Tool bar: Find, Bloom, Green, Paint, Eraser, Hint (icon + label).

Text is the system font (SF Pro), at least 17 pt. Tap targets at least 44 pt. Target screen:
iPhone 390 x 844 pt, portrait. Respect the notch and the home indicator.

## 5. How the art becomes a game (read this before drawing)

The game logic reads the drawing. Each **flower or leaf is a "cell"**: one closed shape the player
taps and marks. Neighbours are computed from how close the outlines are. That is why the package
must separate **cells** (logic) from **decoration** (looks only).

**Cell rules (hard):**

1. A cell is **one closed, non-self-intersecting outline**: one `<path>`, one subpath, ending in `Z`.
   Petals are grouped into a single outer outline; inner details (centre, midrib, petal lines) are
   decoration, not part of the cell path.
2. Cells **never overlap**.
3. Gaps between cells are either **at most 3 px** (they count as touching neighbours) or **at
   least 12 px** (they do not touch). Avoid gaps in between, they look the same but play differently.
4. Minimum cell size: **22 px across** at page scale, in its narrowest direction (no thin crescents).
5. A cell usually has 3 to 8 neighbours; never more than 10.
6. Decoration never cuts through a cell.
7. Creatures sit **on leaves**, inside the leaf outline, partly overlapped by an edge or a stem.

**SVG rules (so the code can read it without hand work):**

- Absolute coordinates only. **No `transform` attributes** on cells, decoration or creatures. Bake
  all transforms into the path data.
- Path commands allowed: `M L H V C Q Z` (absolute, upper case). No arcs (`A`), no relative commands,
  no `<use>`, no clip paths, no masks, no filters, no embedded images, no fonts.
- Cells and decoration are stroke only: `fill="none"` in the source. The game paints the fills.
- Clean, minified-friendly SVG: no editor metadata, no hidden layers, ids only where asked.

## 6. The package we need (deliverables)

Deliver one folder (zip) named `bloomsweeper-art-v1/` with exactly this structure.

```
bloomsweeper-art-v1/
  README.md                  what is inside, any deviations, open questions
  manifest.json              list of every asset: file, type, size in page px, notes
  style/
    direction-A.png ... direction-C.png   phase 1 style frames (see section 7)
    chosen/                  final style frames, 390x844 @2x PNG:
      play-find.png  play-deduce.png  play-paint.png
      tutorial-card.png  rule-card-rabbit.png  rule-card-fox.png
      page-complete.png  album.png  title.png
  tokens/
    tokens.json              colours, palettes, type scale, spacing, radii, strokes, motion
  ui/
    icons/                   24x24 SVG, stroke icons, currentColor:
      tool-find.svg tool-bloom.svg tool-green.svg tool-paint.svg tool-eraser.svg tool-hint.svg
      back.svg menu.svg counter-flower.svg sound-on.svg sound-off.svg settings.svg album.svg
    badges/
      badge-bee.svg          hexagon with an empty centre for the number
      badge-rabbit.svg  badge-fox.svg   round badges with an icon
    tray/
      tray-bee.svg tray-rabbit.svg tray-fox.svg tray-hidden.svg   chip silhouettes, 28x28
    patterns/
      mark-bloom.svg  mark-green.svg   seamless tiles for the logic marks
    feedback/
      blot-1.svg blot-2.svg blot-3.svg   ink blots, about 40 px
      sparkle.svg  found-ring.svg  hint-outline-spec.md
    components.md            spec of each component with states: default, active, disabled, target (pulsing)
  motifs/
    flowers/   five-petal-{s,m,l}.svg daisy-{s,m,l}.svg bell-{s,m,l}.svg rosette-{s,m,l}.svg star-{s,m,l}.svg
    leaves/    lens.svg oak.svg fern-tip.svg heart.svg
    deco/      stem-*.svg curl-*.svg berries-*.svg dots-*.svg moth-*.svg   (at least 6 of each kind except moth: 3)
  creatures/
    bee-pose1.svg bee-pose2.svg rabbit-pose1.svg rabbit-pose2.svg fox-pose1.svg fox-pose2.svg
    fox-revealed.svg         the fox drawn into hatched shading, readable only once colour is around it
  pages/
    garden-sample/
      page.svg               one complete hand-composed page, 1200x1600 (see below)
      preview-lines.png  preview-painted.png
  app/
    icon-1024.png  icon.svg   app icon (no text)
```

**Motif files.** Each motif SVG has `viewBox` centred on the motif (origin at its centre), and two
groups:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 80 80" data-size="m">
  <g id="cell"><path d="M ... Z"/></g>          <!-- exactly one closed outline -->
  <g id="deco"> ... centre, petal lines ... </g>  <!-- decoration only -->
</svg>
```

Sizes: flowers s about 40 px, m about 70 px, l about 110 px across; leaves 50 to 90 px long. One
focal motif per page can be up to about 220 px.

**Creature files.** `viewBox` centred on the creature, 24 to 40 px across, line art only, plus one
invisible hit area:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48">
  <g id="art"> ... strokes ... </g>
  <circle id="hit" r="22" fill="none" stroke="none"/>   <!-- 44 pt tap area at default zoom -->
</svg>
```

**The sample page** (`pages/garden-sample/page.svg`) proves the style and the rules work together:

- `viewBox="0 0 1200 1600"`, portrait, about 60 cells (a "small" page), one focal motif.
- Top-level groups, in this order:
  - `<g id="deco">` decoration under the cells (stems, curls, ground texture);
  - `<g id="cells">` cells only: `<path id="c001" data-kind="flower" d="..."/>`, ids `c001`, `c002`
    and so on, `data-kind` is `flower` or `leaf`;
  - `<g id="deco-top">` details drawn over the paint (flower centres, midribs, petal lines), never
    interactive (added 2 Nov 2026 in phase 3);
  - `<g id="creatures">` each creature as `<g id="k01" data-type="bee" data-cell="c014">` holding
    its art. Put 4 to 6 creatures (bees, one rabbit, one fox) on leaf cells. Mark the fox as
    hidden-until-painted with `data-reveal="c020,c021"` listing the cells around it.
- Bee numbers are not needed: our tools compute them.

**tokens.json** shape (values are examples):

```json
{
  "color": { "paper": "#fffaf0", "ink": "#1f1d1a", "gold": "#b8913f", "uiSurface": "#fbf5e8", "uiLine": "#e7dfcf", "muted": "#6b655c" },
  "mark": { "bloom": { "tint": "#fbe1e7", "dot": "#c9506f" }, "green": { "tint": "#e3efd8", "hatch": "#6f9b5f" } },
  "palettes": [ { "name": "Spring", "flowers": ["#...", "6 colours"], "leaves": ["#...", "4 colours"] } ],
  "type": { "family": "system-ui", "body": 17, "title": 17, "large": 22, "weightBold": 600 },
  "radius": { "chip": 22, "card": 18, "button": 14 },
  "space": [4, 8, 12, 16, 24],
  "stroke": { "cell": 1.6, "deco": 1.0, "detail": 0.8, "icon": 1.8 },
  "motion": { "fast": 150, "base": 250, "slow": 600, "reducedMotion": "no pulses, no ripples" }
}
```

Five palettes: Spring, Meadow, Dusk, Ink and Gold, Pastel. Each has 6 flower and 4 leaf colours that
look good on the cream paper next to black ink. Check that BLOOM dots and GREEN hatch stay distinct
for colour-blind players (protanopia, deuteranopia).

## 7. Phases and reviews

1. **Phase 1, style directions.** Three different directions (A, B, C) of the same play screen in
   the Find state, 390 x 844. Vary line character (crisp pen vs. slightly wobbly ink), density, and
   creature cuteness. Kondrat picks one.
2. **Phase 2, visual language.** `tokens.json`, UI icons and components, badges, tray, patterns,
   feedback, creatures, and the chosen style frames.
3. **Phase 3, page art.** Motif library and the sample page.

Send each phase separately. Kondrat reviews on his iPhone.

## 8. Acceptance checklist for the package

- [ ] Folder structure and file names exactly as in section 6; `manifest.json` lists every file.
- [ ] No raster inside SVGs, no transforms, no arcs, no relative path commands, no fonts.
- [ ] Every cell path is one closed outline; cells do not overlap; gaps are at most 3 px or at least
      12 px; every cell is at least 22 px across in its narrowest direction.
- [ ] Creatures use the same stroke as cells, are 24 to 40 px, and have a `hit` circle of r 22.
- [ ] Decorative insects have no stripes and cannot be mistaken for creatures.
- [ ] All UI text at least 17 pt, tap targets at least 44 pt, nothing under the notch or home indicator.
- [ ] BLOOM and GREEN marks are distinct without colour.
- [ ] Everything is original; nothing traced or copied from the reference apps or any artist.
- [ ] `README.md` lists any rule you had to bend and why.

## 9. How to hand it over

Upload the zip for each phase to the Google Drive folder **Bloomsweeper Art** (Kondrat will share it),
or give it to Kondrat directly. The dev team imports it into the repo under `art/claude-design/`,
runs the page validator on the sample page and reports back any cell that breaks the rules.

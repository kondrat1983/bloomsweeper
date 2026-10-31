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

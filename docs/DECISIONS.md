# Decisions

Newest first. Each entry: date, decision, why, who decided.

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

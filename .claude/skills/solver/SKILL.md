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

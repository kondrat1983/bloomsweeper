// Limits used by the validator (decided, see docs/DECISIONS.md).
export const MIN_CELL_PX = 22; // ART_BRIEF section 3, page scale
export const TOOL_VERSION = '0.2.0-m1';
// Creature tap area: 44 pt at the 2x play zoom on a 390 pt wide phone (1200 page px fit = 0.325 pt/px, 2x = 0.65).
export const HIT_R = 34;
// Gap rule (GDD 4.2, proposal): touching cells at most 3 px apart, others at least 12 px. Warning only.
export const GAP_TOUCH_MAX = 3;
export const GAP_APART_MIN = 12;
// Main pages need at least this share of BLOOM cells (generator gate; tests/pages.test.mjs).
export const MIN_BLOOM_SHARE = 0.1;

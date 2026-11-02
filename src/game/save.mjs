// Saves in localStorage (SPEC section 7): one key per page, a schema version from day one.
// Every storage call is wrapped: private mode or a full quota never breaks the game.

export const SCHEMA = 1;
const key = (pageId) => `bloomsweeper:v${SCHEMA}:page:${pageId}`;

// Brings an old save up to the current schema. Returns null for anything it cannot read.
export function migrate(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const v = obj.v ?? 0;
  if (v > SCHEMA) return null;
  if (v === 0) {
    return {
      v: SCHEMA,
      marks: obj.marks || {},
      painted: obj.painted || {},
      found: obj.found || [],
      revealed: obj.revealed || [],
      blots: [],
      blotCount: obj.blotCount || 0,
      streak: 0,
      elapsed: obj.elapsed || 0,
    };
  }
  return obj;
}

export function saveGame(storage, pageId, data) {
  try {
    storage.setItem(key(pageId), JSON.stringify({ ...data, v: SCHEMA }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(storage, pageId) {
  try {
    const raw = storage.getItem(key(pageId));
    if (raw === null || raw === undefined) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

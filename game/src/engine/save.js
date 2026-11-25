// Game state (flags, inventory, location) and its localStorage save slot.

const KEY = 'moonshine.save.v1';

export function newState(start) {
  return {
    version: 1,
    flags: {},
    inventory: [],
    looks: {}, // 'map:entity' -> times looked at
    map: start.map,
    x: start.x,
    y: start.y,
    facing: start.facing || 'down',
    savedAt: null,
  };
}

const DIRS = ['up', 'down', 'left', 'right'];

// Make a loaded (or debug-built) state safe for this build of the content:
// fill missing fields, drop unknown items, and fall back to the start map if
// the saved map no longer exists. (The world also moves the player off solid
// or out-of-bounds tiles when the map loads.) `content.migrate(state)`, if
// given, runs first, for renamed flags or items between versions.
export function validateState(raw, content) {
  let s = { ...raw };
  if (content.migrate) s = content.migrate(s) || s;
  s.version = 1;
  s.flags = s.flags && typeof s.flags === 'object' ? s.flags : {};
  s.looks = s.looks && typeof s.looks === 'object' ? s.looks : {};
  s.inventory = Array.isArray(s.inventory) ? s.inventory.filter((id) => {
    if (content.items && content.items[id]) return true;
    console.warn(`[save] dropping unknown item "${id}"`);
    return false;
  }) : [];
  if (!content.maps[s.map]) {
    console.warn(`[save] unknown map "${s.map}"; starting at content.start`);
    Object.assign(s, { map: content.start.map, x: content.start.x, y: content.start.y, facing: content.start.facing });
  }
  if (!Number.isInteger(s.x) || !Number.isInteger(s.y)) s.x = s.y = -1; // world picks a safe tile
  if (!DIRS.includes(s.facing)) s.facing = 'down';
  return s;
}

export function hasSave() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 1) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  try {
    state.savedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

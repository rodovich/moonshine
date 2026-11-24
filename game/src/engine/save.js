// Game state (flags, inventory, location) and its localStorage save slot.

const KEY = 'moonshine.save.v1';

export function newState(start) {
  return {
    version: 1,
    flags: {},
    inventory: [],
    map: start.map,
    x: start.x,
    y: start.y,
    facing: start.facing || 'down',
    savedAt: null,
  };
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

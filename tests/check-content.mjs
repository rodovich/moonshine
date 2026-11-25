// Content validator: loads game/src/content/index.js in Node and checks that
// maps, exits, entities, items, art references, and the ids that scripts use
// (items, maps, entities, flags, music, sound effects) all line up.
//
//   node tests/check-content.mjs          errors and warnings; exit 1 on errors
//   node tests/check-content.mjs --quiet  errors only
//
// Script checks read each script's source text, so they catch literal ids
// (g.giveItem('plug')) but not computed ones. Warnings are things that are
// often typos (a flag that is read but never set); errors will break play.

const quiet = process.argv.includes('--quiet');
const root = new URL('../game/src/', import.meta.url);
const { default: content } = await import(new URL('content/index.js', root));
let audio = { MUSIC: null, SFX: null };
try {
  const { SONGS } = await import(new URL('audio/music/index.js', root));
  const { SFX } = await import(new URL('audio/sfx.js', root));
  audio = { MUSIC: new Set(Object.keys(SONGS)), SFX: new Set(Object.keys(SFX)) };
} catch {
  /* audio ids unchecked */
}
let TINTS = {};
try {
  ({ TINTS } = await import(new URL('art/tints.js', root)));
} catch {
  /* no tints */
}
// Engine sound ids that the bridge (engine/sound.js) maps to audio ids.
const SFX_ALIASES = { text: 'blip', text_cheryl: 'blip_cheryl', cursor: 'blip', select: 'confirm', item: 'item_get' };

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const items = content.items || {};
const maps = content.maps || {};
const DIRS = ['up', 'down', 'left', 'right'];

// ---- Art helpers ----
function frameExists(sheet, frame) {
  return !!sheet && !!sheet.frames && (frame in sheet.frames || `${frame}_0` in sheet.frames);
}
function checkSheetRef(where, sheet, frame, palette) {
  if (!sheet || !sheet.frames) return err(where, 'sprite/icon has no sheet');
  if (frame && !frameExists(sheet, frame)) err(where, `sheet ${sheet.name || '?'} has no frame "${frame}"`);
  if (typeof palette === 'string' && !(sheet.palettes && sheet.palettes[palette])) err(where, `sheet ${sheet.name || '?'} has no palette "${palette}"`);
}

// ---- Tiles ----
// Resolve a legend value the way engine/tilemap.js does, without drawing.
function resolveTile(ts, value) {
  const spec = typeof value === 'string' ? { tile: value } : value;
  const named = ts.tiles && ts.tiles[spec.tile];
  if (named) return { ...named, ...spec, ok: true, name: spec.tile, frames: named.pattern ? named.pattern.flat() : [named.frame || spec.tile] };
  const m = /^([\w-]+):([\w-]+)(?:@([\w-]+))?$/.exec(spec.tile || '');
  if (!m) return { ok: false, why: `"${spec.tile}" is neither a tileset tile nor a 'sheet:frame' reference` };
  const sheet = ts.sheets && ts.sheets[m[1]];
  if (!sheet) return { ok: false, why: `tileset.sheets has no "${m[1]}"` };
  if (!frameExists(sheet, m[2])) return { ok: false, why: `sheet "${m[1]}" has no frame "${m[2]}"` };
  if (m[3] && !(sheet.palettes && sheet.palettes[m[3]])) return { ok: false, why: `sheet "${m[1]}" has no palette "${m[3]}"` };
  return { ...spec, ok: true, name: spec.tile, frames: [m[2]] };
}

// Static solidity grid for a map (tiles + collision override), as the engine computes it.
function mapInfo(id, def) {
  const where = `map ${id}`;
  const ground = def.ground || [];
  const h = ground.length;
  const w = Math.max(0, ...ground.map((r) => r.length));
  const solid = Array.from({ length: h }, () => Array(w).fill(false));
  const ts = def.tileset || {};
  const cache = new Map();
  for (const layer of ['ground', 'detail', 'overhead']) {
    const rows = def[layer];
    if (!rows) continue;
    if (rows.length !== h) err(where, `${layer} has ${rows.length} rows; ground has ${h}`);
    rows.forEach((row, y) => {
      if (row.length !== w) err(where, `${layer} row ${y} is ${row.length} wide; expected ${w}`);
      [...row].forEach((ch, x) => {
        if (ch === ' ') return;
        const value = def.legend?.[ch];
        if (value === undefined) return err(where, `${layer} (${x},${y}): no legend entry for "${ch}"`);
        let t = cache.get(ch);
        if (!t) {
          t = resolveTile(ts, value);
          cache.set(ch, t);
          if (!t.ok) err(where, `legend "${ch}": ${t.why}`);
        }
        if (!t.ok) return;
        const over = t.frames.some((f) => f.startsWith('over_'));
        if (over !== (layer === 'overhead')) warn(where, `"${t.name}" at (${x},${y}) is on ${layer}; over_* frames belong on overhead only`);
        if (layer !== 'overhead' && t.solid && y < h && x < w) solid[y][x] = true;
      });
    });
  }
  (def.collision || []).forEach((row, y) => [...row].forEach((c, x) => {
    if (y < h && x < w) {
      if (c === '#') solid[y][x] = true;
      if (c === 'o') solid[y][x] = false;
    }
  }));
  const inBounds = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < w && y < h;
  return { w, h, solid, inBounds, walkable: (x, y) => inBounds(x, y) && !solid[y][x] };
}

// ---- Scripts: collect literal ids from function sources ----
const used = { items: [], maps: [], entities: [], flagsSet: [], flagsRead: [], music: [], sfx: [], lighting: [], scripts: [] };
const scriptSources = [];
function scan(where, fn) {
  if (typeof fn !== 'function') return;
  const src = fn.toString();
  scriptSources.push(src);
  const grab = (re, list) => {
    for (const m of src.matchAll(re)) list.push({ id: m[1], where, args: m[2] });
  };
  grab(/\.(?:giveItem|takeItem|hasItem)\(\s*['"]([\w.-]+)['"]/g, used.items);
  grab(/\.changeMap\(\s*['"]([\w.-]+)['"]\s*,?\s*([^)]*)\)/g, used.maps);
  grab(/\.(?:npc|moveNpc|faceNpc|show|hide|remove|place|setSprite|pose|looks)\(\s*['"]([\w.-]+)['"]/g, used.entities);
  grab(/\.setFlag\(\s*['"]([\w.-]+)['"]/g, used.flagsSet);
  grab(/\.flag\(\s*['"]([\w.-]+)['"]/g, used.flagsRead);
  grab(/\.(?:playMusic|playCue)\(\s*['"]([\w.-]+)['"]/g, used.music);
  grab(/\.sfx\(\s*['"]([\w.-]+)['"]/g, used.sfx);
  grab(/\.setLighting\(\s*['"]([\w.-]+)['"]/g, used.lighting);
}
function scanAll(where, obj, depth = 0) {
  if (!obj || depth > 4) return;
  if (typeof obj === 'function') return scan(where, obj);
  if (Array.isArray(obj)) return obj.forEach((v, i) => scanAll(`${where}[${i}]`, v, depth + 1));
  if (typeof obj === 'object' && !obj.frames && !obj.sheet) {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'tileset' || k === 'legend') continue;
      scanAll(`${where}.${k}`, v, depth + 1);
    }
  }
}

// ---- Items ----
for (const [id, def] of Object.entries(items)) {
  if (!def.name) warn(`item ${id}`, 'no name');
  if (!def.description) warn(`item ${id}`, 'no description');
  if (def.icon) checkSheetRef(`item ${id}`, def.icon.sheet, def.icon.frame, def.icon.palette);
  else warn(`item ${id}`, 'no icon');
}

// ---- Maps ----
const infos = {};
const entityIds = new Set(['player']);
for (const [key, def] of Object.entries(maps)) {
  if (def.id !== key) err(`map ${key}`, `id is "${def.id}"; content.maps key is "${key}"`);
  infos[key] = mapInfo(key, def);
  (def.variants || []).forEach((v, i) => {
    const merged = { ...def, ...v, legend: { ...def.legend, ...(v.legend || {}) } };
    mapInfo(`${key} variant ${i}`, merged);
    if (v.when) scan(`map ${key} variant ${i}`, v.when);
  });
}
const lightingNames = new Set([...Object.keys(TINTS), ...Object.keys(content.lighting || {})]);
for (const [key, def] of Object.entries(maps)) {
  const info = infos[key];
  const where = `map ${key}`;
  if (def.spawn && !info.walkable(def.spawn[0], def.spawn[1])) err(where, `spawn (${def.spawn}) isn't walkable`);
  if (typeof def.lighting === 'string' && !lightingNames.has(def.lighting)) err(where, `unknown lighting "${def.lighting}"`);
  if (typeof def.music === 'string' && audio.MUSIC && !audio.MUSIC.has(def.music)) warn(where, `music "${def.music}" doesn't exist yet`);
  const isExitTile = (x, y) => (def.exits || []).some((e) => x >= e.x && y >= e.y && x < e.x + (e.w || 1) && y < e.y + (e.h || 1));
  (def.exits || []).forEach((ex, i) => {
    const ew = `${where} exit ${i} (${ex.x},${ex.y})`;
    if (!info.inBounds(ex.x, ex.y)) err(ew, 'is off the map');
    else if (info.solid[ex.y][ex.x] && !ex.run) warn(ew, "is on a solid tile; it can't be walked onto unless something clears it");
    if (ex.run) return scan(ew, ex.run);
    if (!maps[ex.to]) return err(ew, `goes to unknown map "${ex.to}"`);
    if (!Array.isArray(ex.at)) return err(ew, 'has no `at`');
    const dest = infos[ex.to];
    const ww = ex.w || 1;
    const hh = ex.h || 1;
    for (let dy = 0; dy < hh; dy++) for (let dx = 0; dx < ww; dx++) {
      const ax = ex.at[0] + (ww > 1 || hh > 1 ? dx : 0);
      const ay = ex.at[1] + (ww > 1 || hh > 1 ? dy : 0);
      if (!dest.walkable(ax, ay)) err(ew, `arrives at (${ax},${ay}) on ${ex.to}, which isn't walkable`);
      else if ((maps[ex.to].exits || []).some((e) => ax >= e.x && ay >= e.y && ax < e.x + (e.w || 1) && ay < e.y + (e.h || 1))) {
        warn(ew, `arrives on an exit tile (${ax},${ay}) of ${ex.to}; fine, but the next step there can't trigger it`);
      }
    }
    if (ex.facing && !DIRS.includes(ex.facing)) err(ew, `facing "${ex.facing}"`);
    if (ex.when) scan(ew, ex.when);
  });
  (def.triggers || []).forEach((tr, i) => {
    const tw = `${where} trigger ${i}`;
    if (!info.inBounds(tr.x, tr.y)) err(tw, 'is off the map');
    if (!tr.run) err(tw, 'has no run');
    scanAll(tw, tr);
  });
  const ids = new Set();
  (def.entities || []).forEach((e, i) => {
    const ewh = `${where} entity ${e.id || i}`;
    if (!e.id) err(ewh, 'has no id');
    else if (ids.has(e.id)) {
      // Same id twice is fine when their `when`s are meant to be exclusive.
      if (!e.when) warn(ewh, 'id is used twice on this map');
    }
    ids.add(e.id);
    entityIds.add(e.id);
    if (!info.inBounds(e.x, e.y)) err(ewh, `(${e.x},${e.y}) is off the map`);
    if (e.sprite && typeof e.sprite === 'object') {
      checkSheetRef(ewh, e.sprite.sheet, e.sprite.frame, e.sprite.palette);
      if (!e.sprite.frame && !frameExists(e.sprite.sheet, 'walk_down') && !frameExists(e.sprite.sheet, 'idle_down')) {
        err(ewh, 'character sheet has no idle_down_0 or walk_down_0 frame');
      }
    }
    if (e.facing && !DIRS.includes(e.facing)) err(ewh, `facing "${e.facing}"`);
    const b = e.behavior;
    if (b && typeof b === 'object' && b.type === 'patrol') {
      for (const [x, y] of b.route || []) if (!info.inBounds(x, y)) err(ewh, `patrol waypoint (${x},${y}) is off the map`);
    }
    for (const k of Object.keys(e.use || {})) if (k !== '*' && !items[k]) err(ewh, `use handler for unknown item "${k}"`);
    const interactive = e.interact || e.use || e.look || e.looks || e.talk;
    if (e.name && !interactive) warn(ewh, 'has a name but nothing to say or show');
    scanAll(ewh, e);
  });
  for (const k of ['onEnter', 'patches', 'lighting']) if (typeof def[k] === 'function') scan(`${where}.${k}`, def[k]);
}

// ---- Characters placed by story state ----
for (const [id, ch] of Object.entries(content.characters || {})) {
  const where = `character ${id}`;
  entityIds.add(id);
  if (!ch.at) warn(where, 'has no `at`, so it never appears');
  if (ch.sprite && typeof ch.sprite === 'object') checkSheetRef(where, ch.sprite.sheet, ch.sprite.frame, ch.sprite.palette);
  for (const k of Object.keys(ch.use || {})) if (k !== '*' && !items[k]) err(where, `use handler for unknown item "${k}"`);
  scanAll(where, ch);
  // Every literal placement must be on a real map and a walkable tile.
  const src = ch.at ? ch.at.toString() : '';
  for (const m of src.matchAll(/map:\s*['"]([\w.-]+)['"]\s*,\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)/g)) {
    if (!maps[m[1]]) err(where, `placed on unknown map "${m[1]}"`);
    else if (!infos[m[1]].walkable(Number(m[2]), Number(m[3]))) err(where, `placed at (${m[2]},${m[3]}) on ${m[1]}, which isn't walkable`);
  }
}

// ---- Start, player, content-level scripts ----
if (!maps[content.start?.map]) err('content.start', `unknown map "${content.start?.map}"`);
else if (!infos[content.start.map].walkable(content.start.x, content.start.y)) err('content.start', `(${content.start.x},${content.start.y}) isn't walkable`);
if (content.player?.sprite) checkSheetRef('content.player', content.player.sprite.sheet, null, content.player.sprite.palette);
for (const [k, fn] of Object.entries(content.scripts || {})) scan(`content.scripts.${k}`, fn);
scanAll('content.defaults', content.defaults);
if (content.onNewGame) scan('content.onNewGame', content.onNewGame);

// ---- Cross-check ids used by scripts ----
for (const u of used.items) if (!items[u.id]) err(u.where, `uses unknown item "${u.id}"`);
for (const u of used.maps) {
  if (!maps[u.id]) {
    err(u.where, `changeMap to unknown map "${u.id}"`);
    continue;
  }
  const nums = (u.args || '').split(',').map((s) => s.trim()).slice(0, 2).map(Number);
  if (nums.length === 2 && nums.every(Number.isInteger) && !infos[u.id].walkable(nums[0], nums[1])) {
    err(u.where, `changeMap('${u.id}', ${nums[0]}, ${nums[1]}) lands on a tile that isn't walkable`);
  }
}
for (const u of used.entities) if (!entityIds.has(u.id)) err(u.where, `refers to entity "${u.id}", which isn't on any map`);
for (const u of used.lighting) if (!lightingNames.has(u.id)) err(u.where, `unknown lighting "${u.id}"`);
if (audio.MUSIC) for (const u of used.music) if (!audio.MUSIC.has(u.id)) warn(u.where, `music "${u.id}" doesn't exist yet`);
if (audio.SFX) for (const u of used.sfx) if (!audio.SFX.has(SFX_ALIASES[u.id] || u.id)) warn(u.where, `sound "${u.id}" doesn't exist yet`);
const set = new Set(used.flagsSet.map((u) => u.id));
const read = new Set(used.flagsRead.map((u) => u.id));
const reported = new Set();
for (const u of used.flagsRead) {
  if (set.has(u.id) || reported.has(u.id)) continue;
  reported.add(u.id);
  warn(u.where, `reads flag "${u.id}", which no script sets (a typo, or set by name elsewhere?)`);
}
for (const id of new Set(used.flagsSet.map((u) => u.id))) if (!read.has(id)) warn('flags', `"${id}" is set but never read (fine if it's for later)`);
// ---- Report ----
const nMaps = Object.keys(maps).length;
if (!quiet) for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(`\n${nMaps} maps, ${Object.keys(items).length} items, ${entityIds.size - 1} entity ids: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);

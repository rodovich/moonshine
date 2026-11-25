// Adding Act 6's states to maps other acts build, without editing their
// files. `extendMap(map, ext)` returns a copy of `map` with:
//
//   sheets:    { well_lift, ... }   art sheets added to the map's tileset, for the tiles below
//   hide:      [{ when: (g) => bool, ids: ['old_man', ...] }]  base entities to take away while `when` holds
//   entities:  [...]            added (they come after the base ones)
//   exits, triggers: [...]      added *before* the base ones, so they win on the same tile
//   patches:   (g) => [...]     applied after the base patches (so they win on the same tile)
//   lights:    [...] or (g) => [...]   added to the base lights
//   dark, playerLight: (g) => value or undefined   override the base while they return a value
//   lighting:  (g) => preset or undefined          the same, for the map's lighting
//   onEnter:   (g, base) => ...                     replaces the base onEnter; call base(g) to keep it
//   quiet:     (g) => bool       while true, the base map's ambient events don't run
//   ambient:   [...]            added ambient events
//
// The base map's functions are kept and called, so the other act's own story
// states keep working underneath.

const fn = (v) => (typeof v === 'function' ? v : () => v);

// A wrapper whose source text (for `npm run check`, which reads scripts'
// source for the flags, items, and maps they use) includes what it wraps.
export function joined(wrapper, ...parts) {
  const src = [wrapper, ...parts].filter((p) => typeof p === 'function').map((p) => Function.prototype.toString.call(p)).join('\n');
  wrapper.toString = () => src;
  return wrapper;
}

// A map built with composedMap(): let the check see the compose function (and
// any helpers) behind its patches, where the story flags are read.
export function showSource(map, ...fns) {
  map.patches = joined(map.patches, ...fns);
  return map;
}

export function extendMap(map, ext) {
  if (!map) return map;
  const out = { ...map };
  // Art sheets the added tiles use, beyond the map's own tileset.
  if (ext.sheets) out.tileset = { ...map.tileset, sheets: { ...map.tileset.sheets, ...ext.sheets } };
  const hide = ext.hide || [];
  const hidden = (g, id) => hide.some((h) => h.ids.includes(id) && h.when(g));
  out.entities = [
    ...(map.entities || []).map((e) => {
      if (!hide.some((h) => h.ids.includes(e.id))) return e;
      const base = e.when;
      return { ...e, when: joined((g) => !hidden(g, e.id) && (!base || base(g)), base, ...hide.map((h) => h.when)) };
    }),
    ...(ext.entities || []),
  ];
  if (ext.exits) out.exits = [...ext.exits, ...(map.exits || [])];
  if (ext.triggers) out.triggers = [...ext.triggers, ...(map.triggers || [])];
  if (ext.patches) {
    const base = map.patches;
    out.patches = joined((g) => [...(base ? base(g) || [] : []), ...(ext.patches(g) || [])], base, ext.patches);
  }
  if (ext.lights) {
    const base = fn(map.lights || []);
    const more = fn(ext.lights);
    out.lights = joined((g) => [...(base(g) || []), ...(more(g) || [])], map.lights, ext.lights);
  }
  for (const key of ['dark', 'playerLight', 'lighting']) {
    if (!ext[key]) continue;
    const baseKey = key === 'dark' && map.darkness !== undefined ? 'darkness' : key;
    const base = map[baseKey];
    delete out.darkness;
    out[key] = joined((g) => {
      const v = ext[key](g);
      if (v !== undefined) return v;
      return typeof base === 'function' ? base(g) : base;
    }, ext[key], base);
  }
  if (ext.onEnter) {
    const base = map.onEnter || (async () => {});
    out.onEnter = joined((g) => ext.onEnter(g, base), ext.onEnter, map.onEnter);
  }
  if (ext.quiet || ext.ambient) {
    const quiet = ext.quiet || (() => false);
    out.ambient = [
      ...(map.ambient || []).map((a) => ({ ...a, when: joined((g) => !quiet(g) && (!a.when || a.when(g)), quiet, a.when) })),
      ...(ext.ambient || []),
    ];
  }
  return out;
}

// Characters defined once in content.characters (by other acts): take one
// away, or put them somewhere else, while `when` holds.
export function overrideCharacter(ch, when, at = () => null) {
  if (!ch) return ch;
  const base = ch.at;
  return { ...ch, at: joined((g) => (when(g) ? at(g) : base ? base(g) : null), when, at, base) };
}

// Isometric art: PNG sprite sheets under game/assets/iso/, each described by
// a manifest. The art task renders them from source models; the engine only
// reads the PNG and the manifest. Until a sheet exists, the renderer uses
// the SNES art as a stand-in.
//
// A manifest (a JS object, or the same as JSON):
//   {
//     id: 'cheryl',                 // unique
//     replaces: 'cheryl',           // the SNES sheet name it stands in for
//                                   // (characters and objects), or
//     tiles: true,                  // a tile sheet: frames named 'sheet:frame'
//                                   // after the SNES tiles they replace
//     image: 'characters/cheryl.png',  // relative to game/assets/iso/
//     frames: {                     // name: [x, y, w, h, ax, ay]
//       walk_up_0: [0, 0, 48, 96, 24, 90],  // (ax, ay): the anchor, the
//       ...                                  // point on the floor (feet)
//     },
//     durations: { idle_down: 200 },        // ms per frame, like SNES sheets
//   }
// Frame names follow the SNES conventions (docs/decisions.md): characters
// <dir>_0..n or walk_<dir>_n and idle_<dir>_n, poses <pose>_<dir>, objects
// by their frame name. <dir> is the grid direction (up is up-right on
// screen, right is down-right, down is down-left, left is up-left). A
// missing direction falls back to its mirror, flipped, like the SNES view.
//
// Register sheets in game/assets/iso/index.js (a list of manifests).

import { sheets as assetSheets } from '../../../assets/iso/index.js';

const BASE = new URL('../../../assets/iso/', import.meta.url);
const bySnes = new Map(); // SNES sheet name -> IsoSheet
const tileFrames = new Map(); // 'sheet:frame' -> { sheet, name }

class IsoSheet {
  constructor(m) {
    this.m = m;
    this.ready = false;
    this.img = new Image();
    this.img.onload = () => { this.ready = true; };
    this.img.onerror = () => console.warn(`[iso art] couldn't load ${m.image}`);
    this.img.src = new URL(m.image, BASE).href;
    this.frames = new Map(); // name -> canvas
  }

  has(name) {
    return !!this.m.frames[name];
  }

  // The frame as { img, ax, ay } (a canvas cut from the sheet), or null.
  frame(name) {
    if (!this.ready || !this.has(name)) return null;
    let f = this.frames.get(name);
    if (!f) {
      const [x, y, w, h, ax = w / 2, ay = h] = this.m.frames[name];
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d', { willReadFrequently: true }).drawImage(this.img, x, y, w, h, 0, 0, w, h);
      f = { img: c, ax, ay };
      this.frames.set(name, f);
    }
    return f;
  }

  // Numbered frames base_0, base_1, ... or the single frame `base`.
  anim(base) {
    const out = [];
    for (let i = 0; this.has(`${base}_${i}`); i++) out.push(`${base}_${i}`);
    if (!out.length && this.has(base)) out.push(base);
    return out;
  }

  frameAt(base, ms) {
    const names = this.anim(base);
    if (!names.length) return null;
    const d = this.m.durations?.[base] ?? 150;
    return this.frame(names[Math.floor(ms / d) % names.length]);
  }
}

export function registerIsoSheet(m) {
  const s = new IsoSheet(m);
  if (m.replaces) bySnes.set(m.replaces, s);
  if (m.tiles) for (const name of Object.keys(m.frames)) tileFrames.set(name, { sheet: s, name });
  return s;
}

for (const m of assetSheets) registerIsoSheet(m);

// The isometric art for an entity's current frame, or null (use the SNES
// sprite as a stand-in). Mirrors entity.currentFrame()'s choices.
export function isoFrameFor(e) {
  const name = e.sprite && e.sprite.sheet && e.sprite.sheet.name;
  const s = name && bySnes.get(name);
  if (!s || !s.ready) return null;
  const ms = e.animMs + e.phase;
  const pick = (dir, fn) => {
    let f = fn(dir);
    if (f) return { ...f, flip: false };
    const mirror = { left: 'right', right: 'left' }[dir];
    if (mirror && (f = fn(mirror))) return { ...f, flip: true };
    return null;
  };
  if (e.pose) {
    return pick(e.facing, (d) => s.frameAt(`${e.pose}_${d}`, e.poseMs)) || (s.frameAt(e.pose, e.poseMs) && { ...s.frameAt(e.pose, e.poseMs), flip: false });
  }
  if (!e.directional) {
    const f = s.frameAt(e.sprite.frame, ms);
    return f && { ...f, flip: false };
  }
  if (e.moving || e.walkPx > 0) {
    const f = pick(e.facing, (d) => {
      const names = s.anim(`walk_${d}`).length ? s.anim(`walk_${d}`) : [1, 0, 2, 0].map((i) => `${d}_${i}`).filter((n) => s.has(n));
      return names.length ? s.frame(names[Math.floor(e.walkPx / 8) % names.length]) : null;
    });
    if (f) return f;
  }
  return pick(e.facing, (d) => s.frameAt(`idle_${d}`, ms) || s.frame(`${d}_0`)) || null;
}

// Isometric art for an SNES tile reference ('sheet:frame'), or null.
export function isoTile(ref) {
  const t = tileFrames.get(ref);
  return t ? t.sheet.frame(t.name) : null;
}

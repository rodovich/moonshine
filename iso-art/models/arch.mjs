// Architecture pieces for Tessel's surface: wall faces, windows, doors,
// parapets, stairs, roofs. Units are tiles (≈ 1 m); heights convert to screen
// pixels at 40 px per unit (ZPX).
//
// A wall piece is the face of one tile-wide column: `wallFace('s', …)` models
// the column [−0.5, 0.5]² from z = 0 to h with its features on the south face
// (+y); 'e' puts them on the east face (+x). The render is split into the
// south half (screen left of the anchor) and the east half (screen right),
// so each face is its own frame.

import { box, boxAt, union, subtract, move, place, cylinder, sphere, capsule, custom, intersect, frustum, ellipsoid, torus, roundCone, smooth } from '../lib/sdf.mjs';
import { mat, hex, mix } from '../lib/render.mjs';
import { plaster, limestone, paintedWood, wood, iron, glass, terracotta, leaf, flat, brass, bronze, fbm, vnoise } from './materials.mjs';
import { hash3, rng } from '../lib/noise.mjs';

export const U = (px) => px / 40; // screen px of height → world units

export const COLORS = {
  whitewash: '#ece6d8',
  cobalt: '#3a6cc0',
  cobaltDeep: '#244a8c',
  sage: '#6e9a66',
  sageDeep: '#4a7048',
  ochre: '#e4b870',
  rose: '#e4a898',
  stone: '#d8c09a',
  terra: '#c8683f',
  bloomRed: '#e03848',
  bloomPink: '#f080a8',
  leaf: '#4e8a3a',
};

/**
 * Orient a feature built for the south face (+y, running along x) onto a face.
 * Features are built with the face plane at y = 0, outward = +y, u = x along
 * the face, z up; `onFace` moves them to y = +0.5 (south) or rotates them to
 * x = +0.5 (east).
 */
export function onFace(node, face) {
  return face === 's' ? move(node, 0, 0.5, 0) : place(node, { at: [0.5, 0, 0], rz: -Math.PI / 2 });
}

/** Plaster wall column with optional plinth (a stone base course). */
export function wallColumn(h, { color = COLORS.whitewash, plinth = 0.2, face = 's', stain = 0.5 } = {}) {
  const pl = plaster(color, { axis: face === 's' ? 'x' : 'y', stainHeight: stain, base: plinth, top: h });
  const parts = [boxAt(-0.5, -0.5, plinth ? plinth : 0, 0.5, 0.5, h, pl)];
  if (plinth) {
    // A plastered plinth, a little proud of the wall and a shade warmer.
    parts.push(boxAt(-0.5, -0.5, 0, 0.5, 0.5, plinth, plaster('#d8ccb4', { axis: face === 's' ? 'x' : 'y' })));
    parts.push(onFace(boxAt(-0.5, -0.02, 0, 0.5, 0.025, plinth, plaster('#d4c8b0', { axis: 'x' }), 0.012), face));
  }
  return parts;
}

/** A recess (window or door opening) cut into the face: width w, from z0 to z1, depth d. */
function opening(w, z0, z1, d = 0.12, round = true) {
  const rect = boxAt(-w / 2, -d, z0, w / 2, 0.1, round ? z1 - w / 2 : z1, null);
  if (!round) return rect;
  const arch = place(cylinder(w / 2, -d, 0.1, null), { at: [0, 0, z1 - w / 2], rx: Math.PI / 2 });
  return union(rect, arch);
}

/** Shutter leaf: a slatted panel, open against the wall. */
function shutter(w, hgt, color, side) {
  const c = hex(color), deep = hex('#1c2c50');
  const m = mat((x, y, z, lx, ly, lz) => {
    const slat = ((lz + 10) * 22) % 1;
    const k = slat < 0.25 ? 0.72 : 1 - (slat - 0.25) * 0.15;
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'wall', spec: 0.15, shin: 14 });
  void deep;
  return move(box(w / 2, 0.018, hgt / 2, m, 0.008), side * 0, 0.03, 0);
}

/**
 * A window on the south face of a column: arched opening, glass set back,
 * a sill, and painted shutters folded open against the wall.
 * opts: { color (shutter), box (flower box with geraniums), z0, z1, w, closed, lit }
 */
export function windowFeature({ color = COLORS.cobalt, flowerBox = false, z0 = 0.95, z1 = 2.0, w = 0.5, closed = false, sill = true } = {}) {
  const cut = opening(w, z0, z1, 0.14, true);
  const glassM = glass({ z0, h: z1 - z0 });
  const parts = [];
  // Glass and glazing bars, set back in the opening.
  parts.push(boxAt(-w / 2, -0.15, z0, w / 2, -0.1, z1, glassM));
  const frameM = paintedWood('#e8e4d8', { tag: 'wall' });
  parts.push(boxAt(-0.012, -0.11, z0, 0.012, -0.09, z1 - 0.02, frameM));
  parts.push(boxAt(-w / 2, -0.11, (z0 + z1) / 2 - 0.05, w / 2, -0.09, (z0 + z1) / 2 - 0.03, frameM));
  // Sill.
  if (sill) parts.push(boxAt(-w / 2 - 0.05, -0.1, z0 - 0.06, w / 2 + 0.05, 0.06, z0, limestone('#e0d0b4', { tag: 'wall' }), 0.01));
  // Shutters.
  const sh = z1 - z0 - 0.05;
  if (closed) {
    parts.push(move(shutter(w / 2 - 0.01, sh, color, -1), -w / 4, -0.02, z0 + sh / 2));
    parts.push(move(shutter(w / 2 - 0.01, sh, color, 1), w / 4, -0.02, z0 + sh / 2));
  } else {
    parts.push(move(shutter(w / 2 - 0.02, sh - 0.12, color, -1), -w / 2 - w / 4 - 0.02, 0, z0 + (sh - 0.12) / 2));
    parts.push(move(shutter(w / 2 - 0.02, sh - 0.12, color, 1), w / 2 + w / 4 + 0.02, 0, z0 + (sh - 0.12) / 2));
  }
  if (flowerBox) parts.push(move(geraniumBox(w + 0.12), 0, 0.12, z0 - 0.06));
  return { cut, parts };
}

/** A painted planked door in an arched opening, with a stone step set with moon-eyes. */
export function doorFeature({ color = COLORS.cobalt, w = 0.62, z1 = 2.12, open = false } = {}) {
  const cut = opening(w, 0.0, z1, 0.16, true);
  const c = hex(color);
  const plank = mat((x, y, z, lx, ly, lz) => {
    const p = ((lx + 1) * 9) % 1;
    const g = vnoise(lx * 40, lz * 3, 0.5);
    let k = (p < 0.08 ? 0.7 : 1) * (0.92 + g * 0.12);
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'wall', spec: 0.12, shin: 12 });
  const parts = [];
  if (!open) {
    parts.push(intersect(boxAt(-w / 2, -0.13, 0.02, w / 2, -0.08, z1, plank), opening(w, 0, z1, 0.5, true)));
    // Iron ring handle and studs.
    parts.push(place(torus(0.03, 0.007, iron()), { at: [w * 0.25, -0.07, 1.0], rx: Math.PI / 2 }));
  } else {
    parts.push(boxAt(-w / 2, -0.4, 0.0, w / 2, -0.14, z1, mat('#181420', { tag: 'wall' })));
  }
  // Doorstep with three moon-eyes (blue glass studs).
  const step = limestone('#d8c8a8', { tag: 'wall' });
  parts.push(boxAt(-w / 2 - 0.06, -0.16, 0, w / 2 + 0.06, 0.14, 0.07, step, 0.015));
  const moonEye = mat('#5aa8e8', { tag: 'wall', spec: 1.0, shin: 50, emit: 0.25 });
  for (const ux of [-0.16, 0, 0.16]) parts.push(move(sphere(0.026, moonEye), ux * (w / 0.62), 0.05, 0.065));
  return { cut, parts };
}

/** A window box planted with geraniums, along x, centered at the origin (top at z = 0). */
export function geraniumBox(len) {
  const r = rng(Math.round(len * 1000));
  const box0 = boxAt(-len / 2, -0.07, -0.13, len / 2, 0.08, 0.0, terracotta('#b8603c', { tag: 'wall' }), 0.015);
  const parts = [box0];
  const leafM = leaf(COLORS.leaf, { tag: 'wall' });
  const n = Math.round(len * 14);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + 0.04 + (i / (n - 1)) * (len - 0.08);
    parts.push(move(ellipsoid(0.05, 0.05, 0.04, leafM), x + (r() - 0.5) * 0.03, (r() - 0.5) * 0.06, 0.03 + r() * 0.03));
  }
  const bloom = mat(COLORS.bloomRed, { tag: 'wall', spec: 0.1 });
  const bloom2 = mat(COLORS.bloomPink, { tag: 'wall', spec: 0.1 });
  for (let i = 0; i < Math.round(len * 7); i++) {
    const x = -len / 2 + 0.06 + r() * (len - 0.12);
    parts.push(move(sphere(0.032 + r() * 0.01, r() < 0.7 ? bloom : bloom2), x, (r() - 0.3) * 0.08, 0.08 + r() * 0.05));
  }
  return union(parts);
}

/**
 * A facade piece: one column's face of height h with a feature.
 * kind: 'plain' | 'window' | 'window_box' | 'window_closed' | 'door' | 'door_open'
 */
export function facade(face, h, kind = 'plain', opts = {}) {
  const parts = wallColumn(h, { color: opts.wall ?? COLORS.whitewash, plinth: opts.plinth ?? 0.2, face });
  let body = union(parts);
  let feature = null;
  if (kind.startsWith('window')) feature = windowFeature({ color: opts.color, flowerBox: kind === 'window_box', closed: kind === 'window_closed', z0: opts.z0 ?? 0.95, z1: opts.z1 ?? Math.min(h - 0.3, 2.0) });
  if (kind.startsWith('door')) feature = doorFeature({ color: opts.color, open: kind === 'door_open', z1: opts.z1 ?? Math.min(h - 0.2, 2.12) });
  if (kind === 'gate') feature = gateFeature({ z1: Math.min(h - 0.15, 2.1) });
  if (opts.feature) feature = opts.feature; // a feature built elsewhere (the town kit's balcony, shopfront, archway)
  if (feature) {
    body = subtract(body, onFace(feature.cut, face), plaster('#cfc8bc', { tag: 'wall' }));
    if (kind.startsWith('window')) {
      // Rain stain running down from the sill: a decal flush with the wall, fading out.
      const z0 = opts.z0 ?? 0.95;
      const wallM = plaster(opts.wall ?? COLORS.whitewash, { axis: face === 's' ? 'x' : 'y', top: h, base: opts.plinth ?? 0.2 });
      const grime = hex('#8a8078');
      const stainM = mat((x, y, z, lx, ly, lz, nx, ny, nz) => {
        const base = wallM.color(x, y, z, lx, ly, lz, nx, ny, nz);
        const u = face === 's' ? x : y;
        const t = Math.max(0, (z0 - 0.06 - z) / 0.5);
        const edge = Math.max(0, 1 - Math.abs(u) / (0.3 - t * 0.12));
        const n = vnoise(u * 30, z * 6, 4);
        return mix(base, grime, Math.min(0.28, (1 - t) * edge * (0.5 + n * 0.6) * 0.3));
      }, { tag: 'wall', spec: 0.02 });
      feature.parts.push(boxAt(-0.32, -0.01, Math.max(0.05, z0 - 0.6), 0.32, 0.003, z0 - 0.06, stainM));
    }
    return union(body, ...feature.parts.map((p) => onFace(p, face)));
  }
  return body;
}

/** A thin parapet wall along x (dir 'x') or y (dir 'y') through the tile, height h, with rounded coping. Ends are cut flat so runs join seamlessly. */
export function parapet(dir, h = 0.9, { thick = 0.3, color = '#e0e0e4', from = -0.5, to = 0.5, offset = 0 } = {}) {
  const pl = plaster(color, { axis: dir === 'x' ? 'x' : 'y' });
  const t = thick / 2;
  const cap = plaster('#fbf8f0', { axis: dir === 'x' ? 'x' : 'y', weather: false });
  // Build along x, then turn for 'y'.
  const body = boxAt(from - 0.1, offset - t, -0.02, to + 0.1, offset + t, h - 0.05, pl);
  const coping = boxAt(from - 0.1, offset - t - 0.025, h - 0.1, to + 0.1, offset + t + 0.025, h, cap, 0.045);
  const run = intersect(union(body, coping), boxAt(from, -1, -1, to, 1, h + 1, cap));
  return dir === 'x' ? run : place(run, { rz: Math.PI / 2 });
}

/** Corner post where two parapets meet: a short pier. */
export function parapetPier(h = 0.9, { color = COLORS.whitewash, ox = 0, oy = 0, w = 0.36 } = {}) {
  return union(
    boxAt(ox - w / 2, oy - w / 2, -0.02, ox + w / 2, oy + w / 2, h - 0.04, plaster(color)),
    boxAt(ox - w / 2 - 0.02, oy - w / 2 - 0.02, h - 0.08, ox + w / 2 + 0.02, oy + w / 2 + 0.02, h + 0.02, mat('#f2ece0', { tag: 'wall' }), 0.04),
  );
}

/** A flight of outside stairs descending toward +y across one tile: from z = 0 at the north edge to −drop at the south edge. */
export function stairFlight(drop = 1, { steps = 5, w = 1, stone = '#dccab0', below = 0.2, scraped = false, noseColor = '#ece0c8' } = {}) {
  const lime = limestone(stone, { tag: 'floor' });
  // The morning after: long scrapes down every step where the piano went.
  const m = scraped ? mat((x, y, z, lx, ly, lz) => (Math.abs(x - 0.08 + Math.sin(y * 7) * 0.03) < 0.05 || Math.abs(x + 0.22) < 0.025 ? hex('#a89478') : lime.color(x, y, z, lx, ly, lz)), { tag: 'floor', spec: 0.04 }) : lime;
  const nose = mat(noseColor, { tag: 'floor', spec: 0.05 });
  const parts = [];
  const run = 1 / steps, rise = drop / steps;
  for (let i = 0; i < steps; i++) {
    // Tread i covers its own strip of the run, highest at the north edge.
    const y0 = -0.5 + i * run, ztop = -rise * i;
    parts.push(boxAt(-w / 2, y0, -drop - below, w / 2, y0 + run + 0.001, ztop, m, 0.008));
    parts.push(boxAt(-w / 2, y0 + run - 0.03, ztop - 0.03, w / 2, y0 + run + 0.0, ztop, nose, 0.008));
  }
  // The first tread starts at z = 0: a landing lip.
  return union(parts);
}

export { hex, mix, mat, plaster, limestone, terracotta, leaf, flat, wood, paintedWood, iron, brass, bronze };

/** An iron gate in an arched opening (Pelletiers' gate), for a facade piece. */
export function gateFeature({ w = 0.8, z1 = 2.1 } = {}) {
  const cut = opening(w, 0, z1, 0.3, true);
  const ironM = iron('#2a2a36');
  const parts = [boxAt(-w / 2, -0.45, 0, w / 2, -0.3, z1, mat('#3a3040', { tag: 'wall' }))];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.06 + (i / (n - 1)) * (w - 0.12);
    const top = z1 - w / 2 + Math.sqrt(Math.max(0, (w / 2) ** 2 - x * x)) - 0.06;
    parts.push(capsule([x, -0.08, 0.02], [x, -0.08, top], 0.013, ironM));
    parts.push(move(sphere(0.022, ironM), x, -0.08, top + 0.01));
  }
  for (const z of [0.15, 1.0, 1.55]) parts.push(capsule([-w / 2 + 0.04, -0.08, z], [w / 2 - 0.04, -0.08, z], 0.014, ironM));
  // A padlock and chain on the middle rail.
  parts.push(move(box(0.04, 0.02, 0.05, brass(), 0.01), 0.02, -0.04, 0.95));
  return { cut, parts };
}

/** Ashlar retaining wall: a column face of fitted limestone blocks (courses 0.4 tall). */
export function retainingWall(h, { face = 's' } = {}) {
  const m = mat((x, y, z) => {
    const u = face === 's' ? x : y;
    const course = Math.floor((z + 100) / 0.4);
    const off = course % 2 ? 0.5 : 0;
    const bu = (u + 0.5) * 2 + off, blk = Math.floor(bu);
    const fu = bu - blk, fz = ((z + 100) / 0.4) % 1;
    const joint = Math.min(fu, 1 - fu) < 0.035 || Math.min(fz, 1 - fz) < 0.05;
    const id = hash3(((blk % 2) + 2) % 2, course, 21);
    const c = mix(hex('#c8b090'), hex('#dcc6a2'), id);
    const n = fbm((u + 0.5) * 8, z * 8, 1, 3, 8);
    const k = (joint ? 0.7 : 1) * (0.9 + n * 0.16);
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'wall', spec: 0.04 });
  return boxAt(-0.5, -0.5, 0, 0.5, 0.5, h, m);
}

/** A low roof seen from above: 'terra' (barrel tiles, ridge along x) or 'flat' (whitewash with a lip). */
export function lowRoof(kind = 'terra', { h = 0.5 } = {}) {
  if (kind === 'flat') {
    return union(
      boxAt(-0.5, -0.5, 0, 0.5, 0.5, h, plaster('#e8e2d6')),
      boxAt(-0.5, 0.36, h, 0.5, 0.5, h + 0.12, mat('#f0eae0', { tag: 'wall' }), 0.03),
    );
  }
  const tile = mat((x, y, z) => {
    const c = hex('#c4643e');
    const ridge = Math.abs(Math.sin((x + 10) * Math.PI * 5));
    const course = ((Math.abs(y) + 10) * 4.5) % 1;
    const n = vnoise(Math.floor((x + 10) * 5), Math.floor((y + 10) * 4.5), 3);
    const k = (0.72 + ridge * 0.3) * (course > 0.88 ? 0.75 : 1) * (0.9 + n * 0.2);
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'roof', spec: 0.12 });
  const pitch = 0.35;
  return union(
    boxAt(-0.5, -0.5, 0, 0.5, 0.5, h, plaster('#e0d8c8')),
    custom((x, y, z) => {
      const top = h + pitch - Math.abs(y) * pitch * 2 + Math.abs(Math.sin((x + 10) * Math.PI * 5)) * 0.02;
      return Math.max((z - top) * 0.8, h - z, Math.abs(x) - 0.5, Math.abs(y) - 0.52);
    }, [-0.5, -0.52, h, 0.5, 0.52, h + pitch + 0.03], tile),
  );
}

/** A plain flat roof top (unwalkable whitewash), as a diamond tile at z = 0. */
export function roofTop(color = '#ece6da') {
  return boxAt(-1.5, -1.5, -0.2, 1.5, 1.5, 0, plaster(color, { tag: 'floor' }));
}

/** A tall wall of the Crown: big limestone ashlar, darker with age; a buttress variant. */
export function crownWall(h, { buttress = false } = {}) {
  const parts = [retainingWall(h)];
  if (buttress) parts.push(boxAt(-0.25, 0.2, 0, 0.25, 0.75, h * 0.6, limestone('#c4aa88', { tag: 'wall' })));
  return union(parts);
}

/**
 * A house below the court, seen mostly from above: whitewashed walls `wallH`
 * tall over a w×d footprint (centered), and a roof: 'terra' (a hipped
 * terracotta roof) or 'flat' (a whitewashed terrace with a lip, a chimney, and
 * a basin of water set out for Moonshine Night).
 */
export function lowHouse({ w = 2, d = 2, wallH = 1.5, roof = 'terra', color = COLORS.whitewash, seed = 1 } = {}) {
  const hw = w / 2, hd = d / 2;
  const pl = plaster(color, { axis: 'x' });
  const parts = [boxAt(-hw, -hd, 0, hw, hd, wallH, pl)];
  if (roof === 'terra') {
    const tile = mat((x, y, z) => {
      const c = hex('#c4643e');
      const onX = Math.abs(x) / hw > Math.abs(y) / hd; // which slope: tiles run down each
      const along = onX ? y : x, across = onX ? x : y;
      const ridge = Math.abs(Math.sin((along + 10) * Math.PI * 5));
      const course = ((Math.abs(across) + 10) * 4.5) % 1;
      const n = vnoise(Math.floor((along + 10) * 5), Math.floor((across + 10) * 4.5), seed);
      const k = (0.72 + ridge * 0.3) * (course > 0.88 ? 0.75 : 1) * (0.9 + n * 0.2);
      return [c[0] * k, c[1] * k, c[2] * k];
    }, { tag: 'roof', spec: 0.12 });
    const rise = 0.5;
    const m0 = Math.min(hw, hd);
    parts.push(custom((x, y, z) => {
      // A hipped roof: height falls off toward every eave.
      const t = Math.min(hw + 0.08 - Math.abs(x), hd + 0.08 - Math.abs(y)) / m0;
      const top = wallH + 0.02 + Math.max(0, Math.min(1, t)) * rise;
      return Math.max((z - top) * 0.6, wallH - 0.08 - z, Math.abs(x) - hw - 0.08, Math.abs(y) - hd - 0.08);
    }, [-hw - 0.1, -hd - 0.1, wallH - 0.1, hw + 0.1, hd + 0.1, wallH + rise + 0.05], tile));
  } else {
    const cap = mat('#f2ece2', { tag: 'wall' });
    parts.push(boxAt(-hw, -hd, wallH, hw, hd, wallH + 0.02, plaster('#e6e0d4')));
    parts.push(boxAt(-hw, -hd, wallH, -hw + 0.12, hd, wallH + 0.22, cap, 0.03), boxAt(hw - 0.12, -hd, wallH, hw, hd, wallH + 0.22, cap, 0.03));
    parts.push(boxAt(-hw, -hd, wallH, hw, -hd + 0.12, wallH + 0.22, cap, 0.03), boxAt(-hw, hd - 0.12, wallH, hw, hd, wallH + 0.22, cap, 0.03));
    // A chimney, and the Moonshine Night basin.
    parts.push(boxAt(hw - 0.5, -hd + 0.2, wallH, hw - 0.2, -hd + 0.5, wallH + 0.55, plaster('#ece6da'), 0.03));
    const tin = mat('#8a9098', { tag: 'prop', spec: 0.7, shin: 30 });
    parts.push(move(subtract(cylinder(0.24, wallH, wallH + 0.14, tin, 0.02), cylinder(0.21, wallH + 0.03, wallH + 0.3, tin), tin), -0.2, 0.15, 0));
    parts.push(move(cylinder(0.21, wallH + 0.09, wallH + 0.1, mat('#b8c8e0', { tag: 'prop', spec: 1.4, shin: 60 })), -0.2, 0.15, 0));
  }
  return union(parts);
}

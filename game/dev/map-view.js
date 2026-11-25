// Dev map viewer: draws a whole map with the engine's own tile and sprite
// code, plus overlays for collision, exits, triggers, entities, and spawn.
import content from '../src/content/index.js';
import { TileMap, TILE } from '../src/engine/tilemap.js';
import { Entity } from '../src/engine/entity.js';
import { LIGHTING } from '../src/engine/world.js';
import { colorOf } from '../src/engine/art.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const maps = content.maps;

for (const id of Object.keys(maps)) $('map').add(new Option(id, id));
$('map').value = q.get('map') && maps[q.get('map')] ? q.get('map') : Object.keys(maps)[0];
$('zoom').value = q.get('zoom') || '2';
$('flags').value = q.get('flags') || '';
$('items').value = q.get('items') || '';

// A stand-in for the script API, enough for when/sprite/patch/lighting functions.
function fakeApi() {
  const flags = {};
  for (const pair of $('flags').value.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [k, v] = pair.split('=');
    flags[k] = v === undefined ? true : isNaN(Number(v)) ? v : Number(v);
  }
  const items = $('items').value.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    flag: (n) => flags[n], flags, hasItem: (i) => items.includes(i), items,
    looks: () => 0, map: $('map').value, usingTouch: false, random: (a) => a,
  };
}

function call(fn, g, fallback) {
  try {
    return fn(g);
  } catch (err) {
    errors.push(String(err));
    return fallback;
  }
}

let errors = [];
let state = null;

function render() {
  errors = [];
  const id = $('map').value;
  const def = maps[id];
  const g = fakeApi();
  const zoom = Number($('zoom').value);
  // Variant and patches, as the world applies them.
  const vi = (def.variants || []).findIndex((v) => !v.when || call(v.when, g, false));
  const v = vi >= 0 ? def.variants[vi] : null;
  const layerDef = v ? { ...def, ...v, legend: { ...def.legend, ...(v.legend || {}) }, id: def.id, tileset: def.tileset } : def;
  let map;
  try {
    map = new TileMap(layerDef);
  } catch (err) {
    $('errors').textContent = String(err);
    return;
  }
  for (const [layer, x0, y0, value, w = 1, h = 1] of (def.patches ? call(def.patches, g, []) : []) || []) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) map.setTile(layer, x, y, value);
  }
  const W = map.w * TILE;
  const H = map.h * TILE;
  const c = $('c');
  c.width = W;
  c.height = H;
  c.style.width = `${W * zoom}px`;
  c.style.height = `${H * zoom}px`;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = def.background ? colorOf(def.background) : '#000';
  ctx.fillRect(0, 0, W, H);
  map.draw(ctx, 'ground', 0, 0, W, H, 0);
  map.draw(ctx, 'detail', 0, 0, W, H, 0);
  // Entities present in this state (sprite functions evaluated).
  const ents = [];
  for (const e of def.entities || []) {
    if (e.when && !call(e.when, g, false)) continue;
    const sprite = typeof e.sprite === 'function' ? call(e.sprite, g, null) : e.sprite;
    ents.push(new Entity({ ...e, sprite }));
  }
  for (const [cid, ch] of Object.entries(content.characters || {})) {
    const at = ch.at ? call(ch.at, g, null) : null;
    if (at && at.map === id) ents.push(new Entity({ ...ch, id: cid, x: at.x, y: at.y, facing: at.facing || ch.facing }));
  }
  ents.sort((a, b) => a.sortY - b.sortY);
  for (const e of ents) e.draw(ctx, 0, 0);
  if ($('o-overhead').checked) map.draw(ctx, 'overhead', 0, 0, W, H, 0);
  if ($('o-light').checked) {
    let l = def.lighting;
    if (typeof l === 'function') l = call(l, g, null);
    for (const p of (l && { ...LIGHTING, ...(content.lighting || {}) }[l]) || []) {
      ctx.save();
      ctx.globalCompositeOperation = p.mode || 'source-over';
      ctx.globalAlpha = p.amount ?? 1;
      ctx.fillStyle = colorOf(p.color);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
  // Overlays
  ctx.save();
  if ($('o-solid').checked) {
    ctx.fillStyle = 'rgba(240, 64, 64, 0.35)';
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (map.solid(x, y)) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }
  if ($('o-grid').checked) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = 0; x <= map.w; x++) ctx.fillRect(x * TILE, 0, 1, H);
    for (let y = 0; y <= map.h; y++) ctx.fillRect(0, y * TILE, W, 1);
  }
  if ($('o-exits').checked) {
    for (const ex of def.exits || []) {
      const open = !ex.when || call(ex.when, g, false);
      ctx.fillStyle = open ? 'rgba(64, 224, 224, 0.5)' : 'rgba(64, 224, 224, 0.2)';
      ctx.fillRect(ex.x * TILE, ex.y * TILE, (ex.w || 1) * TILE, (ex.h || 1) * TILE);
    }
  }
  if ($('o-triggers').checked) {
    ctx.strokeStyle = '#f0d040';
    for (const t of def.triggers || []) ctx.strokeRect(t.x * TILE + 0.5, t.y * TILE + 0.5, (t.w || 1) * TILE - 1, (t.h || 1) * TILE - 1);
  }
  if ($('o-entities').checked) {
    ctx.strokeStyle = '#f080f0';
    for (const e of ents) ctx.strokeRect(e.x * TILE + 1.5, e.y * TILE + 1.5, e.w * TILE - 3, e.h * TILE - 3);
  }
  ctx.fillStyle = '#80f080';
  const dot = (x, y) => ctx.fillRect(x * TILE + 6, y * TILE + 6, 4, 4);
  if (def.spawn) dot(...def.spawn);
  if (content.start?.map === id) dot(content.start.x, content.start.y);
  ctx.restore();
  state = { def, map, ents, g };
  $('info').textContent = `${id}: ${map.w}×${map.h} tiles${v ? `, variant ${vi}` : ''}; ${ents.length} entities, ${(def.exits || []).length} exits, ${(def.triggers || []).length} triggers.`;
  $('errors').textContent = errors.join('\n');
  const params = new URLSearchParams({ map: id, zoom: $('zoom').value });
  if ($('flags').value) params.set('flags', $('flags').value);
  if ($('items').value) params.set('items', $('items').value);
  history.replaceState(null, '', `?${params}`);
}

function tileAt(ev) {
  const r = $('c').getBoundingClientRect();
  const zoom = Number($('zoom').value);
  return [Math.floor((ev.clientX - r.left) / zoom / TILE), Math.floor((ev.clientY - r.top) / zoom / TILE)];
}

$('c').addEventListener('mousemove', (ev) => {
  if (!state) return;
  const [x, y] = tileAt(ev);
  const { def, map, ents } = state;
  if (!map.inBounds(x, y)) return;
  const lines = [`(${x}, ${y})${map.solid(x, y) ? '  solid' : ''}`];
  for (const layer of ['ground', 'detail', 'overhead']) {
    const t = map.tile(layer, x, y);
    if (t) lines.push(`${layer}: ${t.name}`);
  }
  const inA = (a) => x >= a.x && y >= a.y && x < a.x + (a.w || 1) && y < a.y + (a.h || 1);
  for (const ex of def.exits || []) if (inA(ex)) lines.push(`exit → ${ex.to || '(script)'} ${ex.at ? `(${ex.at})` : ''}${ex.when ? ' [when]' : ''}${ex.blocked ? ' [blocked line]' : ''}`);
  for (const t of def.triggers || []) if (inA(t)) lines.push(`trigger${t.when ? ' [when]' : ''}`);
  for (const e of ents) if (inA(e)) lines.push(`entity ${e.id}${e.name ? ` "${e.name}"` : ''}`);
  const tip = $('tip');
  tip.textContent = lines.join('\n');
  tip.style.display = 'block';
  tip.style.left = `${ev.clientX + 14}px`;
  tip.style.top = `${ev.clientY + 14}px`;
});
$('c').addEventListener('mouseleave', () => { $('tip').style.display = 'none'; });
$('c').addEventListener('click', (ev) => {
  const [x, y] = tileAt(ev);
  const params = new URLSearchParams({ map: $('map').value, x, y });
  if ($('flags').value) params.set('flags', $('flags').value);
  if ($('items').value) params.set('items', $('items').value);
  window.open(`../index.html?${params}`, '_blank');
});
for (const el of document.querySelectorAll('select, input')) el.addEventListener('change', render);
render();

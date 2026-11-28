// The isometric view (?view=iso): 640×480, 2:1 dimetric, the same game.
// See view.js for the interface and README.md, "Isometric view".

import { TILE } from '../tilemap.js';
import { colorOf, loadSheet } from '../art.js';
import { safeCall } from '../world.js';
import { inRect } from '../ui.js';
import { ISO_W, ISO_H, HW, proj } from './project.js';
import { IsoRenderer } from './render.js';
import { draftOverrides } from './convert.js';
import { bindSnesSheets } from './sprites.js';
import { artSkin } from './artskin.js';
import { ISO_TINTS } from '../../../assets/iso/tints.js';
import { IsoTextBox, IsoInventory, IsoTitle, drawHud, drawBark, drawHint, drawCard, BAG_BTN, BANNER, setIsoSkin, standIn } from './ui.js';

// Arrow keys -> grid directions. The grid's axes run along the screen's
// diagonals; 'cw' (the default) turns each arrow 45° clockwise: Up walks
// up-right (the grid's up), Right down-right, Down down-left, Left up-left.
// 'ccw' turns them the other way (Up walks up-left). ?keys=ccw tries it.
const KEYMAPS = {
  cw: { up: 'up', right: 'right', down: 'down', left: 'left' },
  ccw: { up: 'left', left: 'down', down: 'right', right: 'up' },
};

export class IsoView {
  constructor() {
    this.kind = 'iso';
    this.display = { width: ISO_W, height: ISO_H, phonePanels: false };
    // Camera glides are in world pixels (16 per tile); a tile here is ~36 px along a diagonal.
    this.panScale = 2.25;
    this.renderer = new IsoRenderer();
    let keys = 'cw';
    try { keys = new URLSearchParams(location.search).get('keys') || 'cw'; } catch { /* ignore */ }
    this.keymap = KEYMAPS[keys] || KEYMAPS.cw;
    this.picCanvas = null;
    this.bagButton = BAG_BTN;
    // Lighting presets for the isometric art (game/assets/iso/tints.js), by
    // the same names as the SNES ones they replace.
    this.lighting = Object.fromEntries(Object.entries(ISO_TINTS).map(([k, t]) => [k, (Array.isArray(t) ? t : [t]).filter((p) => (p.amount ?? 1) > 0)]));
  }

  // The current map's converter draft as override rows (for the console).
  draft() {
    const w = window.moonshine.world;
    return draftOverrides(this.renderer.model(w));
  }

  // Called once the game exists: content says which art draws what.
  attach(game) {
    bindSnesSheets(game.content.iso?.sheets, game.content.iso?.aliases);
    setIsoSkin(artSkin(standIn));
  }

  makeTextBox() { return new IsoTextBox(); }
  makeInventory(items) { return new IsoInventory(items); }
  makeTitle(game, state) { return new IsoTitle(game, state); }

  drawScene(ctx, world) {
    if (world.picture) this.drawPicture(ctx, world);
    else {
      this.renderer.draw(ctx, world);
      if (world.effects.hasLight()) world.effects.applyLight(ctx, 1);
      this.drawDarkness(ctx, world);
      this.drawEmotes(ctx, world);
      world.effects.applyWorld(ctx);
    }
    if (!world.busy && !world.textbox.open && !world.inventory.open && !world.picture) drawHud(ctx, world);
    if (!world.picture) drawBark(ctx, world);
    drawHint(ctx, world);
    world.inventory.draw(ctx);
    world.textbox.draw(ctx, world.picture ? 0 : this.playerScreenY(world));
  }

  // Full-screen pictures are 256×224 scenes; shown at 2×, centered, until
  // the art task gives a picture its own 640×480 version (spec.iso: a
  // draw(ctx, ms) function or { sheet, frame } in the isometric art).
  drawPicture(ctx, world) {
    if (!this.picCanvas) {
      this.picCanvas = document.createElement('canvas');
      this.picCanvas.width = 256;
      this.picCanvas.height = 224;
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ISO_W, ISO_H);
    const pic = world.picture;
    if (pic.spec && typeof pic.spec.iso === 'function') {
      pic.spec.iso(ctx, pic.ms);
      world.effects.applyWorld(ctx);
      return;
    }
    const pc = this.picCanvas.getContext('2d');
    pc.imageSmoothingEnabled = false;
    world.drawPicture(pc);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.picCanvas, (ISO_W - 512) / 2, (ISO_H - 448) / 2, 512, 448);
  }

  drawCard(ctx, text) { drawCard(ctx, text); }

  clampCamera(world, cx, cy) {
    const r = this.renderer;
    r.model(world);
    const t = r.worldToMap(world, cx, cy);
    const b = r.bounds(world);
    let x = Math.round(t.x - ISO_W / 2);
    let y = Math.round(t.y - ISO_H / 2);
    const bw = b.x1 - b.x0;
    const bh = b.y1 - b.y0;
    x = bw <= ISO_W ? Math.round(b.x0 - (ISO_W - bw) / 2) : Math.max(b.x0, Math.min(b.x1 - ISO_W, x));
    y = bh <= ISO_H ? Math.round(b.y0 - (ISO_H - bh) / 2) : Math.max(b.y0, Math.min(b.y1 - ISO_H, y));
    return { x, y };
  }

  pick(world, sx, sy) {
    return this.renderer.pick(world, sx, sy);
  }

  hudHit(world, p) {
    if (inRect(p, { x: BAG_BTN.x - 6, y: 0, w: BAG_BTN.w + 12, h: BAG_BTN.h + 14 })) return 'bag';
    if (world.control.holding && inRect(p, { ...BANNER, w: world.control.bannerW || 0 })) return 'banner';
    return null;
  }

  hudHover(world, p) {
    return inRect(p, BAG_BTN);
  }

  onScreen(p) {
    return p.x >= 0 && p.y >= 0 && p.x < ISO_W && p.y < ISO_H;
  }

  mapDir(dir) {
    return dir ? this.keymap[dir] : dir;
  }

  // Can a click reach this tile (is any of it visible)?
  clickable(world, tx, ty) {
    const q = this.tileToScreen(world, tx, ty);
    const k = this.pick(world, q.x, q.y);
    if (k.entity) return k.entity.occupies(tx, ty);
    return k.tx === tx && k.ty === ty;
  }

  // The center of a tile's top on screen.
  tileCenter(world, tx, ty) {
    const r = this.renderer;
    r.model(world);
    const c = r.iso.at(tx, ty);
    const z = r.sceneReady(world) && world.mapDef.iso.floor ? r.floorZ(world, tx + 0.5, ty + 0.5) : c ? r.top(c) ?? 0 : 0;
    const q = proj(tx + 0.5, ty + 0.5, z, r.ox);
    return { x: q.x - world.cam.x, y: q.y - world.cam.y };
  }

  // Where a player would click to reach a tile: a character or object drawn
  // standing on it, else a visible part of the tile (something in front may
  // hide its center), else its center.
  tileToScreen(world, tx, ty) {
    const e = world.entities.find((o) => !o.isPlayer && o.visible && o.isoRect && o.x === tx && o.y + o.h - 1 === ty);
    if (e) return { x: e.isoRect.x + e.isoRect.w / 2, y: e.isoRect.y + e.isoRect.h * 0.6 };
    // A door in a wall: the door itself, low on the wall's face.
    const r = this.renderer;
    const cell = r.model(world) && r.iso.at(tx, ty);
    if (cell && cell.kind === 'door') {
      for (const up of [12, 20, 28, 6]) {
        const q = proj(tx + 0.5, ty + 1, cell.z + up, r.ox);
        const p = { x: q.x - world.cam.x, y: q.y - world.cam.y }; // the middle of its south face
        const k = this.pick(world, p.x, p.y);
        if (k.tx === tx && k.ty === ty && (!k.entity || k.entity.occupies(tx, ty))) return p;
      }
    }
    const c = this.tileCenter(world, tx, ty);
    // Search the diamond, nearest the center first.
    const pts = [];
    for (let dy = -14; dy <= 14; dy += 2) {
      for (let dx = -28; dx <= 28; dx += 4) if (Math.abs(dx) / 32 + Math.abs(dy) / 16 < 0.95) pts.push([dx, dy]);
    }
    pts.sort((a, b) => Math.hypot(a[0] / 2, a[1]) - Math.hypot(b[0] / 2, b[1]));
    for (const [dx, dy] of pts) {
      const k = this.pick(world, c.x + dx, c.y + dy);
      if (k.tx === tx && k.ty === ty && (!k.entity || k.entity.occupies(tx, ty))) return { x: c.x + dx, y: c.y + dy };
    }
    return c;
  }

  playerScreenY(world) {
    const p = world.player;
    const q = this.renderer.worldToMap(world, p.px + TILE / 2, p.py + TILE / 2);
    return q.y - world.cam.y;
  }

  drawEmotes(ctx, world) {
    const small = world.ambient.small;
    for (const [e, em] of world.ambient.emotes) {
      const d = e.isoRect;
      if (!d || !e.visible) continue;
      const art = em.sheet ? loadSheet(em.sheet) : small;
      const img = art.frame(em.frame);
      if (!img) continue;
      const bob = Math.floor(em.t / 15) % 2;
      ctx.drawImage(img, Math.round(d.x + d.w / 2 - img.width), d.y - img.height * 2 - 2 - bob * 2, img.width * 2, img.height * 2);
    }
  }

  // Darkness with light pools, as in the SNES view: lights are circles on
  // the floor, so here they're 2:1 ellipses.
  drawDarkness(ctx, world) {
    const def = world.mapDef;
    let dark = def.darkness ?? def.dark;
    if (typeof dark === 'function') dark = safeCall(dark, world.api);
    if (!dark) return;
    const r = this.renderer;
    const asLight = (l) => (typeof l === 'number' ? { radius: l } : l);
    let mapLights = def.lights || [];
    if (typeof mapLights === 'function') mapLights = safeCall(mapLights, world.api) || [];
    const lights = mapLights.filter((l) => !l.when || safeCall(l.when, world.api)).map((l) => ({ wx: l.x * TILE + TILE / 2, wy: l.y * TILE + TILE / 2, r: l.radius, color: l.color }));
    for (const e of world.entities) {
      const l = e.visible && e.def.light && asLight(e.def.light);
      if (l) lights.push({ wx: e.px + (e.w * TILE) / 2, wy: e.py + (e.h * TILE) / 2, r: l.radius, color: l.color });
    }
    let pl = def.playerLight ?? world.content.playerLight;
    if (typeof pl === 'function') pl = safeCall(pl, world.api);
    if (pl) {
      pl = asLight(pl);
      lights.push({ wx: world.player.px + TILE / 2, wy: world.player.py + TILE / 2, r: pl.radius, color: pl.color });
    }
    const layer = world.layer('dark');
    layer.fillStyle = colorOf(def.darkColor || 'void');
    layer.fillRect(0, 0, ISO_W, ISO_H);
    const cx = world.cam.x;
    const cy = world.cam.y;
    const areas = def.lightArea || [[0, 0, world.map.w, world.map.h]];
    const clipTo = (c) => {
      c.beginPath();
      for (const [x, y, w, h] of areas) {
        const a = proj(x, y, 0, r.ox);
        const b = proj(x + w, y, 0, r.ox);
        const d = proj(x + w, y + h, 0, r.ox);
        const e = proj(x, y + h, 0, r.ox);
        // Up to the tallest thing in the area, so walls inside stay lit.
        c.moveTo(a.x - cx, a.y - cy - 160);
        c.lineTo(b.x - cx, b.y - cy - 160);
        c.lineTo(b.x - cx, b.y - cy);
        c.lineTo(d.x - cx, d.y - cy);
        c.lineTo(e.x - cx, e.y - cy);
        c.lineTo(e.x - cx, e.y - cy - 160);
        c.closePath();
      }
      c.clip();
    };
    const pools = lights.map((l) => {
      const q = r.worldToMap(world, l.wx, l.wy);
      return { x: q.x - cx, y: q.y - cy - 16, rx: l.r * HW * 1.414, ry: l.r * HW * 0.85, color: l.color };
    });
    layer.save();
    clipTo(layer);
    layer.globalCompositeOperation = 'destination-out';
    for (const p of pools) {
      for (const [k, a] of [[1, 0.4], [0.75, 0.6], [0.5, 1]]) {
        layer.globalAlpha = a;
        layer.beginPath();
        layer.ellipse(p.x, p.y, p.rx * k, p.ry * k, 0, 0, Math.PI * 2);
        layer.fill();
      }
    }
    layer.restore();
    ctx.save();
    ctx.globalAlpha = Math.min(1, dark);
    ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
    ctx.save();
    clipTo(ctx);
    ctx.globalCompositeOperation = 'screen';
    for (const p of pools) {
      if (!p.color) continue;
      ctx.fillStyle = colorOf(p.color);
      for (const [k, a] of [[1, 0.12], [0.5, 0.12]]) {
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx * k, p.ry * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

// Views: how the shared game (world, scripts, saves, pathfinding, input
// meaning) is presented. The SNES view is the original 256×224 top-down
// presentation; the isometric view (src/engine/iso/) draws the same grid at
// 640×480 in 2:1 dimetric. See README.md, "Isometric view", and docs/iso.md.
//
// A view provides:
//   kind                      'snes' | 'iso'
//   display                   options for Display: { width, height, phonePanels }
//   makeTextBox(), makeInventory(items), makeTitle(game, state)
//   drawScene(ctx, world)     the world and its UI (text box, bag, hint, bark)
//   drawCard(ctx, text)       a centered text card on black
//   clampCamera(world, x, y)  camera for a target in world pixels (16 per tile)
//   panScale                  camera glide speeds are in world pixels; scaled by this
//   pick(world, sx, sy)       { entity, tx, ty } under a point on screen
//   hudHit(world, p)          'bag' | 'banner' | null for a tap on the HUD
//   onScreen(p)               is a point inside the frame
//   mapDir(dir)               arrow key -> grid direction
//   tileToScreen(world, x, y) where to click to reach a tile (tests)
//   playerScreenY(world)      for text boxes that keep off Cheryl

import { WIDTH, HEIGHT } from './display.js';
import { TILE } from './tilemap.js';
import { TextBox } from './textbox.js';
import { Inventory } from './inventory.js';
import { Title } from './title.js';
import { wrap, drawTextCentered, LINE_HEIGHT } from './text.js';
import { inRect } from './ui.js';
import { IsoView } from './iso/view.js';

const KEY = 'moonshine.view';

// ?view=iso or ?view=snes picks a view and remembers it; otherwise the
// remembered one; otherwise SNES.
export function chooseView(search = location.search) {
  const q = new URLSearchParams(search).get('view');
  if (q === 'iso' || q === 'snes') {
    try { localStorage.setItem(KEY, q); } catch { /* ignore */ }
    return q;
  }
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'iso' || v === 'snes') return v;
  } catch { /* ignore */ }
  return 'snes';
}

export class SnesView {
  constructor() {
    this.kind = 'snes';
    this.display = { width: WIDTH, height: HEIGHT, phonePanels: true };
    this.panScale = 1;
  }

  makeTextBox() { return new TextBox(); }
  makeInventory(items) { return new Inventory(items); }
  makeTitle(game, state) { return new Title(game, state); }

  drawScene(ctx, world) { world.drawSnes(ctx); }

  drawCard(ctx, text) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const lines = wrap(text, WIDTH - 48);
    const top = Math.round(HEIGHT / 2 - (lines.length * LINE_HEIGHT) / 2);
    lines.forEach((line, i) => drawTextCentered(ctx, line, WIDTH / 2, top + i * LINE_HEIGHT, { color: 'ui_text' }));
  }

  clampCamera(world, cx, cy) {
    const mw = world.map.w * TILE;
    const mh = world.map.h * TILE;
    let x = Math.round(cx - WIDTH / 2);
    let y = Math.round(cy - HEIGHT / 2);
    x = mw <= WIDTH ? Math.floor((mw - WIDTH) / 2) : Math.max(0, Math.min(mw - WIDTH, x));
    y = mh <= HEIGHT ? Math.floor((mh - HEIGHT) / 2) : Math.max(0, Math.min(mh - HEIGHT, y));
    return { x, y };
  }

  pick(world, sx, sy) {
    return {
      entity: world.control.entityAtPoint(sx, sy),
      tx: Math.floor((sx + world.cam.x) / TILE),
      ty: Math.floor((sy + world.cam.y) / TILE),
    };
  }

  hudHit(world, p) {
    const c = world.control;
    if (inRect(p, c.constructor.BAG_HIT)) return 'bag';
    if (c.holding && inRect(p, { ...c.constructor.HOLD_BANNER, w: c.bannerW || 0 })) return 'banner';
    return null;
  }

  hudHover(world, p) {
    return inRect(p, world.control.constructor.BAG_BTN);
  }

  onScreen(p) {
    return p.x >= 0 && p.y >= 0 && p.x < WIDTH && p.y < HEIGHT;
  }

  mapDir(dir) { return dir; }

  tileToScreen(world, tx, ty) {
    return { x: tx * TILE + TILE / 2 - world.cam.x, y: ty * TILE + TILE / 2 - world.cam.y };
  }

  playerScreenY(world) {
    return world.player.py - world.cam.y;
  }
}

export function makeView(kind) {
  return kind === 'iso' ? new IsoView() : new SnesView();
}

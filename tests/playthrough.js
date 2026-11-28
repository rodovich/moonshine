// Keyboard and pointer helpers for playthrough tests (shared by the opening's
// and later acts' specs). Keyboard helpers press arrows and Z only; pointer
// helpers click and tap only.
import { expect } from '@playwright/test';
import { boot, snap, waitFor, stepKey } from './helpers.js';

export const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

// ---- shared ---------------------------------------------------------------

// Wait until the text box has finished typing (for screenshots).
export async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const tb = window.moonshine.world?.textbox;
    return !tb || !tb.open || tb.revealed();
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

export async function newGame(page) {
  await page.goto('/');
  // Clear the save (but not the remembered view: the iso project relies on it).
  await page.evaluate(() => localStorage.removeItem('moonshine.save.v1'));
  const errors = await boot(page, '');
  await page.waitForTimeout(500);
  return errors;
}

// Advance text with `advance` until no text is showing and no script is
// running (or `stop(snapshot)` is true). Collects every page of text seen.
export async function readThrough(page, advance, { stop = null, timeout = 90000, log = [] } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  while (Date.now() < end) {
    const s = await snap(page);
    if (stop && stop(s)) return log;
    if (!s.text && !s.busy && !s.moving) {
      await page.waitForTimeout(120);
      const again = await snap(page);
      if (!again.text && !again.busy && !again.moving) return log;
      continue;
    }
    if (s.text) {
      if (s.text !== last) log.push(s.speaker ? `${s.speaker}: ${s.text}` : s.text);
      last = s.text;
      // Passing a prompt on the way somewhere ("Go down?" over the open hundredth step): decline it.
      if (s.choice && s.choice.includes('Not yet')) {
        if (advance.pointer) {
          // Tap the option itself.
          const p = await page.evaluate(() => {
            const c = window.moonshine.world.textbox.active.choice;
            const r = c.rects[c.options.indexOf('Not yet')];
            return r && window.moonshine.display.toClient(r.x + r.w / 2, r.y + r.h / 2);
          });
          if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(90); continue; }
        } else {
          await page.keyboard.press('ArrowDown');
        }
      }
      await advance();
    }
    await page.waitForTimeout(90);
  }
  throw new Error(`text never finished; last: ${last}`);
}

export const pageTexts = (log) => log.join('\n').replace(/\s+/g, ' ');

// ---- keyboard -------------------------------------------------------------

export const kbAdvance = (page) => () => page.keyboard.press('z');

// Step along a path to (x, y) with the arrow keys.
export async function kbWalk(page, x, y) {
  let blockedFor = 0;
  for (let guard = 0; guard < 80; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    const next = await page.evaluate(([x, y]) => {
      const w = window.moonshine.world;
      const path = w.pathFor(w.player, [[x, y]]);
      return path && path[0];
    }, [x, y]);
    if (!next) {
      // Someone may be standing in a narrow way (the Kid on the Steps): wait for them, like a player would.
      if ((blockedFor = (blockedFor || 0) + 1) > 20) throw new Error(`no path from ${s.x},${s.y} to ${x},${y}`);
      await page.waitForTimeout(300);
      continue;
    }
    blockedFor = 0;
    const dir = next[0] > s.x ? 'right' : next[0] < s.x ? 'left' : next[1] > s.y ? 'down' : 'up';
    await stepKey(page, dir);
    await waitFor(page, ([nx, ny]) => {
      const p = window.moonshine.snapshot();
      return (p.x === nx && p.y === ny && !p.moving) || !!p.text || p.busy;
    }, next, 4000);
    const after = await snap(page);
    if (after.text || after.busy) return; // a trigger or exit took over
  }
  throw new Error(`never reached ${x},${y}`);
}

// Turn toward something solid (an arrow key toward a blocked tile only turns).
export async function kbFace(page, dir) {
  await page.keyboard.press(DIRKEY[dir]);
  await page.waitForTimeout(80);
  expect((await snap(page)).facing).toBe(dir);
}

// Walk up to an entity (re-planning as it moves), face it, and press Z.
export async function kbInteract(page, id, item = null) {
  for (let guard = 0; guard < 60; guard++) {
    const spot = await page.evaluate((id) => {
      const w = window.moonshine.world;
      const e = w.entity(id);
      if (!e) return { missing: `${w.state.map} has no entity "${id}" (present: ${w.entities.map((x) => x.id).join(', ')})` };
      const spots = w.interactSpots(e);
      const p = w.player;
      const here = spots.find((s) => s.x === p.x && s.y === p.y);
      if (here) return { here: true, ...here };
      const path = w.pathFor(p, spots.map((s) => [s.x, s.y]));
      return path && path.length ? { next: path[0] } : null;
    }, id);
    if (spot && spot.missing) throw new Error(spot.missing);
    if (!spot) throw new Error(`can't reach ${id}`);
    if (spot.here) {
      await kbFace(page, spot.facing);
      if (item) await kbHold(page, item);
      await page.keyboard.press('z');
      await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text);
      return;
    }
    const s = await snap(page);
    const [nx, ny] = spot.next;
    const dir = nx > s.x ? 'right' : nx < s.x ? 'left' : ny > s.y ? 'down' : 'up';
    await stepKey(page, dir);
    await page.waitForTimeout(60);
    await waitFor(page, () => !window.moonshine.snapshot().moving, null, 4000);
  }
  throw new Error(`never got to ${id}`);
}

// Open the bag (X), pick `item` with the arrows, and choose it (Z).
export async function kbHold(page, item) {
  await page.keyboard.press('x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const s = await snap(page);
  const i = s.items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const cur = await page.evaluate(() => window.moonshine.world.inventory.openState.index);
  for (let k = 0; k < (i - cur + s.items.length) % s.items.length; k++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('z');
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
}

// ---- pointer --------------------------------------------------------------

export async function clickTileAt(page, tx, ty) {
  const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [tx, ty]);
  await page.mouse.click(p.x, p.y);
}

export const ptrAdvance = (page) => Object.assign(async () => {
  const p = await page.evaluate(() => window.moonshine.uiToClient('center'));
  await page.mouse.click(p.x, p.y);
}, { pointer: true });

export const onScreen = (page, tx, ty) => page.evaluate(([x, y]) => {
  const w = window.moonshine.world;
  const [sx, sy] = window.moonshine.tileScreen(x, y);
  // Anywhere on screen except the bag button's corner (top right).
  return sx >= 4 && sy >= 4 && sx < 252 && sy < 220 && !(sx >= 224 && sy < 30);
}, [tx, ty]);

// Click toward (x, y); if it's off screen, click the farthest on-screen tile
// along the way first.
export async function ptrWalk(page, x, y) {
  for (let guard = 0; guard < 12; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    if (await onScreen(page, x, y)) {
      await clickTileAt(page, x, y);
    } else {
      const step = await page.evaluate(([x, y]) => {
        const w = window.moonshine.world;
        const path = w.pathFor(w.player, [[x, y]]);
        let best = null;
        for (const [px, py] of path || []) {
          const [sx, sy] = window.moonshine.tileScreen(px, py);
          // Anywhere on screen but the bag button's corner, as in onScreen.
          if (sx >= 4 && sy >= 4 && sx < 252 && sy < 220 && !(sx >= 224 && sy < 30) && !w.isExit(px, py)) best = [px, py];
        }
        return best;
      }, [x, y]);
      if (!step) {
        const why = await page.evaluate(([x, y]) => { const w = window.moonshine.world; const path = w.pathFor(w.player, [[x, y]]); return `from ${w.player.x},${w.player.y} on ${w.state.map}, camera ${w.cam.x},${w.cam.y}, path ${path ? JSON.stringify(path.slice(0, 6)) : 'none'}`; }, [x, y]);
        throw new Error(`no on-screen step toward ${x},${y} (${why})`);
      }
      await clickTileAt(page, step[0], step[1]);
    }
    await page.waitForTimeout(100);
    await waitFor(page, () => { const p = window.moonshine.snapshot(); return p.idle || p.busy || !!p.text; }, null, 10000);
    const after = await snap(page);
    if (after.busy || after.text) return;
  }
  throw new Error(`never reached ${x},${y}`);
}

// Click an entity (walking over first if it's off screen).
export async function ptrInteract(page, id) {
  for (let guard = 0; guard < 10; guard++) {
    const e = await page.evaluate((id) => {
      const w = window.moonshine.world;
      const en = w.entity(id);
      if (!en) return { missing: `${w.state.map} has no entity "${id}" (present: ${w.entities.map((x) => x.id).join(', ')})` };
      return { x: en.x, y: en.y, w: en.w || 1, h: en.h || 1 };
    }, id);
    if (e.missing) throw new Error(e.missing);
    // Click the footprint's lowest on-screen tile, as a player would click the visible part of a
    // tall thing (in the isometric view a tower's top row can be far off the top of the screen).
    let hit = null;
    for (let y = e.y + e.h - 1; y >= e.y && !hit; y--) for (let x = e.x; x < e.x + e.w && !hit; x++) if (await onScreen(page, x, y)) hit = [x, y];
    if (hit) {
      await clickTileAt(page, hit[0], hit[1]);
      await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text, null, 10000);
      return;
    }
    const s = await snap(page);
    // Get closer: walk partway toward it.
    const near = await page.evaluate((id) => {
      const w = window.moonshine.world;
      const spots = w.interactSpots(w.entity(id));
      const path = w.pathFor(w.player, spots.map((s) => [s.x, s.y]));
      let best = null;
      for (const [px, py] of path || []) {
        const [sx, sy] = window.moonshine.tileScreen(px, py);
        if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py)) best = [px, py];
      }
      return best;
    }, id);
    if (!near || (near[0] === s.x && near[1] === s.y)) throw new Error(`can't get toward ${id}`);
    await clickTileAt(page, near[0], near[1]);
    await page.waitForTimeout(100);
    // A tile on the way may hold a hotspot (the washing over the dry Bilge's quay); read its look and go on.
    for (let i = 0; i < 20; i++) {
      await waitFor(page, () => { const p = window.moonshine.snapshot(); return p.idle || !!p.text; }, null, 10000);
      if (!(await snap(page)).text) break;
      await ptrAdvance(page)();
      await page.waitForTimeout(150);
    }
  }
  throw new Error(`never got to ${id}`);
}

// Tap the bag button, tap the item twice (select, use), then tap the target.
export async function ptrUse(page, item, id) {
  const bag = await page.evaluate(() => window.moonshine.uiToClient('bag'));
  await page.mouse.click(bag.x, bag.y);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const slot = await page.evaluate((i) => window.moonshine.uiToClient('slot', i), i);
  await page.mouse.click(slot.x, slot.y);
  await page.waitForTimeout(100);
  await page.mouse.click(slot.x, slot.y);
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id);
}


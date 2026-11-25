// Plays the whole opening, start to finish: once by keyboard alone, once by
// pointer alone. Screenshots of key moments go to tests/screenshots/opening-*.
import { test, expect } from '@playwright/test';
import { boot, snap, waitFor, shot } from './helpers.js';

const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

// ---- shared ---------------------------------------------------------------

// Wait until the text box has finished typing (for screenshots).
async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const tb = window.moonshine.world?.textbox;
    return !tb || !tb.open || tb.revealed();
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function newGame(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  const errors = await boot(page, '');
  await page.waitForTimeout(500);
  return errors;
}

// Advance text with `advance` until no text is showing and no script is
// running (or `stop(snapshot)` is true). Collects every page of text seen.
async function readThrough(page, advance, { stop = null, timeout = 90000, log = [] } = {}) {
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
      await advance();
    }
    await page.waitForTimeout(90);
  }
  throw new Error(`text never finished; last: ${last}`);
}

const pageTexts = (log) => log.join('\n').replace(/\s+/g, ' ');

// ---- keyboard -------------------------------------------------------------

const kbAdvance = (page) => () => page.keyboard.press('z');

// Step along a path to (x, y) with the arrow keys.
async function kbWalk(page, x, y) {
  for (let guard = 0; guard < 80; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    const next = await page.evaluate(([x, y]) => {
      const w = window.moonshine.world;
      const path = w.pathFor(w.player, [[x, y]]);
      return path && path[0];
    }, [x, y]);
    if (!next) throw new Error(`no path from ${s.x},${s.y} to ${x},${y}`);
    const dir = next[0] > s.x ? 'right' : next[0] < s.x ? 'left' : next[1] > s.y ? 'down' : 'up';
    await page.keyboard.press(DIRKEY[dir]);
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
async function kbFace(page, dir) {
  await page.keyboard.press(DIRKEY[dir]);
  await page.waitForTimeout(80);
  expect((await snap(page)).facing).toBe(dir);
}

// Walk up to an entity (re-planning as it moves), face it, and press Z.
async function kbInteract(page, id, item = null) {
  for (let guard = 0; guard < 60; guard++) {
    const spot = await page.evaluate((id) => {
      const w = window.moonshine.world;
      const e = w.entity(id);
      const spots = w.interactSpots(e);
      const p = w.player;
      const here = spots.find((s) => s.x === p.x && s.y === p.y);
      if (here) return { here: true, ...here };
      const path = w.pathFor(p, spots.map((s) => [s.x, s.y]));
      return path && path.length ? { next: path[0] } : null;
    }, id);
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
    await page.keyboard.press(DIRKEY[dir]);
    await page.waitForTimeout(60);
    await waitFor(page, () => !window.moonshine.snapshot().moving, null, 4000);
  }
  throw new Error(`never got to ${id}`);
}

// Open the bag (X), pick `item` with the arrows, and choose it (Z).
async function kbHold(page, item) {
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

async function clickTileAt(page, tx, ty) {
  const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [tx, ty]);
  await page.mouse.click(p.x, p.y);
}

const ptrAdvance = (page) => async () => {
  const p = await page.evaluate(() => window.moonshine.display.toClient(128, 112));
  await page.mouse.click(p.x, p.y);
};

const onScreen = (page, tx, ty) => page.evaluate(([x, y]) => {
  const w = window.moonshine.world;
  const sx = x * 16 + 8 - w.cam.x;
  const sy = y * 16 + 8 - w.cam.y;
  return sx >= 4 && sy >= 30 && sx < 252 && sy < 220;
}, [tx, ty]);

// Click toward (x, y); if it's off screen, click the farthest on-screen tile
// along the way first.
async function ptrWalk(page, x, y) {
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
          const sx = px * 16 + 8 - w.cam.x;
          const sy = py * 16 + 8 - w.cam.y;
          if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py)) best = [px, py];
        }
        return best;
      }, [x, y]);
      if (!step) throw new Error(`no on-screen step toward ${x},${y}`);
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
async function ptrInteract(page, id) {
  for (let guard = 0; guard < 10; guard++) {
    const e = await page.evaluate((id) => {
      const en = window.moonshine.world.entity(id);
      return { x: en.x, y: en.y };
    }, id);
    if (await onScreen(page, e.x, e.y)) {
      await clickTileAt(page, e.x, e.y);
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
        const sx = px * 16 + 8 - w.cam.x;
        const sy = py * 16 + 8 - w.cam.y;
        if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py)) best = [px, py];
      }
      return best;
    }, id);
    if (!near || (near[0] === s.x && near[1] === s.y)) throw new Error(`can't get toward ${id}`);
    await clickTileAt(page, near[0], near[1]);
    await page.waitForTimeout(100);
    await waitFor(page, () => window.moonshine.snapshot().idle, null, 10000);
  }
  throw new Error(`never got to ${id}`);
}

// Tap the bag button, tap the item twice (select, use), then tap the target.
async function ptrUse(page, item, id) {
  const bag = await page.evaluate(() => window.moonshine.display.toClient(241, 14));
  await page.mouse.click(bag.x, bag.y);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const slot = await page.evaluate((i) => window.moonshine.display.toClient(40 + (i % 8) * 22 + 11, 36 + Math.floor(i / 8) * 22 + 11), i);
  await page.mouse.click(slot.x, slot.y);
  await page.waitForTimeout(100);
  await page.mouse.click(slot.x, slot.y);
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id);
}

// ---- the playthroughs -------------------------------------------------------

test.describe.configure({ mode: 'parallel' });

test('keyboard: the whole opening', async ({ page }) => {
  test.setTimeout(300000);
  const errors = await newGame(page);
  const read = (opts) => readThrough(page, kbAdvance(page), opts);
  await page.keyboard.press('Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  await waitFor(page, () => !!window.moonshine.snapshot().text, null, 8000);
  await page.waitForTimeout(900);
  await settle(page);
  await shot(page, 'opening-01-intro');
  let log = await read();
  expect(pageTexts(log)).toContain('Moonshine Night.');
  await waitFor(page, () => !!window.moonshine.snapshot().hint);
  await page.waitForTimeout(500);
  await shot(page, 'opening-02-controls-hint');

  // The tub names the problem.
  await kbInteract(page, 'tub');
  log = await read();
  expect(pageTexts(log)).toContain('No plug, though.');

  // Down the stair and into the flat.
  await kbWalk(page, 3, 12);
  await page.keyboard.press('ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat', null, 5000);
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await shot(page, 'opening-03-flat');
  await kbInteract(page, 'pepper_mill');
  await read();
  await waitFor(page, () => !!window.moonshine.snapshot().hint);
  await shot(page, 'opening-04-item-hint');
  await kbInteract(page, 'egg_timer');
  await read();
  await kbInteract(page, 'washstand');
  await read();
  expect((await snap(page)).items).toEqual(['pepper_mill', 'egg_timer', 'soap']);
  await kbWalk(page, 5, 7);
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 5000);

  // The plug thread: the Old Man.
  await kbInteract(page, 'old_man');
  log = await read();
  expect(pageTexts(log)).toContain('Bring me another king');
  await kbInteract(page, 'old_man', 'pepper_mill');
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('Black. Tall.'));
  await settle(page);
  await shot(page, 'opening-05-old-man-trade');
  await read();
  expect((await snap(page)).items).toContain('bath_plug');

  // The view thread: the Kid, then the Neighbor.
  await kbInteract(page, 'kid');
  log = await read();
  expect(pageTexts(log)).toContain('I was in the AIR');
  await kbInteract(page, 'kid', 'egg_timer');
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('TIMER'));
  await settle(page);
  await shot(page, 'opening-06-kid');
  await read();
  expect((await snap(page)).items).toContain('clothes_prop');
  await kbInteract(page, 'neighbor');
  await read();
  await kbInteract(page, 'neighbor', 'clothes_prop');
  log = await read({ stop: (s) => (s.text || '').includes("Don't say anything") });
  await settle(page);
  await shot(page, 'opening-07-sheets-moved');
  await read();
  expect((await snap(page)).flags['neighbor.sheetsMoved']).toBe(true);

  // Plug in, water in.
  await kbInteract(page, 'tub', 'bath_plug');
  await read();
  await kbInteract(page, 'tap');
  await page.waitForTimeout(1000);
  await shot(page, 'opening-08-filling');
  await read();
  expect((await snap(page)).flags['tub.full']).toBe(true);

  // The moonrise.
  await kbInteract(page, 'tub');
  await moonriseShots(page, kbAdvance(page));

  // Morning in the flat: the chart and the hat.
  await kbInteract(page, 'moon_chart');
  await read();
  await kbInteract(page, 'wardrobe');
  await read();
  expect((await snap(page)).items).toEqual(expect.arrayContaining(['moon_chart', 'hat']));
  await kbWalk(page, 5, 7);
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 5000);
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await kbInteract(page, 'well');
  log = await read();
  expect(pageTexts(log)).toContain('smells like the sea');
  await kbWalk(page, 14, 22);
  await shot(page, 'opening-14-morning-court');
  await kbWalk(page, 15, 24);
  await read();
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => window.moonshine.snapshot().flags['act1.done'], null, 8000);
  await page.waitForTimeout(1800);
  await shot(page, 'opening-15-end-card');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 15000);
  expect(errors).toEqual([]);
});

// Steps through the moonrise taking screenshots, ending in control in the flat.
async function moonriseShots(page, advance) {
  const log = [];
  await readThrough(page, advance, { log, stop: (s) => s.picture });
  await page.waitForTimeout(3000);
  await shot(page, 'opening-09-vista-glow');
  await waitFor(page, () => (window.moonshine.snapshot().text || '') === 'No.', null, 30000);
  await page.waitForTimeout(400);
  await settle(page);
  await shot(page, 'opening-10-vista-moon');
  await readThrough(page, advance, { log, stop: (s) => !s.picture });
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('WHOA'), null, 10000);
  await settle(page);
  await shot(page, 'opening-11-groan');
  await readThrough(page, advance, { log, stop: (s) => s.card === 'Morning.' });
  await page.waitForTimeout(500);
  await shot(page, 'opening-12-morning-card');
  await readThrough(page, advance, { log, stop: (s) => s.map === 'flat' && !!s.text });
  await page.waitForTimeout(800);
  await settle(page);
  await shot(page, 'opening-13-morning-flat');
  await readThrough(page, advance, { log });
  const s = await snap(page);
  expect(s.map).toBe('flat');
  expect(s.flags['act1.moonrise']).toBe(true);
  expect(s.lighting).toBe('day');
  const text = log.join('\n');
  expect(text).toContain('It comes up in the Gate.');
  expect(text).toContain('My SHEETS!');
  expect(text).toContain("I'd also like my plug back.");
}

test('pointer: the whole opening', async ({ page }) => {
  test.setTimeout(300000);
  const errors = await newGame(page);
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  const title = await page.evaluate(() => window.moonshine.display.toClient(128, 137));
  await page.mouse.click(title.x, title.y);
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  await waitFor(page, () => !!window.moonshine.snapshot().text, null, 8000);
  await read();

  // This time the view thread first, starting with the Neighbor.
  await ptrWalk(page, 8, 5);
  await ptrInteract(page, 'neighbor');
  let log = await read();
  expect(pageTexts(log)).toContain('run off with my prop');
  // Into the flat by clicking the door.
  await ptrWalk(page, 3, 11);
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat', null, 8000);
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await ptrInteract(page, 'egg_timer');
  await read();
  await ptrInteract(page, 'pepper_mill');
  await read();
  await ptrInteract(page, 'moon_chart');
  log = await read();
  expect(pageTexts(log)).toContain('My moon chart.');
  await ptrWalk(page, 5, 8);
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 8000);
  await waitFor(page, () => window.moonshine.snapshot().idle);

  // The Kid: click him and he stops for Cheryl.
  await ptrUse(page, 'egg_timer', 'kid');
  await read();
  expect((await snap(page)).items).toContain('clothes_prop');
  await ptrUse(page, 'pepper_mill', 'old_man');
  await read();
  expect((await snap(page)).items).toContain('bath_plug');
  await ptrUse(page, 'clothes_prop', 'neighbor');
  await read();
  await ptrUse(page, 'bath_plug', 'tub');
  await read();
  await ptrInteract(page, 'tap');
  await read();
  await ptrInteract(page, 'tub');
  const log2 = [];
  await readThrough(page, adv, { log: log2, timeout: 120000 });
  expect((await snap(page)).map).toBe('flat');
  expect(pageTexts(log2)).toContain("I'd also like my plug back.");

  // Out through the Squeeze.
  await ptrWalk(page, 5, 8);
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 8000);
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await ptrInteract(page, 'kid_morning');
  log = await read();
  expect(pageTexts(log)).toContain('BREATHED');
  await ptrWalk(page, 16, 25);
  await read({ stop: (s) => s.flags['act1.done'] });
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 15000);
  expect(errors).toEqual([]);
});

test('the Kid laps the well and stops for Cheryl', async ({ page }) => {
  const errors = await boot(page, '?map=cistern_court&x=3&y=6&seed=1');
  // He gets past the hurdle to the far corners of his lap.
  await waitFor(page, () => { const k = window.moonshine.world.entity('kid'); return k.x === 13 && k.y === 19; }, null, 9000);
  await waitFor(page, () => { const k = window.moonshine.world.entity('kid'); return k.x === 7 && k.y === 19; }, null, 6000);
  // Stand by his route: he stops within two tiles and stays put.
  await page.evaluate(() => window.moonshine.world.api.place('player', 10, 13, 'down'));
  await waitFor(page, () => {
    const w = window.moonshine.world; const k = w.entity('kid'); const p = w.player;
    return Math.abs(k.x - p.x) + Math.abs(k.y - p.y) <= 2 && !k.moving;
  }, null, 9000);
  const before = await page.evaluate(() => { const k = window.moonshine.world.entity('kid'); return [k.x, k.y]; });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => { const k = window.moonshine.world.entity('kid'); return [k.x, k.y]; });
  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});

// Every hotspot and character answers a look and an item, at dusk and in the
// morning: nothing is silent.
const SCENES = [
  ['court at dusk', '?map=cistern_court&x=3&y=6'],
  ['court in the morning', '?map=cistern_court&x=3&y=6&flags=act1.moonrise'],
  ['flat at dusk', '?map=flat&x=5&y=7'],
  ['flat in the morning', '?map=flat&x=5&y=7&flags=act1.moonrise'],
];
for (const [label, query] of SCENES) {
  test(`every object answers: ${label}`, async ({ page }) => {
    test.setTimeout(180000);
    const errors = await boot(page, `${query}&items=soap,pepper_mill`);
    await page.waitForTimeout(600);
    await readThrough(page, kbAdvance(page));
    const ids = await page.evaluate(() => window.moonshine.world.entities
      .filter((e) => !e.isPlayer && (e.def.interact || e.def.look || e.def.looks || e.def.talk))
      .map((e) => e.id));
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) {
      if (id === 'tub' || id === 'tap') continue; // these start scenes; the playthroughs cover them
      for (const item of [null, 'soap']) {
        const there = await page.evaluate(([id, item]) => {
          const w = window.moonshine.world;
          const e = w.entity(id);
          if (e) w.run(() => w.interactWith(e, item));
          return !!e;
        }, [id, item]);
        if (!there) continue; // taken a moment ago
        await page.waitForTimeout(50);
        const log = await readThrough(page, kbAdvance(page), { timeout: 20000 });
        expect(log.length, `${id} with ${item || 'a look'}`).toBeGreaterThan(0);
        // Taking things changes the inventory; keep the soap for the next one.
        await page.evaluate(() => { const st = window.moonshine.world.state; if (!st.inventory.includes('soap')) st.inventory.push('soap'); });
      }
    }
    expect(errors).toEqual([]);
  });
}

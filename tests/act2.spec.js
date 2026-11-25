// Plays Act 2 (docs/design/02-city.md) start to finish: by keyboard with the
// piano thread first, by pointer with the piano first, and by keyboard the
// long way round (Goat Path, Harbor, Bilge) with the Count thread first, so the
// Counting Woman climbs over the piano. Plus a check that the Sweaty Kid never
// blocks the gap beside the Counting Woman, and a pointer tour of part 2's
// people. Screenshots of key moments go to tests/screenshots/act2-*.
//
// The runs start on Lamp Street the morning after, carrying what a player
// usually has from the opening (soap, hat, moon chart).
import { test, expect } from '@playwright/test';
import { snap, waitFor, shot } from './helpers.js';

const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const START = '?map=lamp_street&x=3&y=1&facing=down&flags=act1.moonrise,act1.done,got.soap,got.hat,got.moon_chart&items=moon_chart,soap,hat';

// ---- shared ---------------------------------------------------------------

async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const tb = window.moonshine.world?.textbox;
    return !tb || !tb.open || tb.revealed();
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(350);
}

async function start(page, query = START) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  await page.waitForFunction(() => window.moonshine && window.moonshine.snapshot().scene === 'world', null, { timeout: 10000 });
  await page.waitForTimeout(300);
  return errors;
}

// Advance text until nothing is showing and no script runs. Returns every page seen.
async function readThrough(page, advance, { stop = null, timeout = 90000 } = {}) {
  const log = [];
  const end = Date.now() + timeout;
  let last = null;
  while (Date.now() < end) {
    const s = await snap(page);
    if (stop && stop(s)) return log;
    if (s.choice) return log;
    if (s.inventoryOpen && !s.text) return log; // an item Look reopens the bag
    if (!s.text && !s.busy && !s.moving) {
      await page.waitForTimeout(150);
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
const joined = (log) => log.join('\n').replace(/\s+/g, ' ');

// Read until a page containing `substr` is showing (then stop, for a screenshot).
async function readUntil(page, advance, substr) {
  const log = await readThrough(page, advance, { stop: (s) => !!s.text && s.text.replace(/\s+/g, ' ').includes(substr) });
  await settle(page);
  return log;
}

// ---- keyboard -------------------------------------------------------------

const kbAdvance = (page) => () => page.keyboard.press('z');

async function kbWalk(page, x, y) {
  for (let guard = 0; guard < 120; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    const next = await page.evaluate(([x, y]) => {
      const w = window.moonshine.world;
      const path = w.pathFor(w.player, [[x, y]]);
      return path && path[0];
    }, [x, y]);
    if (!next) {
      await page.waitForTimeout(200); // someone (the Kid) may be in the way
      continue;
    }
    const dir = next[0] > s.x ? 'right' : next[0] < s.x ? 'left' : next[1] > s.y ? 'down' : 'up';
    await page.keyboard.press(DIRKEY[dir]);
    // Arrived, or something took over; if someone stepped into the way, try again.
    await waitFor(page, ([nx, ny]) => {
      const p = window.moonshine.snapshot();
      return (p.x === nx && p.y === ny && !p.moving) || !!p.text || p.busy;
    }, next, 1500).catch(() => {});
    await waitFor(page, () => !window.moonshine.snapshot().moving, null, 3000);
    const after = await snap(page);
    if (after.text || after.busy) return;
  }
  throw new Error(`never reached ${x},${y}`);
}

// Step onto an exit with an arrow key and wait for the new map.
async function kbExit(page, x, y, dir, map) {
  await kbWalk(page, x, y);
  await page.keyboard.press(DIRKEY[dir]);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 6000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text; }, null, 6000);
}

async function kbFace(page, dir) {
  await page.keyboard.press(DIRKEY[dir]);
  await page.waitForTimeout(90);
}

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

// Look at an item in the bag: select it, Down to the buttons, Left to Look, Z.
async function kbLookItem(page, item) {
  await page.keyboard.press('x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const s = await snap(page);
  const i = s.items.indexOf(item);
  const cur = await page.evaluate(() => window.moonshine.world.inventory.openState.index);
  for (let k = 0; k < (i - cur + s.items.length) % s.items.length; k++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(60);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(60);
  await page.keyboard.press('z');
  await waitFor(page, () => !!window.moonshine.snapshot().text);
}

async function kbInteract(page, id, item = null) {
  for (let guard = 0; guard < 120; guard++) {
    const spot = await page.evaluate((id) => {
      const w = window.moonshine.world;
      const e = w.entity(id);
      if (!e) return { missing: true };
      const spots = w.interactSpots(e);
      const p = w.player;
      const here = spots.find((s) => s.x === p.x && s.y === p.y);
      if (here) return { here: true, ...here };
      const path = w.pathFor(p, spots.map((s) => [s.x, s.y]));
      return path && path.length ? { next: path[0] } : null;
    }, id);
    if (spot?.missing) throw new Error(`no entity ${id}`);
    if (!spot) { await page.waitForTimeout(200); continue; }
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

// The hollow step is walkable (it's flush with the landing), so a keyboard
// player faces it by stepping down onto the landing's edge above it: walk to
// (x, 17), step Down to (x, 18), press Z.
async function kbStepDownAndUse(page, x, item = null) {
  for (let tries = 0; tries < 10; tries++) {
    await kbWalk(page, x, 17);
    // Wait for the Kid to clear the column.
    await waitFor(page, (x) => !window.moonshine.world.entities.some((e) => e.id === 'kid' && e.x === x && e.y >= 18 && e.y <= 20), x, 15000);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);
    await waitFor(page, () => window.moonshine.snapshot().idle, null, 3000);
    const s = await snap(page);
    if (s.x === x && s.y === 18 && s.facing === 'down') break;
  }
  await page.waitForTimeout(100);
  if (item) await kbHold(page, item);
  await page.keyboard.press('z');
  await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text);
}

// ---- pointer --------------------------------------------------------------

// The camera glides after a map change or a long walk; a tile's screen
// position is only good once it has stopped.
async function cameraStill(page) {
  for (let i = 0; i < 30; i++) {
    const a = await page.evaluate(() => ({ ...window.moonshine.world.cam }));
    await page.waitForTimeout(60);
    const b = await page.evaluate(() => ({ ...window.moonshine.world.cam }));
    if (a.x === b.x && a.y === b.y) return;
  }
}

async function clickTileAt(page, tx, ty) {
  await cameraStill(page);
  const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [tx, ty]);
  await page.mouse.click(p.x, p.y);
}
async function clickGame(page, gx, gy) {
  const p = await page.evaluate(([x, y]) => window.moonshine.display.toClient(x, y), [gx, gy]);
  await page.mouse.click(p.x, p.y);
}
const ptrAdvance = (page) => () => clickGame(page, 128, 112);

const onScreen = (page, tx, ty) => page.evaluate(([x, y]) => {
  const w = window.moonshine.world;
  const sx = x * 16 + 8 - w.cam.x;
  const sy = y * 16 + 8 - w.cam.y;
  // Anywhere on screen except under the bag button (top right).
  return sx >= 4 && sy >= 4 && sx < 252 && sy < 220 && !(sx >= 220 && sy < 32);
}, [tx, ty]);

// Click toward (x, y), via on-screen tiles along the path if it's far.
async function ptrWalk(page, x, y, { exit = false } = {}) {
  for (let guard = 0; guard < 16; guard++) {
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
          if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py) && !w.entityAt?.(px, py)) best = [px, py];
        }
        return best;
      }, [x, y]);
      if (!step) throw new Error(`no on-screen step toward ${x},${y}`);
      await clickTileAt(page, step[0], step[1]);
    }
    await page.waitForTimeout(120);
    await waitFor(page, () => { const p = window.moonshine.snapshot(); return p.idle || p.busy || !!p.text; }, null, 12000);
    const after = await snap(page);
    if (after.busy || after.text) return;
    if (exit && after.map !== s.map) return;
  }
  throw new Error(`never reached ${x},${y}`);
}

// Walk next to an exit tile, then click it.
async function ptrExit(page, x, y, near, map) {
  await ptrWalk(page, near[0], near[1]);
  await clickTileAt(page, x, y);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 8000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text; }, null, 6000);
}

async function ptrInteract(page, id) {
  for (let guard = 0; guard < 12; guard++) {
    const e = await page.evaluate((id) => {
      const en = window.moonshine.world.entity(id);
      return en && { x: en.x, y: en.y, w: en.w, h: en.h };
    }, id);
    if (!e) throw new Error(`no entity ${id}`);
    // Click the footprint's bottom-left tile (the part nearest the floor).
    const tx = e.x, ty = e.y + e.h - 1;
    if (await onScreen(page, tx, ty)) {
      // If the walk over is interrupted, click again, as a player would.
      const holding = (await snap(page)).holding;
      await clickTileAt(page, tx, ty);
      const ok = await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text, null, 8000).then(() => true, () => false);
      if (ok) return;
      if (holding && !(await snap(page)).holding) throw new Error(`lost hold of ${holding} on the way to ${id}`);
      continue;
    }
    const s = await snap(page);
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
    await page.waitForTimeout(120);
    await waitFor(page, () => window.moonshine.snapshot().idle, null, 12000);
  }
  throw new Error(`never got to ${id}`);
}

async function ptrOpenBag(page, item) {
  await clickGame(page, 241, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const slot = await page.evaluate((i) => window.moonshine.display.toClient(40 + (i % 8) * 22 + 11, 36 + Math.floor(i / 8) * 22 + 11), i);
  return slot;
}

// Tap an item to select it, and tap it again to use it.
// Each click is checked before the next, so a slow frame under load can't
// merge or drop one.
async function ptrUse(page, item, id) {
  const slot = await ptrOpenBag(page, item);
  for (let tries = 0; tries < 6; tries++) {
    const st = await page.evaluate(() => {
      const w = window.moonshine.world;
      const s = w.inventory.openState;
      return { holding: w.control.holding, open: !!s, sel: s ? s.owned[s.index] : null };
    });
    if (st.holding === item) break;
    if (!st.open) {
      await clickGame(page, 241, 14);
      await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
      continue;
    }
    await page.mouse.click(slot.x, slot.y);
    // Wait for the click to register: the selection moves, or the bag closes with the item held.
    await waitFor(page, ([item, was]) => {
      const w = window.moonshine.world;
      const s = w.inventory.openState;
      return w.control.holding === item || (s && s.owned[s.index] === item && was !== item);
    }, [item, st.sel], 2000).catch(() => {});
    await page.waitForTimeout(150);
  }
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id);
}

async function ptrLookItem(page, item) {
  await clickGame(page, 241, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  // Tapping the selected item uses it, so only tap it if it isn't selected yet.
  const sel = await page.evaluate(() => { const s = window.moonshine.world.inventory.openState; return s.owned[s.index]; });
  if (sel !== item) {
    const i = (await snap(page)).items.indexOf(item);
    const slot = await page.evaluate((i) => window.moonshine.display.toClient(40 + (i % 8) * 22 + 11, 36 + Math.floor(i / 8) * 22 + 11), i);
    await page.mouse.click(slot.x, slot.y);
    await page.waitForTimeout(100);
  }
  await clickGame(page, 100, 94); // the Look button
  await waitFor(page, () => !!window.moonshine.snapshot().text);
}

// ---- the playthroughs -------------------------------------------------------

test.describe.configure({ mode: 'parallel' });

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const s = await snap(page).catch(() => null);
    console.log('state at failure:', JSON.stringify(s && { map: s.map, x: s.x, y: s.y, facing: s.facing, text: s.text, busy: s.busy, entities: s.entities }));
    await page.screenshot({ path: `tests/screenshots/act2-failure-${info.title.split(':')[0]}.png` }).catch(() => {});
  }
});

test('keyboard: Act 2 part 1', async ({ page }) => {
  test.setTimeout(420000);
  const errors = await start(page);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);

  // Lamp Street: the scrape marks on arrival.
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  await settle(page);
  await shot(page, 'act2-01-lamp-street');
  let log = await read();
  expect(joined(log)).toContain("The piano went this way. I'll follow it.");
  expect((await snap(page)).flags['act2.started']).toBeTruthy();

  // The Skipping Girls chant as Cheryl passes, then argue.
  await kbWalk(page, 12, 9);
  await page.waitForTimeout(700);
  await shot(page, 'act2-02-skipping-girls');
  await kbInteract(page, 'girl_2');
  log = await read();
  expect(joined(log)).toContain('Stout is a beer.');

  // Up to the Crown: Ambrose, the Clockmaker, the parapet.
  await kbExit(page, 22, 1, 'up', 'crown');
  await kbInteract(page, 'ambrose');
  await readUntil(page, adv, 'LIKE A COW');
  await shot(page, 'act2-03-crown-ambrose');
  await read();
  await kbInteract(page, 'tower_door');
  await readUntil(page, adv, "I'm calibrating");
  await shot(page, 'act2-04-clockmaker');
  await read();

  // The Archive: Ottilie gives paper and charcoal and the saying.
  await kbExit(page, 18, 7, 'up', 'archive');
  await kbInteract(page, 'ottilie');
  log = await readUntil(page, adv, 'hundredth step goes down');
  await shot(page, 'act2-05-ottilie');
  log = log.concat(await read());
  expect((await snap(page)).items).toContain('paper_charcoal');

  // The crypt and the Founders' Door.
  await kbExit(page, 12, 11, 'right', 'crypt');
  await kbInteract(page, 'founders_door');
  await settle(page);
  await shot(page, 'act2-06-founders-door');
  log = await read();
  expect(joined(log)).toContain('Not one of ours.');
  await kbInteract(page, 'founders_door', 'paper_charcoal');
  log = await read();
  expect(joined(log)).toContain('Nothing carved on it to rub.');
  await kbExit(page, 2, 5, 'left', 'archive');
  await kbExit(page, 7, 12, 'down', 'crown');
  await kbExit(page, 11, 14, 'down', 'lamp_street');

  // The Hundred Steps.
  await kbExit(page, 27, 14, 'down', 'hundred_steps');
  log = await read();
  expect(joined(log)).toContain('Ninety-nine of them.');
  await kbWalk(page, 9, 18);
  await kbInteract(page, 'counting_woman');
  await readUntil(page, adv, 'my feet get wet');
  await shot(page, 'act2-07-counting-woman');
  await read();
  await kbStepDownAndUse(page, 10);
  log = await read();
  expect(joined(log)).toContain('Water has pooled');
  await kbInteract(page, 'basin_woman');
  log = await read();
  expect(joined(log)).toContain('for luck');

  // The Movers and the piano.
  await kbInteract(page, 'big_mover');
  await readUntil(page, adv, 'crowbar and a grudge');
  await shot(page, 'act2-08-movers');
  await read();
  await kbInteract(page, 'piano');
  log = await read();
  expect(joined(log)).toContain('Grease.');
  await kbInteract(page, 'piano', 'soap');
  await readUntil(page, adv, 'Not THAT fast');
  await shot(page, 'act2-09-piano-gone');
  await read();
  let s = await snap(page);
  expect(s.flags['piano.slid']).toBeTruthy();
  expect(s.items).not.toContain('soap');
  await kbInteract(page, 'crowbar');
  await read();
  expect((await snap(page)).items).toContain('crowbar');

  // Fountain Square.
  await kbExit(page, 6, 40, 'down', 'fountain_square');
  await page.waitForTimeout(300);
  await shot(page, 'act2-10-fountain-square');
  await kbInteract(page, 'tourist');
  log = await read();
  expect(joined(log)).toContain("I'd give anything for a hat.");
  await kbInteract(page, 'mayor');
  await readUntil(page, adv, 'Tessel: Forward!');
  await shot(page, 'act2-11-mayor');
  await read();
  await kbInteract(page, 'big_mover');
  await read();

  // The Shop: the hat is display stock.
  await kbExit(page, 4, 4, 'up', 'shop');
  await kbInteract(page, 'shopkeeper');
  await readUntil(page, adv, 'Display.');
  await shot(page, 'act2-12-shop');
  await read();
  await kbInteract(page, 'hat_display');
  log = await read();
  expect(joined(log)).toContain('Display stock.');
  await kbInteract(page, 'marble_jar');
  log = await read();
  expect(joined(log)).toContain('same side of the jar');
  await kbExit(page, 4, 6, 'down', 'fountain_square');

  // Hat for the guidebook; the first look at it is the Steps entry.
  await kbInteract(page, 'tourist', 'hat');
  log = await read();
  expect(joined(log)).toContain("you're GIVING it to me?");
  s = await snap(page);
  expect(s.items).toContain('guidebook');
  expect(s.items).not.toContain('hat');
  await kbLookItem(page, 'guidebook');
  await settle(page);
  await shot(page, 'act2-13-guidebook');
  log = await read();
  expect(joined(log)).toContain('there are, in fact, 99');
  await page.keyboard.press('x');
  await waitFor(page, () => window.moonshine.snapshot().idle);

  // Back up the Steps; the guidebook moves the Counting Woman.
  await kbExit(page, 11, 1, 'up', 'hundred_steps');
  await kbInteract(page, 'counting_woman', 'guidebook');
  await readUntil(page, adv, 'RIGHT NOW');
  await shot(page, 'act2-14-to-the-mayor');
  await read();
  s = await snap(page);
  expect(s.flags['counter.left']).toBeTruthy();
  expect(s.items).toContain('guidebook');

  // Her step drinks the water.
  await kbStepDownAndUse(page, 9);
  log = await read();
  expect(joined(log)).toContain("Steps don't drink.");

  // The crowbar: the hundredth step goes down.
  await kbHold(page, 'crowbar');
  await page.keyboard.press('z');
  await readUntil(page, adv, 'And the hundredth step goes down.');
  await shot(page, 'act2-15-hundredth-step');
  log = await read();
  expect(joined(log)).toContain('is that a HOLE in the STEPS?');
  s = await snap(page);
  expect(s.flags['step.open']).toBeTruthy();
  await shot(page, 'act2-16-open-step');

  // Down the ladder: "Go down?" — Not yet, then Yes.
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 4000);
  await settle(page);
  await shot(page, 'act2-17-go-down');
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80);
  await page.keyboard.press('z');
  await waitFor(page, () => window.moonshine.snapshot().idle, null, 4000);
  await expect.poll(async () => (await snap(page)).y).toBe(18);
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 4000);
  await settle(page);
  await page.keyboard.press('z');
  // Act 3 goes on from here: down the ladder into the Step Gallery.
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 15000);
  expect(errors).toEqual([]);
});

test('pointer: Act 2 part 1', async ({ page }) => {
  test.setTimeout(420000);
  const errors = await start(page);
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  await read();

  // Straight down to the Steps by following the scrape.
  await ptrExit(page, 27, 15, [27, 14], 'hundred_steps');
  await read();
  // Look at a moon-eye on the way down.
  await ptrInteract(page, 'moon_eye_13_8');
  let log = await read();
  expect(joined(log)).toContain('A moon-eye');

  // The Movers, then soap given to the Big Mover.
  await ptrInteract(page, 'other_mover');
  await read();
  await ptrUse(page, 'soap', 'big_mover');
  await read();
  expect((await snap(page)).flags['piano.slid']).toBeTruthy();
  await ptrInteract(page, 'crowbar');
  await read();

  // The Square and the Tourist.
  await ptrExit(page, 6, 41, [6, 40], 'fountain_square');
  await ptrInteract(page, 'tourist');
  await read();
  await ptrUse(page, 'hat', 'tourist');
  await read();
  await ptrLookItem(page, 'guidebook');
  log = await read();
  expect(joined(log)).toContain('there are, in fact, 99');
  await clickGame(page, 198, 94); // Close
  await waitFor(page, () => window.moonshine.snapshot().idle);
  // A second look reads the next entry.
  await ptrLookItem(page, 'guidebook');
  log = await read();
  expect(joined(log)).toContain('local eccentric');
  await clickGame(page, 198, 94);
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await ptrInteract(page, 'piano');
  log = await read();
  expect(joined(log)).toContain('Half a ton of piano');

  // Up through the arch to the Counting Woman.
  await ptrExit(page, 11, 0, [11, 1], 'hundred_steps');
  await ptrUse(page, 'guidebook', 'counting_woman');
  await read();
  let s = await snap(page);
  expect(s.flags['counter.left']).toBeTruthy();

  // Her step: wait for the Kid to run past it (a click on him would use the crowbar on him).
  await waitFor(page, () => !window.moonshine.world.entities.some((e) => e.id === 'kid' && e.x <= 9 && e.y >= 18 && e.y <= 21), null, 20000);
  await ptrUse(page, 'crowbar', 'hollow_step_free');
  log = await read();
  expect(joined(log)).toContain('the hundredth step goes down');
  s = await snap(page);
  expect(s.flags['step.open']).toBeTruthy();
  // Click the hole: "Go down?" Yes.
  await clickTileAt(page, 10, 19);
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 8000);
  await settle(page);
  const yes = await page.evaluate(() => {
    const c = window.moonshine.world.textbox.active?.choice;
    return c && c.rects && c.rects[0] ? c.rects[0] : null;
  });
  if (!yes) throw new Error('no choice rects to click');
  await clickGame(page, yes.x + 4, yes.y + 4);
  // Act 3 goes on from here: down the ladder into the Step Gallery.
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 20000);
  expect(errors).toEqual([]);
});

test('the Kid never blocks the gap beside the Counting Woman', async ({ page }) => {
  test.setTimeout(240000);
  const errors = await start(page, '?map=hundred_steps&x=10&y=27&facing=up&flags=act2.started,n.stepsArrived&seed=7');
  // Keyboard: up and down flight 3 through the gap, several times.
  for (let i = 0; i < 4; i++) {
    await kbWalk(page, 10, 17);
    await kbWalk(page, 10, 27);
  }
  // Pointer: the same by clicking far ends.
  for (let i = 0; i < 3; i++) {
    await ptrWalk(page, 10, 17);
    await ptrWalk(page, 10, 26);
  }
  // He was never held on the narrow stretch.
  const held = await page.evaluate(() => {
    const k = window.moonshine.world.entity('kid');
    return k.patrolHeld && k.x === 10 && k.y >= 18 && k.y <= 24;
  });
  expect(held).toBeFalsy();
  expect(errors).toEqual([]);
});

// Every character and object on every Act 2 map has a tile beside it that
// Cheryl can walk to from the map's spawn (so it can be looked at, talked to,
// or used, by keyboard and by pointer). Characters that wander or run laps are
// checked where they start.
for (const [map, flags] of [
  ['lamp_street', 'act2.started'], ['crown', 'act2.started'], ['archive', 'act2.started'], ['crypt', 'act2.started'],
  ['hundred_steps', 'act2.started,n.stepsArrived'], ['hundred_steps', 'act2.started,n.stepsArrived,piano.slid,counter.left'],
  ['fountain_square', 'act2.started'], ['fountain_square', 'act2.started,piano.slid,counter.left'], ['shop', 'act2.started'],
  ['goat_path', 'act2.started'], ['harbor', 'act2.started'], ['lamp_room', 'act2.started'], ['bilge', 'act2.started'],
]) {
  test(`every object can be reached: ${map} (${flags})`, async ({ page }) => {
    const errors = await start(page, `?map=${map}&flags=${flags}&seed=1`);
    await readThrough(page, kbAdvance(page));
    const unreachable = await page.evaluate(() => {
      const w = window.moonshine.world;
      const out = [];
      for (const e of w.entities) {
        if (e.isPlayer || !e.visible) continue;
        const d = e.def;
        if (!(d.interact || d.use || d.look || d.looks || d.talk || d.talks)) continue;
        const spots = w.interactSpots(e).filter((s) => !w.isExit(s.x, s.y));
        if (!spots.length || !w.pathFor(w.player, spots.map((s) => [s.x, s.y]))) {
          if (!spots.some((s) => s.x === w.player.x && s.y === w.player.y)) out.push(e.id);
        }
      }
      return out;
    });
    expect(unreachable).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('keyboard: the long way round, the Count thread first', async ({ page }) => {
  test.setTimeout(480000);
  const errors = await start(page);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  await read();

  // The Goat Path, from Lamp Street's west edge.
  await kbWalk(page, 1, 10);
  await page.keyboard.press('ArrowLeft');
  let log = await read();
  expect(joined(log)).toContain('The Goat Path. Down the back of the island');
  await waitFor(page, () => window.moonshine.snapshot().map === 'goat_path', null, 6000);
  await waitFor(page, () => window.moonshine.snapshot().idle, null, 6000);
  await shot(page, 'act2-20-goat-path');
  await kbInteract(page, 'shack_window');
  log = await read();
  expect(joined(log)).toContain('a still');
  await kbInteract(page, 'goat_2');
  log = await read();
  expect(joined(log)).toContain('Meh.');

  // Down to the Harbor: Mott, the moon chart, a swig.
  await kbExit(page, 1, 22, 'down', 'harbor');
  await kbInteract(page, 'mott');
  await readUntil(page, adv, "only because I'm right");
  await shot(page, 'act2-21-mott');
  await read();
  await kbInteract(page, 'mott', 'moon_chart');
  log = await read();
  expect(joined(log)).toContain("Today I'm drinking.");
  await kbInteract(page, 'sea_view');
  log = await read();
  expect(joined(log)).toContain('the Teeth');

  // The lamp room.
  await kbExit(page, 27, 4, 'up', 'lamp_room');
  await kbInteract(page, 'keeper');
  await readUntil(page, adv, 'You look at the lamp.');
  await shot(page, 'act2-22-lamp-room');
  await read();
  await kbExit(page, 3, 6, 'down', 'harbor');

  // The Bilge: the Fishmonger, the Boatman, wet feet.
  await kbExit(page, 1, 7, 'left', 'bilge');
  await kbInteract(page, 'fishmonger');
  await readUntil(page, adv, 'LOOK at it!');
  await shot(page, 'act2-23-bilge');
  await read();
  await kbInteract(page, 'boatman');
  log = await read();
  expect(joined(log)).toContain('A boatman stays in his boat.');
  await kbInteract(page, 'water_stairs');
  log = await read();
  expect(joined(log)).toContain('keep going');
  await kbWalk(page, 7, 12);
  await kbWalk(page, 4, 12);
  log = await read();
  expect(joined(log)).toContain('under an inch of water');

  // Up to Fountain Square, the back way: the Tourist's hat.
  await kbExit(page, 11, 1, 'up', 'fountain_square');
  await kbInteract(page, 'tourist');
  await read();
  await kbInteract(page, 'piano_arch');
  log = await read();
  expect(joined(log)).toContain('back end of a piano');
  await kbInteract(page, 'tourist', 'hat');
  await read();
  expect((await snap(page)).items).toContain('guidebook');

  // All the way back round to the top of the Steps.
  await kbExit(page, 11, 16, 'down', 'bilge');
  await kbExit(page, 30, 12, 'right', 'harbor');
  await kbExit(page, 2, 1, 'up', 'goat_path');
  await kbExit(page, 13, 1, 'up', 'lamp_street');
  await kbExit(page, 27, 14, 'down', 'hundred_steps');
  await read();

  // The guidebook: she storms off and climbs straight over the piano.
  await kbInteract(page, 'counting_woman', 'guidebook');
  await readUntil(page, adv, "That's a PIANO!");
  await shot(page, 'act2-24-over-the-piano');
  log = await read();
  expect(joined(log)).toContain('And these are MY STEPS.');
  expect((await snap(page)).flags['counter.left']).toBeTruthy();

  // Then the piano, the crowbar, and the hundredth step.
  await kbInteract(page, 'piano', 'soap');
  await read();
  expect((await snap(page)).flags['piano.slid']).toBeTruthy();
  await kbInteract(page, 'crowbar');
  await read();
  await kbStepDownAndUse(page, 9, 'crowbar');
  log = await read();
  expect(joined(log)).toContain('And the hundredth step goes down.');
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 4000);
  await settle(page);
  await page.keyboard.press('z');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 20000);
  expect(errors).toEqual([]);
});

test("pointer: the long way round, part 2's people", async ({ page }) => {
  test.setTimeout(240000);
  const errors = await start(page, '?map=bilge&x=11&y=5&facing=down&flags=act2.started&items=moon_chart');
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  await ptrInteract(page, 'boatman');
  let log = await read();
  expect(joined(log)).toContain('A boatman stays in his boat.');
  await ptrInteract(page, 'fishmonger');
  await read();
  await ptrWalk(page, 30, 12);
  await clickTileAt(page, 31, 12);
  await waitFor(page, () => window.moonshine.snapshot().map === 'harbor', null, 8000);
  await waitFor(page, () => window.moonshine.snapshot().idle, null, 6000);
  await ptrUse(page, 'moon_chart', 'mott');
  log = await read();
  expect(joined(log)).toContain("Today I'm drinking.");
  await ptrInteract(page, 'ferry');
  log = await read();
  expect(joined(log)).toContain('Persistence');
  await ptrExit(page, 27, 3, [27, 4], 'lamp_room');
  await ptrInteract(page, 'keeper');
  await read();
  await ptrInteract(page, 'windows');
  log = await read();
  expect(joined(log)).toContain('She has her back to all of it.');
  expect(errors).toEqual([]);
});

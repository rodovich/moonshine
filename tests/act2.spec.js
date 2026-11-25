// Plays Act 2 part 1 (docs/design/02-city.md) start to finish: once by
// keyboard alone, once by pointer alone, plus a check that the Sweaty Kid
// never blocks the gap beside the Counting Woman. Screenshots of key moments
// go to tests/screenshots/act2-*.
//
// Both runs start on Lamp Street the morning after, carrying what a player
// usually has from the opening (soap, hat, moon chart). In part 1 the only
// way to Fountain Square is through the arch, so the piano always goes first.
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

async function clickTileAt(page, tx, ty) {
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
      await clickTileAt(page, tx, ty);
      await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text, null, 12000);
      return;
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
async function ptrUse(page, item, id) {
  const slot = await ptrOpenBag(page, item);
  const sel = await page.evaluate(() => { const s = window.moonshine.world.inventory.openState; return s.owned[s.index]; });
  if (sel !== item) {
    await page.mouse.click(slot.x, slot.y);
    await page.waitForTimeout(100);
  }
  await page.mouse.click(slot.x, slot.y);
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

  // The shut Goat Path gate.
  await kbInteract(page, 'goat_gate');
  log = await read();
  expect(joined(log)).toContain('GOATS ON THE PATH TODAY');

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

  // The rope down to the Bilge (part 2).
  await kbWalk(page, 11, 14);
  await kbWalk(page, 11, 15);
  log = await read();
  expect(joined(log)).toContain('CANAL CLEANING');

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
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 10000);
  await page.waitForTimeout(1500);
  await shot(page, 'act2-18-end-card');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 15000);
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

  // Fountain Square: she's with the Mayor now.
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
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 20000);
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

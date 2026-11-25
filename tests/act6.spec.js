// Plays Act 6, Moon in the Bowl (docs/design/06-moon-in-the-bowl.md), from
// the Long Keel to the title screen: once by keyboard alone and once by
// pointer alone. A third run tours the epilogue (the Stair Race, the
// Shopkeeper's plug). Screenshots of key moments go to tests/screenshots/act6-*.
//
// The climax in the Windlass Room (the bell, the hauling, the montage) needs
// Act 5's Windlass Room, so these runs start just after it, in the Long Keel.
import { test, expect } from '@playwright/test';
import { snap, waitFor, shot } from './helpers.js';

const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const BEFORE = 'act1.moonrise,act1.done,n.squeezeSeen=1,n.stepsArrived=1,act2.started,piano.slid,counter.left,step.open,basin.inside,got.crowbar,act6.started,bell.final,brake.thrown,chain.home,hatch.open';
const START = (extra = '') => `?map=long_keel&x=38&y=4&facing=left&flags=${BEFORE}&items=moonglass_disc,crowbar,moon_chart${extra}`;
const EPILOGUE = 'act1.moonrise,act1.done,n.squeezeSeen=1,n.stepsArrived=1,act2.started,piano.slid,counter.left,step.open,basin.inside,got.crowbar,act6.started,chain.home,moon.true,sisters.asleep,bathed,epilogue';

// ---- shared ---------------------------------------------------------------

async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const tb = window.moonshine.world?.textbox;
    return !tb || !tb.open || tb.revealed();
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(350);
}

async function start(page, query) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  await page.waitForFunction(() => window.moonshine && window.moonshine.snapshot().scene === 'world', null, { timeout: 10000 });
  await page.waitForTimeout(300);
  return errors;
}

// Advance text until nothing is showing and no script runs. Returns every page seen.
async function readThrough(page, advance, { stop = null, timeout = 120000 } = {}) {
  const log = [];
  const end = Date.now() + timeout;
  let last = null;
  while (Date.now() < end) {
    const s = await snap(page);
    if (stop && stop(s)) return log;
    if (s.choice) return log;
    if (s.scene !== 'world') return log;
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

async function readUntil(page, advance, substr) {
  const log = await readThrough(page, advance, { stop: (s) => !!s.text && s.text.replace(/\s+/g, ' ').includes(substr) });
  await settle(page);
  return log;
}

// ---- keyboard -------------------------------------------------------------

const kbAdvance = (page) => () => page.keyboard.press('z');

async function kbWalk(page, x, y) {
  for (let guard = 0; guard < 200; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    const next = await page.evaluate(([x, y]) => {
      const w = window.moonshine.world;
      const path = w.pathFor(w.player, [[x, y]]);
      return path && path[0];
    }, [x, y]);
    if (!next) { await page.waitForTimeout(200); continue; }
    const dir = next[0] > s.x ? 'right' : next[0] < s.x ? 'left' : next[1] > s.y ? 'down' : 'up';
    await page.keyboard.press(DIRKEY[dir]);
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

// Walk to (x, y), reading any lines on the way.
async function kbWalkThrough(page, x, y) {
  for (let i = 0; i < 6; i++) {
    await kbWalk(page, x, y);
    await readThrough(page, kbAdvance(page));
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
  }
  throw new Error(`never reached ${x},${y}`);
}

async function kbExit(page, x, y, dir, map) {
  await kbWalkThrough(page, x, y);
  await page.keyboard.press(DIRKEY[dir]);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 10000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 20000);
}

async function kbChoose(page, index) {
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 8000);
  await settle(page);
  for (let i = 0; i < index; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
  await page.keyboard.press('z');
  await page.waitForTimeout(150);
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

async function kbInteract(page, id, item = null) {
  for (let guard = 0; guard < 200; guard++) {
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
      await page.keyboard.press(DIRKEY[spot.facing]);
      await page.waitForTimeout(90);
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
    const after = await snap(page);
    if (after.text || after.busy) await readThrough(page, kbAdvance(page));
  }
  throw new Error(`never got to ${id}`);
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
  return sx >= 4 && sy >= 4 && sx < 252 && sy < 220 && !(sx >= 220 && sy < 32);
}, [tx, ty]);

// The furthest tile along the path to (x, y) that's comfortably on screen.
const stepToward = (page, goals) => page.evaluate((goals) => {
  const w = window.moonshine.world;
  const path = w.pathFor(w.player, goals);
  let best = null;
  for (const [px, py] of path || []) {
    const sx = px * 16 + 8 - w.cam.x;
    const sy = py * 16 + 8 - w.cam.y;
    if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py)) best = [px, py];
  }
  return best;
}, goals);

async function ptrWalk(page, x, y) {
  for (let guard = 0; guard < 24; guard++) {
    const s = await snap(page);
    if (s.x === x && s.y === y) return;
    if (await onScreen(page, x, y)) await clickTileAt(page, x, y);
    else {
      const step = await stepToward(page, [[x, y]]);
      if (!step) throw new Error(`no on-screen step toward ${x},${y}`);
      await clickTileAt(page, step[0], step[1]);
    }
    await page.waitForTimeout(120);
    await waitFor(page, () => { const p = window.moonshine.snapshot(); return p.idle || p.busy || !!p.text; }, null, 12000);
    const after = await snap(page);
    if (after.busy || after.text) await readThrough(page, ptrAdvance(page));
  }
  throw new Error(`never reached ${x},${y}`);
}

async function ptrExit(page, x, y, near, map) {
  await ptrWalk(page, near[0], near[1]);
  await clickTileAt(page, x, y);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 10000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 20000);
}

async function ptrInteract(page, id) {
  for (let guard = 0; guard < 12; guard++) {
    const e = await page.evaluate((id) => {
      const en = window.moonshine.world.entity(id);
      return en && { x: en.x, y: en.y, w: en.w, h: en.h };
    }, id);
    if (!e) throw new Error(`no entity ${id}`);
    const tx = e.x, ty = e.y + e.h - 1;
    if (await onScreen(page, tx, ty)) {
      await clickTileAt(page, tx, ty);
      await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text, null, 12000);
      return;
    }
    const spots = await page.evaluate((id) => {
      const w = window.moonshine.world;
      return w.interactSpots(w.entity(id)).map((s) => [s.x, s.y]);
    }, id);
    const near = await stepToward(page, spots);
    const s = await snap(page);
    if (!near || (near[0] === s.x && near[1] === s.y)) throw new Error(`can't get toward ${id}`);
    await clickTileAt(page, near[0], near[1]);
    await page.waitForTimeout(120);
    await waitFor(page, () => window.moonshine.snapshot().idle, null, 12000);
  }
  throw new Error(`never got to ${id}`);
}

async function ptrUse(page, item, id) {
  await clickGame(page, 241, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const sel = await page.evaluate(() => { const s = window.moonshine.world.inventory.openState; return s.owned[s.index]; });
  if (sel !== item) {
    await clickGame(page, 40 + (i % 8) * 22 + 11, 36 + Math.floor(i / 8) * 22 + 11);
    await page.waitForTimeout(100);
  }
  await clickGame(page, 148, 94); // the Use button
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id);
}

async function ptrChoose(page, index) {
  await waitFor(page, () => window.moonshine.world.textbox.active?.choice?.rects?.length > 0, null, 8000);
  await settle(page);
  const r = await page.evaluate((i) => window.moonshine.world.textbox.active.choice.rects[i], index);
  await clickGame(page, r.x + 4, r.y + 4);
  await page.waitForTimeout(150);
}

// ---- the ending, shared ------------------------------------------------------

// The credits: wait until they're rolling, skip ahead with a key or tap, then the title screen.
async function creditsToTitle(page, skip) {
  await waitFor(page, () => window.moonshine.world?.picture != null, null, 60000);
  await page.waitForTimeout(24000); // the vista, the moon rising, the title
  await shot(page, `act6-${skip.name}-vista`);
  await page.waitForTimeout(8000);
  await shot(page, `act6-${skip.name}-credits`);
  await skip.press();
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 30000);
}

test.describe.configure({ mode: 'parallel' });

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const s = await snap(page).catch(() => null);
    console.log('state at failure:', JSON.stringify(s && { map: s.map, x: s.x, y: s.y, facing: s.facing, text: s.text, busy: s.busy, flags: s.flags, items: s.items }));
    await page.screenshot({ path: `tests/screenshots/act6-failure-${info.title.split(':')[0]}.png` }).catch(() => {});
  }
});

// ---- the playthroughs -------------------------------------------------------

test('keyboard: Act 6, the Long Keel to the title screen', async ({ page }) => {
  test.setTimeout(420000);
  const errors = await start(page, `${START()}&save=1`);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  // The Long Keel: the lamps wake ahead of her; the door at the west end slides up.
  await kbWalkThrough(page, 20, 4);
  await shot(page, 'act6-01-keel');
  s = await snap(page);
  expect(s.flags['keel.lamps']).toBeGreaterThanOrEqual(4);
  await kbWalkThrough(page, 1, 4);
  expect((await snap(page)).flags['keel.doorOpen']).toBeTruthy();
  await kbExit(page, 1, 4, 'left', 'sighting_room');
  await read();
  await shot(page, 'act6-02-sighting-room');

  // The plug, discovered; then plugged in. The Basin fills.
  await kbInteract(page, 'basin');
  log = await read();
  expect(joined(log)).toContain('My plug. Chain and all.');
  expect((await snap(page)).items).toContain('found_plug');
  await kbInteract(page, 'basin', 'found_plug');
  log = await readUntil(page, adv, "the moon's not in the Gate");
  await shot(page, 'act6-03-basin-view');
  await read();
  expect((await snap(page)).flags['basin.plugged']).toBeTruthy();

  // The sighting log, twice; the shaft.
  await kbInteract(page, 'sighting_log');
  expect(joined(await read())).toContain('Signed with a B');
  await kbInteract(page, 'sighting_log');
  expect(joined(await read())).toContain('allow two fingers');

  // The trim wheel, three turns: closer, dead in the Gate, two fingers past.
  await kbInteract(page, 'trim_wheel');
  expect(joined(await read())).toContain('Closer.');
  await kbInteract(page, 'trim_wheel');
  log = await readUntil(page, adv, 'Dead in the Gate');
  await shot(page, 'act6-04-dead-in-the-gate');
  await read();
  await kbInteract(page, 'trim_wheel');
  log = await readUntil(page, adv, 'Moon in the Gate, and moon in the bowl.');
  await shot(page, 'act6-05-moon-true');
  log = log.concat(await read());
  expect(joined(log)).toContain('Put her back to bed.');
  s = await snap(page);
  expect(s.flags['moon.true']).toBeTruthy();
  await kbInteract(page, 'trim_wheel');
  expect(joined(await read())).toContain('It knows.');

  // Cheryl signs the log.
  await kbInteract(page, 'sighting_log');
  expect(joined(await read())).toContain('And a C.');

  // The master stop: the Middle Sister asleep; the city settles.
  await kbInteract(page, 'master_stop');
  log = await read();
  expect(joined(log)).toContain('There. Asleep.');
  expect((await snap(page)).flags['sisters.asleep']).toBeTruthy();

  // The lift won't go before the bath.
  await kbInteract(page, 'lift');
  await read();

  // The bath.
  await kbInteract(page, 'basin');
  log = await readUntil(page, adv, 'Nobody will ever know.');
  await shot(page, 'act6-06-the-bath');
  log = log.concat(await read());
  expect(joined(log)).toContain('Most of the best things, nobody ever knows.');
  s = await snap(page);
  expect(s.flags.bathed).toBeTruthy();
  await kbInteract(page, 'basin');
  expect(joined(await read())).toContain("It's the Basin's plug now.");

  // The lift, and the dawn.
  await kbInteract(page, 'lift');
  await read();
  await kbChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 20000);
  log = await readUntil(page, adv, 'Morning.');
  await shot(page, 'act6-07-morning');
  log = log.concat(await read());
  expect(joined(log)).toContain("don't be ridiculous, Gerald");
  s = await snap(page);
  expect(s.flags.epilogue).toBeTruthy();
  expect(s.lighting).toBe('dawn');

  // The door home: not yet.
  await kbWalkThrough(page, 3, 12);
  await page.keyboard.press('ArrowUp');
  log = await read();
  expect(joined(log)).toContain('I want to see the town first.');
  expect((await snap(page)).map).toBe('cistern_court');

  // Out to Lamp Street, and back: the piano has come.
  await kbExit(page, 15, 24, 'down', 'lamp_street');
  await read();
  await kbExit(page, 3, 1, 'up', 'cistern_court');
  log = await readUntil(page, adv, 'Sign here');
  await shot(page, 'act6-08-the-piano');
  log = log.concat(await read());
  expect(joined(log)).toContain("Gerald has very good manners for a man who doesn't exist.");
  expect((await snap(page)).flags['epi.piano']).toBeTruthy();
  await kbInteract(page, 'epi_piano');
  expect(joined(await read())).toContain("I'll tune it.");

  // Home: the tick on the chart, the vista, the credits.
  await kbWalkThrough(page, 3, 12);
  await page.keyboard.press('ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat', null, 10000);
  log = await readUntil(page, adv, 'Two fingers past');
  await shot(page, 'act6-09-the-tick');
  log = log.concat(await readUntil(page, adv, 'But it counts.'));
  await page.keyboard.press('z');
  await creditsToTitle(page, { name: 'kb', press: () => page.keyboard.press('z') });

  // Continue reopens the flat in the morning, the game complete.
  await page.waitForTimeout(800);
  await page.keyboard.press('z');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world', null, 10000);
  s = await snap(page);
  expect(s.map).toBe('flat');
  expect(s.flags['game.complete']).toBeTruthy();
  expect(errors).toEqual([]);
});

test('pointer: Act 6, the Long Keel to the title screen', async ({ page }) => {
  test.setTimeout(420000);
  const errors = await start(page, START());
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  await ptrWalk(page, 2, 4);
  expect((await snap(page)).flags['keel.doorOpen']).toBeTruthy();
  await ptrExit(page, 0, 4, [1, 4], 'sighting_room');
  await read();

  await ptrInteract(page, 'basin');
  expect(joined(await read())).toContain('My plug.');
  await ptrUse(page, 'found_plug', 'basin');
  expect(joined(await read())).toContain('Plugs are plugs.');
  for (let i = 0; i < 3; i++) {
    await ptrInteract(page, 'trim_wheel');
    log = await read();
  }
  expect(joined(log)).toContain('Put her back to bed.');
  await ptrInteract(page, 'master_stop');
  expect(joined(await read())).toContain('Down to where we belong.');
  await ptrInteract(page, 'basin');
  expect(joined(await read())).toContain('Most of the best things, nobody ever knows.');
  await ptrInteract(page, 'lift');
  await read();
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'cistern_court', null, 20000);
  log = await read();
  expect(joined(log)).toContain("I've a tick to make.");

  // Down the Squeeze, back up; the piano; home.
  await ptrExit(page, 15, 25, [15, 23], 'lamp_street'); // (15, 24) is the Squeeze's look hotspot
  await read();
  await ptrExit(page, 3, 0, [3, 1], 'cistern_court');
  log = await read();
  expect(joined(log)).toContain("It's from Gerald.");
  await ptrExit(page, 3, 11, [3, 12], 'flat');
  await readUntil(page, adv, 'But it counts.');
  await adv();
  await creditsToTitle(page, { name: 'ptr', press: () => clickGame(page, 128, 112) });
  expect(errors).toEqual([]);
});

test('keyboard: the epilogue, the Stair Race and the Shopkeeper\'s plug', async ({ page }) => {
  test.setTimeout(240000);
  const errors = await start(page, `?map=lamp_street&x=12&y=8&facing=down&flags=${EPILOGUE},epi.leftCourt&items=moonglass_disc,moon_chart`);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log;

  // Lamp Street: the Skipping Girls' new verse; the Man on Bench.
  await kbInteract(page, 'epi_girl_3');
  expect(joined(await read())).toContain("Tessel's WHOLE!");
  await kbInteract(page, 'epi_bench_man');
  expect(joined(await read())).toContain('seiche');

  // The Hundred Steps: the Stair Race.
  await kbExit(page, 27, 14, 'down', 'hundred_steps');
  log = await readUntil(page, adv, 'ONE HUNDRED!');
  await shot(page, 'act6-10-stair-race');
  log = log.concat(await read());
  expect(joined(log)).toContain('I beat everyone AND the egg!');
  expect((await snap(page)).flags['epi.race']).toBeTruthy();
  await kbInteract(page, 'epi_kid');
  expect(joined(await read())).toContain("It's lucky.");
  await kbInteract(page, 'epi_counting_woman');
  expect(joined(await read())).toContain('A hundred. Every time.');

  // Down to Fountain Square; the Shop: a new plug.
  await kbExit(page, 6, 40, 'down', 'fountain_square');
  await read();
  await kbInteract(page, 'epi_mayor');
  expect(joined(await read())).toContain('Its legacy remains!');
  await kbExit(page, 4, 4, 'up', 'shop');
  await read();
  await kbInteract(page, 'epi_shopkeeper');
  log = await read();
  expect(joined(log)).toContain('My first sale in thirty years.');
  expect((await snap(page)).items).toContain('new_plug');
  await shot(page, 'act6-11-shop');
  expect(errors).toEqual([]);
});

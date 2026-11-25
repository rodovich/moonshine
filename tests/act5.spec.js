// Plays Act 5, High and Dry (docs/design/05-high-and-dry.md), start to
// finish: once by keyboard alone and once by pointer alone, from the start of
// the act in the dry Bilge to the end card. Screenshots of key moments go to
// tests/screenshots/act5-*.
//
// The two runs take the threads in different orders. The keyboard run does
// the rope first, then the relay, goes through the door and down to the
// Windlass Room without the clapper (levering the stump out), climbs back up
// for the clapper, and comes back to seat it. The pointer run gets the
// clapper first, does the relay before the rope (so the Kid throws the disc
// up from the mud), then the rope, and goes down once.
import { test, expect } from '@playwright/test';
import { snap, waitFor, shot } from './helpers.js';

const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const PRIOR = [
  'act1.moonrise', 'act1.done', 'act2.started', 'piano.slid', 'got.crowbar', 'counter.left', 'step.open', 'basin.inside',
  'tourist.met', 'tourist.hasHat', 'ottilie.met', 'act3.started', 'got.disc', 'got.shipPlan', 'founders.unbolted',
  'act3.surfaced', 'moonEyes.glow', 'act3.crypt', 'act3.done', 'act4.started', 'clockmaker.out', 'clock.lifted',
  'bell.restored', 'mayor.atCrown', 'ambrose.inBelfry', 'read.flyleaf', 'got.throat', 'ottilie.readPlan', 'pump.throat',
  'pumps.running', 'act4.risen', 'act4.done', 'got.telescope', 'window.telescope',
].join(',');
const ITEMS = 'moon_chart,crowbar,guidebook,moonglass_disc,ship_plan,square_jug';
const START = `?map=bilge_dry&x=23&y=6&facing=down&flags=${PRIOR}&items=${ITEMS}&run=act5_start`;

// ---- shared ---------------------------------------------------------------

async function settle(page) {
  await page.waitForTimeout(150);
  await page.waitForFunction(() => {
    const tb = window.moonshine.world?.textbox;
    return !tb || !tb.open || tb.revealed();
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
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
    if (s.scene !== 'world') return log;
    if (stop && stop(s)) return log;
    if (s.choice) return log;
    if (s.inventoryOpen && !s.text) return log;
    if (!s.text && !s.busy && !s.moving) {
      await page.waitForTimeout(200);
      const again = await snap(page);
      if (again.scene !== 'world' || (!again.text && !again.busy && !again.moving)) return log;
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

async function kbChoose(page, index) {
  await waitFor(page, () => !!window.moonshine.snapshot().choice, null, 8000);
  await settle(page);
  for (let i = 0; i < index; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
  await page.keyboard.press('z');
  await page.waitForTimeout(150);
}

async function ptrChoose(page, index) {
  await waitFor(page, () => window.moonshine.world.textbox.active?.choice?.rects?.length > 0, null, 8000);
  await settle(page);
  const r = await page.evaluate((i) => window.moonshine.world.textbox.active.choice.rects[i], index);
  await clickGame(page, r.x + 4, r.y + 4);
  await page.waitForTimeout(150);
}

// The way onto an active exit to `to` from the current map: a reachable tile
// beside one of its tiles, and the direction to step.
async function exitApproach(page, to) {
  return page.evaluate((to) => {
    const w = window.moonshine.world;
    const p = w.player;
    let best = null;
    for (const e of w.mapDef.exits || []) {
      if (e.to !== to) continue;
      if (e.when && !e.when(w.api)) continue;
      for (let dx = 0; dx < (e.w || 1); dx++) for (let dy = 0; dy < (e.h || 1); dy++) {
        const ex = e.x + dx, ey = e.y + dy;
        for (const [dir, [ox, oy]] of Object.entries({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] })) {
          const nx = ex - ox, ny = ey - oy;
          if (w.isExit(nx, ny)) continue;
          const here = p.x === nx && p.y === ny;
          const path = here ? [] : w.pathFor(p, [[nx, ny]]);
          if (!path) continue;
          const last = path.length ? path[path.length - 1] : [p.x, p.y];
          if (last[0] !== nx || last[1] !== ny) continue;
          if (!best || path.length < best.len) best = { x: nx, y: ny, dir, len: path.length };
        }
      }
    }
    return best;
  }, to);
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

async function kbFace(page, dir) {
  await page.keyboard.press(DIRKEY[dir]);
  await page.waitForTimeout(90);
}

// Walk through an exit to `to`, and wait for the new map.
async function kbGo(page, to) {
  let a;
  for (let tries = 0; tries < 4; tries++) {
    a = await exitApproach(page, to);
    if (!a) throw new Error(`no way to ${to} from ${(await snap(page)).map}`);
    await kbWalk(page, a.x, a.y);
    const s = await snap(page);
    if (s.x === a.x && s.y === a.y && !s.text && !s.busy) break;
    // A line on the way (a trigger): read it and carry on.
    await readThrough(page, () => page.keyboard.press('z'));
  }
  await page.keyboard.press(DIRKEY[a.dir]);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, to, 10000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 20000);
}

async function kbHold(page, item) {
  await page.keyboard.press('x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const s = await snap(page);
  const i = s.items.indexOf(item);
  expect(i, `has ${item}`).toBeGreaterThanOrEqual(0);
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

// The furthest on-screen tile along the path to (x, y), avoiding exits.
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
    await waitFor(page, () => { const p = window.moonshine.snapshot(); return p.idle || p.busy || !!p.text; }, null, 15000);
    const after = await snap(page);
    if (after.busy || after.text) return;
  }
  throw new Error(`never reached ${x},${y}`);
}

// Walk beside an exit to `to`, then click the exit tile.
async function ptrGo(page, to) {
  let a;
  for (let tries = 0; tries < 4; tries++) {
    a = await exitApproach(page, to);
    if (!a) throw new Error(`no way to ${to} from ${(await snap(page)).map}`);
    await ptrWalk(page, a.x, a.y);
    const s = await snap(page);
    if (s.x === a.x && s.y === a.y && !s.text && !s.busy) break;
    // A line on the way (a trigger): read it and carry on.
    await readThrough(page, () => clickGame(page, 128, 112));
  }
  const [ox, oy] = DIRS[a.dir];
  await clickTileAt(page, a.x + ox, a.y + oy);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, to, 10000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 20000);
}

async function ptrInteract(page, id, tile = null) {
  for (let guard = 0; guard < 16; guard++) {
    const e = await page.evaluate((id) => {
      const en = window.moonshine.world.entity(id);
      return en && { x: en.x, y: en.y, w: en.w, h: en.h };
    }, id);
    if (!e) throw new Error(`no entity ${id}`);
    const [tx, ty] = tile || [e.x, e.y + e.h - 1];
    if (await onScreen(page, tx, ty)) {
      await clickTileAt(page, tx, ty);
      await waitFor(page, () => window.moonshine.snapshot().busy || !!window.moonshine.snapshot().text, null, 15000);
      return;
    }
    const s = await snap(page);
    const spots = await page.evaluate((id) => {
      const w = window.moonshine.world;
      return w.interactSpots(w.entity(id)).map((s) => [s.x, s.y]);
    }, id);
    const near = await stepToward(page, spots);
    if (!near || (near[0] === s.x && near[1] === s.y)) throw new Error(`can't get toward ${id}`);
    await clickTileAt(page, near[0], near[1]);
    await page.waitForTimeout(120);
    await waitFor(page, () => window.moonshine.snapshot().idle, null, 15000);
  }
  throw new Error(`never got to ${id}`);
}

async function ptrSelect(page, item) {
  await clickGame(page, 241, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i, `has ${item}`).toBeGreaterThanOrEqual(0);
  const page0 = await page.evaluate(() => window.moonshine.world.inventory.openState.page || 0);
  const slot = await page.evaluate((i) => window.moonshine.display.toClient(40 + (i % 8) * 22 + 11, 36 + Math.floor((i % 16) / 8) * 22 + 11), i);
  void page0;
  const sel = await page.evaluate(() => { const s = window.moonshine.world.inventory.openState; return s.owned[s.index]; });
  if (sel !== item) {
    await page.mouse.click(slot.x, slot.y);
    await page.waitForTimeout(100);
  }
  return slot;
}

async function ptrUse(page, item, id, tile = null) {
  const slot = await ptrSelect(page, item);
  await page.mouse.click(slot.x, slot.y);
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id, tile);
}

// ---- the playthroughs -------------------------------------------------------

test.describe.configure({ mode: 'parallel' });

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const s = await snap(page).catch(() => null);
    console.log('state at failure:', JSON.stringify(s && { map: s.map, x: s.x, y: s.y, facing: s.facing, text: s.text, busy: s.busy, flags: s.flags, items: s.items }));
    await page.screenshot({ path: `tests/screenshots/act5-failure-${info.title.split(':')[0]}.png` }).catch(() => {});
  }
});

test('keyboard: Act 5', async ({ page }) => {
  test.setTimeout(600000);
  const errors = await start(page, START);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  // The act opens on the quay above the Water Stairs.
  log = await read();
  expect(joined(log)).toContain('stairs that don\'t reach it');
  s = await snap(page);
  expect(s.map).toBe('bilge_dry');
  expect(s.flags['act5.started']).toBeTruthy();
  expect(s.flags['teeth.stage']).toBe(1);
  await shot(page, 'act5-01-bilge');

  // The Boatman, from the broken edge.
  await kbInteract(page, 'broken_edge');
  log = await read();
  expect(joined(log)).toContain('sitting on a coil of rope');
  expect(joined(log)).toContain("A boatman's rope stays with his boat");

  // The Fishmonger lends her bucket.
  await kbInteract(page, 'fishmonger5');
  log = await read();
  expect(joined(log)).toContain('What use is a bucket');
  expect((await snap(page)).items).toContain('bucket');

  // An empty bucket is no use to him.
  await kbInteract(page, 'broken_edge', 'bucket');
  log = await read();
  expect(joined(log)).toContain("I'd better fill it first");

  // The Harbor: the Teeth, Mott, the Kid.
  await kbGo(page, 'harbor_risen');
  log = await read();
  expect(joined(log)).toContain('The Teeth');
  await shot(page, 'act5-05-harbor');
  await kbInteract(page, 'mott5');
  log = await read();
  expect(joined(log)).toContain('Whatever holds her is at the bow end');
  await kbInteract(page, 'kid5');
  log = await read();
  expect(joined(log)).toContain("I'm racing the reef");

  // The lamp room: the Keeper wants her telescope back; the lamp waits for it.
  await kbGo(page, 'lamp_room');
  await read();
  await kbInteract(page, 'keeper5');
  log = await read();
  expect(joined(log)).toContain('Why is there a REEF');
  expect(joined(log)).toContain('my telescope');
  await kbInteract(page, 'lamp5', 'moonglass_disc');
  log = await read();
  expect(joined(log)).toContain("Not till I've got my telescope");
  await kbGo(page, 'harbor_risen');
  await read();
  await kbGo(page, 'bilge_dry');
  await read();

  // Up to Fountain Square: fill it at the Fountain.
  await kbGo(page, 'fountain_square');
  await read();
  await kbInteract(page, 'mayor');
  log = await read();
  expect(joined(log)).toContain('DRY CANAL DAY');
  await shot(page, 'act5-02-square');
  await kbInteract(page, 'fountain', 'bucket');
  log = await read();
  expect(joined(log)).toContain("I'm carrying it to a boat");
  expect((await snap(page)).items).toContain('bucket_water');

  // The Shop: the telescope lies in the fallen window; with the Keeper asking,
  // the guidebook swaps for it.
  await kbGo(page, 'shop');
  await read();
  await kbInteract(page, 'shopkeeper5');
  log = await read();
  expect(joined(log)).toContain('like a fallen soldier');
  expect(joined(log)).toContain('Give it BACK?');
  await kbInteract(page, 'shopkeeper5', 'guidebook');
  log = await read();
  expect(joined(log)).toContain("I'm practically a merchant");
  s = await snap(page);
  expect(s.items).toContain('telescope');
  expect(s.items).not.toContain('guidebook');
  expect(s.flags['window.telescope']).toBeFalsy();
  await shot(page, 'act5-03-shop');
  await kbGo(page, 'fountain_square');
  await read();

  // Back down: the bucket to the Boatman, the rope to the ring.
  await kbGo(page, 'bilge_dry');
  await read();
  await kbInteract(page, 'broken_edge', 'bucket_water');
  log = await read();
  expect(joined(log)).toContain('AFLOAT');
  expect((await snap(page)).items).toContain('rope');
  await shot(page, 'act5-04-afloat');
  await kbInteract(page, 'broken_edge_r', 'rope');
  log = await read();
  expect(joined(log)).toContain('round turn and two half hitches');
  expect((await snap(page)).flags['rope.tied']).toBeTruthy();

  // Down the rope and back up again (two-way).
  await kbWalk(page, 25, 7);
  await kbFace(page, 'down');
  await page.keyboard.press('ArrowDown');
  log = await read();
  expect(joined(log)).toContain('Down a rope into a canal, on a weekday');
  s = await snap(page);
  expect([s.x, s.y]).toEqual([25, 10]);
  await kbInteract(page, 'bronze_door', 'moonglass_disc');
  log = await read();
  expect(joined(log)).toContain('brightest light in Tessel');
  await kbWalk(page, 25, 10);
  await page.keyboard.press('ArrowUp');
  await read();
  s = await snap(page);
  expect([s.x, s.y]).toEqual([25, 7]);

  // Back to the lamp room: the telescope for the Keeper; the disc in the lamp; the relay.
  await kbGo(page, 'harbor_risen');
  await read();
  await kbGo(page, 'lamp_room');
  await read();
  await kbInteract(page, 'keeper5', 'telescope');
  log = await read();
  expect(joined(log)).toContain("I'll be at the window");
  await shot(page, 'act5-06-lamproom');
  await kbInteract(page, 'lamp5', 'moonglass_disc');
  log = await readUntil(page, adv, 'Ready. Steady. EGG.');
  expect(joined(log)).toContain("It's drinking the lamp");
  expect(joined(log)).toContain('Can I take it?');
  await page.keyboard.press('z');
  // The run: the camera follows the Kid to the Bilge.
  await waitFor(page, () => window.moonshine.world.state.map === 'bilge_dry' || window.moonshine.world.mapDef.id === 'bilge_dry', null, 30000);
  await page.waitForTimeout(2500);
  await shot(page, 'act5-07-relay');
  log = await readUntil(page, adv, 'I BEAT THE EGG');
  await shot(page, 'act5-08-door-open');
  log = await read();
  s = await snap(page);
  expect(s.map).toBe('harbor_risen');
  expect(s.flags['door.open']).toBeTruthy();
  expect(s.flags['teeth.stage']).toBe(2);
  expect(s.items).not.toContain('moonglass_disc');
  await kbInteract(page, 'mott5');
  log = await read();
  expect(joined(log)).toContain('I can count the rocks');

  // Down to the mud: the Kid gives the disc back; through the door.
  await kbGo(page, 'bilge_dry');
  await read();
  await kbWalk(page, 25, 7);
  await page.keyboard.press('ArrowDown');
  // The Kid, waiting on the mud with the disc, gives it back as she lands.
  log = await read();
  expect(joined(log)).toContain('spat this out');
  expect((await snap(page)).items).toContain('moonglass_disc');
  await kbGo(page, 'bow_passage');
  log = await read();
  expect(joined(log)).toContain("They're waking up");
  await shot(page, 'act5-09-passage');
  await kbGo(page, 'windlass_room');
  log = await read();
  expect(joined(log)).toContain('This is what holds us');
  await shot(page, 'act5-10-windlass');

  // Without the clapper: the stump comes out, and the socket points back up.
  await kbInteract(page, 'socket');
  log = await read();
  expect(joined(log)).toContain('sheared clean off');
  await kbInteract(page, 'socket', 'crowbar');
  log = await read();
  expect(joined(log)).toContain("I'm stronger than I look");
  await kbInteract(page, 'socket');
  log = await read();
  expect(joined(log)).toContain('Something up there is a spare tooth');

  // Back up and across town to the Crown: the Clockmaker's doorstop.
  await kbGo(page, 'bow_passage');
  await read();
  await kbGo(page, 'bilge_dry');
  await read();
  await kbWalk(page, 25, 10);
  await page.keyboard.press('ArrowUp');
  await read();
  expect((await snap(page)).y).toBe(7);
  await kbGo(page, 'fountain_square');
  await read();
  await kbGo(page, 'hundred_steps');
  await read();
  await kbGo(page, 'lamp_street');
  await read();
  await kbInteract(page, 'girl_3');
  log = await read();
  expect(joined(log)).toContain('bumped her HEAD');
  await kbGo(page, 'crown');
  await read();
  // Ambrose, up in the belfry.
  await kbGo(page, 'belfry');
  await read();
  await kbInteract(page, 'ambrose_belfry');
  log = await read();
  expect(joined(log)).toContain('PROPPING HIS SHOP DOOR OPEN');
  await kbGo(page, 'crown');
  await read();
  await kbGo(page, 'clockmaker_shop');
  await read();
  await kbInteract(page, 'clockmaker5');
  log = await read();
  expect(joined(log)).toContain('Nothing in this town keeps still');
  await kbInteract(page, 'doorstop');
  log = await read();
  expect(joined(log)).toContain('made to catch something');
  await shot(page, 'act5-11-clockshop');
  await kbInteract(page, 'clockmaker5', 'square_jug');
  log = await read();
  expect(joined(log)).toContain("Doesn't ROLL");
  s = await snap(page);
  expect(s.items).toContain('clapper');
  expect(s.flags['teeth.stage']).toBe(3);
  await kbGo(page, 'crown');
  log = await read();
  expect(joined(log)).toContain("It's the DOOR that moved");

  // All the way back down, and the clapper into the socket.
  await kbGo(page, 'lamp_street');
  await read();
  await kbGo(page, 'hundred_steps');
  await read();
  await kbGo(page, 'fountain_square');
  await read();
  await kbGo(page, 'bilge_dry');
  await read();
  await kbWalk(page, 25, 7);
  await page.keyboard.press('ArrowDown');
  await read();
  await kbGo(page, 'bow_passage');
  await read();
  await kbGo(page, 'windlass_room');
  await read();
  await kbInteract(page, 'socket', 'clapper');
  log = await readUntil(page, adv, "So I'll wait.");
  expect(joined(log)).toContain('It fits. Of course it fits.');
  expect(joined(log)).toContain('The bell says when');
  await shot(page, 'act5-12-waiting');
  log = await read({ stop: (st) => st.card === 'Moonrise.' });
  await waitFor(page, () => window.moonshine.snapshot().card === 'Moonrise.', null, 20000);
  await shot(page, 'act5-13-moonrise');
  // After the Moonrise card, Act 6 begins in the Windlass Room (or, without Act 6, the title).
  await waitFor(page, () => { const st = window.moonshine.snapshot(); return st.scene === 'title' || !!st.flags?.['act6.started']; }, null, 30000);
  expect(errors).toEqual([]);
});

test('pointer: Act 5', async ({ page }) => {
  test.setTimeout(600000);
  const errors = await start(page, START);
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  await read();

  // The tooth thread first: up through town to the Clockmaker.
  await ptrGo(page, 'fountain_square');
  await read();
  await ptrGo(page, 'hundred_steps');
  await read();
  await ptrInteract(page, 'counting_woman5');
  log = await read();
  expect(joined(log)).toContain("It's always a hundred");
  await ptrGo(page, 'lamp_street');
  await read();
  await ptrGo(page, 'crown');
  await read();
  await ptrGo(page, 'clockmaker_shop');
  await read();
  await ptrInteract(page, 'clockmaker5');
  await read();
  await ptrUse(page, 'square_jug', 'clockmaker5');
  log = await read();
  expect(joined(log)).toContain('It hums at night');
  expect((await snap(page)).items).toContain('clapper');
  expect((await snap(page)).flags['teeth.stage']).toBe(2);
  await ptrGo(page, 'crown');
  await read();

  // The Archive on the way: Ottilie has revised.
  await ptrGo(page, 'archive');
  await read();
  await ptrInteract(page, 'ottilie');
  log = await read();
  expect(joined(log)).toContain('A vast cellar');
  await ptrGo(page, 'crown');
  await read();

  // Down to the Square and the Shop.
  await ptrGo(page, 'lamp_street');
  await read();
  await ptrGo(page, 'hundred_steps');
  await read();
  await ptrGo(page, 'fountain_square');
  await read();
  // The Shop first, before the Keeper has asked: the swap works anyway.
  await ptrGo(page, 'shop');
  await read();
  await ptrInteract(page, 'shopkeeper5');
  log = await read();
  expect(joined(log)).toContain('something local');
  await ptrUse(page, 'guidebook', 'shopkeeper5');
  log = await read();
  expect(joined(log)).toContain("I'm practically a merchant");
  await ptrGo(page, 'fountain_square');
  await read();

  // The relay, before the rope.
  await ptrGo(page, 'bilge_dry');
  await read();
  await ptrGo(page, 'harbor_risen');
  log = await read();
  expect(joined(log)).toContain('Closer. I can see the rocks');
  await ptrGo(page, 'lamp_room');
  await read();
  await ptrUse(page, 'telescope', 'keeper5');
  await read();
  await ptrUse(page, 'moonglass_disc', 'lamp5');
  log = await read({ timeout: 180000 });
  expect(joined(log)).toContain('I BEAT THE EGG');
  s = await snap(page);
  expect(s.map).toBe('harbor_risen');
  expect(s.flags['teeth.stage']).toBe(3);
  await shot(page, 'act5-20-teeth3');

  // The Kid throws the disc up from the mud.
  await ptrGo(page, 'bilge_dry');
  await read();
  await ptrInteract(page, 'broken_edge');
  log = await read();
  expect(joined(log)).toContain('CATCH');
  expect((await snap(page)).items).toContain('moonglass_disc');

  // Now the rope: bucket, Fountain, Boatman, ring.
  await ptrInteract(page, 'fishmonger5');
  await read();
  await ptrGo(page, 'fountain_square');
  await read();
  await ptrUse(page, 'bucket', 'fountain');
  await read();
  await ptrGo(page, 'bilge_dry');
  await read();
  await ptrUse(page, 'bucket_water', 'broken_edge');
  log = await read();
  expect(joined(log)).toContain('Got it. Mostly.');
  await ptrUse(page, 'rope', 'stair_ring');
  await read();
  // Clicking the ring offers the climb.
  await ptrInteract(page, 'stair_ring');
  await read();
  await ptrChoose(page, 0);
  log = await read();
  expect(joined(log)).toContain('thirty children');
  await ptrGo(page, 'bow_passage');
  await read();
  await ptrGo(page, 'windlass_room');
  await read();
  await ptrUse(page, 'clapper', 'socket');
  log = await read();
  expect(joined(log)).toContain('needs levering out first');
  await ptrUse(page, 'crowbar', 'socket');
  await read();
  await ptrUse(page, 'clapper', 'socket');
  log = await read();
  expect(joined(log)).toContain("I'm good at waiting");
  // After the Moonrise card, Act 6 begins in the Windlass Room (or, without Act 6, the title).
  await waitFor(page, () => { const st = window.moonshine.snapshot(); return st.scene === 'title' || !!st.flags?.['act6.started']; }, null, 30000);
  expect(errors).toEqual([]);
});

// ---- reachability ----------------------------------------------------------
// Every object or person on an Act 5 map can be walked up to and used: each
// has a tile beside it that Cheryl can reach from where she'd stand on that
// map (some only from the mud, after the rope).

const STATE = `${PRIOR},act5.started,rope.tied,boatman.afloat,door.open,kid.gaveDisc,passage.lit,windlass.seen,keeper.asked,keeper.telescope,telescope.back,teeth.seen=3`;
const REACH = [
  { map: 'bilge_dry', from: [[23, 6], [25, 10]], stage: 1 },
  { map: 'harbor_risen', from: [[4, 6]], stage: 1 },
  { map: 'harbor_risen', from: [[4, 6]], stage: 3 },
  { map: 'lamp_room', from: [[3, 6]] },
  { map: 'fountain_square', from: [[11, 4]] },
  { map: 'shop', from: [[4, 6]] },
  { map: 'crown', from: [[11, 12]] },
  { map: 'belfry', from: [[1, 7]] },
  { map: 'clockmaker_shop', from: [[4, 6]] },
  { map: 'hundred_steps', from: [[6, 1], [6, 40]] },
  { map: 'lamp_street', from: [[22, 5]] },
  { map: 'archive', from: [[7, 12]] },
  { map: 'bow_passage', from: [[2, 4]] },
  { map: 'windlass_room', from: [[1, 6]] },
];

for (const r of REACH) {
  test(`every Act 5 object can be reached: ${r.map}${r.stage ? ` (Teeth ${r.stage})` : ''}`, async ({ page }) => {
    const [x, y] = r.from[0];
    const errors = await start(page, `?map=${r.map}&x=${x}&y=${y}&flags=${STATE},teeth.stage=${r.stage || 1}&items=${ITEMS}`);
    await readThrough(page, () => page.keyboard.press('z'));
    const unreachable = await page.evaluate((from) => {
      const w = window.moonshine.world;
      const p = w.player;
      const out = [];
      for (const e of w.entities) {
        if (e.isPlayer || !e.visible) continue;
        const d = e.def || {};
        if (!(d.interact || d.look || d.looks || d.talk || d.talks)) continue;
        const spots = w.interactSpots(e);
        let ok = false;
        for (const [fx, fy] of from) {
          for (const s of spots) {
            if (s.x === fx && s.y === fy) { ok = true; break; }
            const saved = [p.x, p.y];
            p.x = fx; p.y = fy;
            const path = w.pathFor(p, [[s.x, s.y]]);
            [p.x, p.y] = saved;
            if (path && path.length && path[path.length - 1][0] === s.x && path[path.length - 1][1] === s.y) { ok = true; break; }
          }
          if (ok) break;
        }
        if (!ok) out.push(e.id);
      }
      return out;
    }, r.from);
    expect(unreachable).toEqual([]);
    expect(errors).toEqual([]);
  });
}

// ---- the Keepers' ladder ---------------------------------------------------
// Up from the Windlass Room beside the speaking tube to the belfry's floor
// hatch, by keyboard; back down by pointer; and the quick climb after that.

test("the Keepers' ladder: up by keyboard, down by pointer", async ({ page }) => {
  test.setTimeout(120000);
  const errors = await start(page, `?map=windlass_room&x=12&y=3&facing=right&flags=${PRIOR},act5.started,door.open,passage.lit,windlass.seen&items=${ITEMS}`);
  const read = (opts) => readThrough(page, () => page.keyboard.press('z'), opts);
  let log;
  await read();
  // The first look finds the rungs and offers the climb straight away.
  await kbInteract(page, 'speaking_tube');
  log = await read({ stop: (st) => !!st.choice });
  expect(joined(log)).toContain('rungs beside it, going up into the dark');
  await kbChoose(page, 0);
  log = await read();
  expect(joined(log)).toContain('YOU CAME UP THROUGH MY FLOOR');
  expect(joined(log)).toContain("The Keepers didn't take the Steps");
  let s = await snap(page);
  expect(s.map).toBe('belfry');
  expect(s.flags['keepers.ladder']).toBeTruthy();
  await shot(page, 'act5-30-belfry-hatch');
  // Back down by pointer.
  await ptrInteract(page, 'keepers_hatch');
  await readThrough(page, ptrAdvance(page), { stop: (st) => !!st.choice });
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'windlass_room', null, 10000);
  await readThrough(page, ptrAdvance(page));
  s = await snap(page);
  expect([s.x, s.y]).toEqual([16, 3]);
  // The second time up is a quick climb, by walking up into the rungs.
  await kbFace(page, 'up');
  await page.keyboard.press('ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'belfry', null, 5000);
  expect(errors).toEqual([]);
});

// ---- the jug on the Boatman ------------------------------------------------
// From the step above him (23, 7), facing down onto the broken edge, by
// keyboard: his own jug line, not his catch-all.

test('the square jug on the Boatman, from the step above him', async ({ page }) => {
  const errors = await start(page, `?map=bilge_dry&x=23&y=7&facing=down&flags=${PRIOR},act5.started,teeth.stage=1,got.bucket,met.boatman5,n.edge=1&items=square_jug,bucket`);
  await kbHold(page, 'square_jug');
  await page.keyboard.press('z');
  const log = await readThrough(page, () => page.keyboard.press('z'));
  expect(joined(log)).toContain("Mott's jug? It'd make the boat drunk.");
  expect(joined(log)).not.toContain("It's not water");
  expect(errors).toEqual([]);
});

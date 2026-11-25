// Plays Act 3, Downstairs (docs/design/03-downstairs.md), start to finish:
// once by keyboard alone and once by pointer alone, from the open hundredth
// step to the hand-off into Act 4. Screenshots of key moments go to tests/screenshots/act3-*.
//
// The keyboard run arrives with Ottilie's paper and takes the rubbing on the
// way through. The pointer run arrives without it, gets it from Ottilie in the
// crypt, and goes back down through the Founders' Door for the rubbing. The
// pointer run also takes the drop-ladder shortcut both ways before the valve,
// and both runs check that the ladders up decline after it.
import { test, expect } from '@playwright/test';
import { snap, waitFor, shot } from './helpers.js';

const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const STEP_FLAGS = 'act1.moonrise,act1.done,act2.started,piano.slid,movers.met,counter.left,step.found,step.open,basin.inside,got.crowbar,ottilie.met,n.stepsArrived=1';
const START_KB = `?map=hundred_steps&x=10&y=18&facing=down&flags=${STEP_FLAGS}&items=soap,hat,moon_chart,crowbar,paper_charcoal`;
const START_PTR = `?map=hundred_steps&x=10&y=18&facing=down&flags=${STEP_FLAGS}&items=soap,hat,moon_chart,crowbar`;

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
async function readThrough(page, advance, { stop = null, timeout = 90000 } = {}) {
  const log = [];
  const end = Date.now() + timeout;
  let last = null;
  while (Date.now() < end) {
    const s = await snap(page);
    if (stop && stop(s)) return log;
    if (s.choice) return log;
    if (s.inventoryOpen && !s.text) return log;
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

// Read up to a choice; answer it with the keyboard (index 0 = first option).
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

// ---- keyboard -------------------------------------------------------------

const kbAdvance = (page) => () => page.keyboard.press('z');

async function kbWalk(page, x, y) {
  for (let guard = 0; guard < 160; guard++) {
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

async function kbExit(page, x, y, dir, map) {
  await kbWalk(page, x, y);
  await page.keyboard.press(DIRKEY[dir]);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 8000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 15000);
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
}

async function kbInteract(page, id, item = null) {
  for (let guard = 0; guard < 160; guard++) {
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

// Face a walkable tile (the floor inlay) the way a keyboard player does: walk
// to two tiles short of it, then step once toward it, which leaves Cheryl
// facing it. Then Z (holding `item` first, if given).
async function kbApproach(page, x, y, dir, item = null) {
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  await kbWalk(page, x - 2 * dx, y - 2 * dy);
  await page.keyboard.press(DIRKEY[dir]);
  await waitFor(page, ([nx, ny]) => { const p = window.moonshine.snapshot(); return p.x === nx && p.y === ny && !p.moving; }, [x - dx, y - dy], 3000);
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
  return sx >= 4 && sy >= 4 && sx < 252 && sy < 220 && !(sx >= 220 && sy < 32);
}, [tx, ty]);

async function ptrWalk(page, x, y) {
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
          if (sx >= 24 && sy >= 40 && sx < 232 && sy < 200 && !w.isExit(px, py)) best = [px, py];
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
  }
  throw new Error(`never reached ${x},${y}`);
}

// Walk next to an exit tile, then click it.
async function ptrExit(page, x, y, near, map) {
  await ptrWalk(page, near[0], near[1]);
  await clickTileAt(page, x, y);
  await waitFor(page, (m) => window.moonshine.snapshot().map === m, map, 10000);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.idle || !!s.text || !!s.choice; }, null, 15000);
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

async function ptrSelect(page, item) {
  await clickGame(page, 241, 14);
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  const i = (await snap(page)).items.indexOf(item);
  expect(i).toBeGreaterThanOrEqual(0);
  const slot = await page.evaluate((i) => window.moonshine.display.toClient(40 + (i % 8) * 22 + 11, 36 + Math.floor(i / 8) * 22 + 11), i);
  const sel = await page.evaluate(() => { const s = window.moonshine.world.inventory.openState; return s.owned[s.index]; });
  if (sel !== item) {
    await page.mouse.click(slot.x, slot.y);
    await page.waitForTimeout(100);
  }
  return slot;
}

async function ptrUse(page, item, id) {
  await ptrSelect(page, item);
  await clickGame(page, 148, 94); // the Use button
  await waitFor(page, (item) => window.moonshine.snapshot().holding === item, item);
  await waitFor(page, () => !window.moonshine.snapshot().busy);
  await ptrInteract(page, id);
}

async function ptrLookItem(page, item) {
  await ptrSelect(page, item);
  await clickGame(page, 100, 94); // the Look button
}

// ---- the playthroughs -------------------------------------------------------

test.describe.configure({ mode: 'parallel' });

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const s = await snap(page).catch(() => null);
    console.log('state at failure:', JSON.stringify(s && { map: s.map, x: s.x, y: s.y, facing: s.facing, text: s.text, busy: s.busy, flags: s.flags, items: s.items }));
    await page.screenshot({ path: `tests/screenshots/act3-failure-${info.title.split(':')[0]}.png` }).catch(() => {});
  }
});

test('keyboard: Act 3', async ({ page }) => {
  test.setTimeout(480000);
  const errors = await start(page, START_KB);
  const adv = kbAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  // Down the hundredth step: once open it's a solid hole at (10, 19); facing it, Z asks "Go down?".
  await page.keyboard.press('z');
  await kbChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 15000);
  log = await readUntil(page, adv, 'All this time.');
  await shot(page, 'act3-01-under-the-steps');
  await read();
  s = await snap(page);
  expect(s.flags['act3.started']).toBeTruthy();

  // The lever: two looks, then the crowbar.
  await kbInteract(page, 'lever');
  log = await read();
  expect(joined(log)).toContain('I think this opens it.');
  await kbInteract(page, 'lever');
  log = await read();
  expect(joined(log)).toContain('I happen to have a crowbar.');
  await kbInteract(page, 'lever', 'crowbar');
  log = await readUntil(page, adv, 'Daylight. Straight down');
  await shot(page, 'act3-02-daylight');
  log = log.concat(await read());
  expect(joined(log)).toContain("I've opened more than one lid.");
  expect((await snap(page)).flags['gallery.lever']).toBeTruthy();

  // The mirror: up-left to the Sisters, straight up to the moons, up-right to the hatch.
  await kbInteract(page, 'mirror');
  log = await readUntil(page, adv, 'Three bars');
  await shot(page, 'act3-03-mirror-sisters');
  await read();
  await kbInteract(page, 'mirror');
  log = await read();
  expect(joined(log)).toContain('Moons, as squares filling up.');
  await kbInteract(page, 'mirror');
  log = await readUntil(page, adv, 'The glass drinks the light');
  await shot(page, 'act3-04-hatch-opens');
  log = log.concat(await read());
  expect(joined(log)).toContain('A lock that wants the sun.');
  expect((await snap(page)).flags['gallery.hatch']).toBeTruthy();

  // The Cradle: the disc, and the chute.
  await kbExit(page, 15, 3, 'up', 'cradle');
  await shot(page, 'act3-05-cradle');
  await kbInteract(page, 'chute');
  log = await read();
  expect(joined(log)).toContain('Not into the dark without a light.');
  await kbInteract(page, 'cradle');
  log = await read();
  expect(joined(log)).toContain("I wasn't expecting warm.");
  expect((await snap(page)).items).toContain('moonglass_disc');
  await kbInteract(page, 'chute');
  await read();
  await kbChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'lamp_halls', null, 15000);
  log = await readUntil(page, adv, "I won't be going back up that.");
  await shot(page, 'act3-06-lamp-halls');
  log = log.concat(await read());
  expect(joined(log)).toContain('Pools of daylight here and there');

  // A light-pipe, a lamp, the speaking tube.
  await kbInteract(page, 'light_pipe_6');
  log = await read();
  expect(joined(log)).toContain('Did I do that?');
  await kbInteract(page, 'lamp_halls_w', 'moonglass_disc');
  log = await read();
  expect(joined(log)).toContain('It drinks from the disc and wakes up.');
  await kbInteract(page, 'speaking_tube');
  log = await read();
  expect(joined(log)).toContain('Tessel: Forward!');

  // The valve: the crowbar slips off the square spindle.
  await kbInteract(page, 'valve');
  await read();
  await kbInteract(page, 'valve', 'crowbar');
  log = await read();
  expect(joined(log)).toContain('Somebody had a key for this.');
  await kbInteract(page, 'passage');
  log = await read();
  expect(joined(log)).toContain('Toward the Crown.');

  // The Bunk Room: too dark; light the lamp; the key.
  await kbExit(page, 13, 6, 'up', 'bunk_room');
  log = await read();
  expect(joined(log)).toContain('My disc barely gets past the door.');
  await shot(page, 'act3-07-bunk-dark');
  await kbInteract(page, 'tool_rack');
  log = await read();
  expect(joined(log)).toContain('Too dark to see');
  await kbInteract(page, 'lamp_bunk', 'moonglass_disc');
  log = await read();
  expect(joined(log)).toContain('so does the room');
  await kbInteract(page, 'tool_rack');
  log = await readUntil(page, adv, 'same size as that spindle');
  await shot(page, 'act3-08-tool-rack');
  await read();
  expect((await snap(page)).items).toContain('valve_key');
  await kbExit(page, 4, 5, 'down', 'lamp_halls');

  // The valve key: the passage drains, and the Fountain stops.
  await kbInteract(page, 'valve', 'valve_key');
  log = await readUntil(page, adv, "The Fountain's STOPPED");
  await shot(page, 'act3-09-the-fountain');
  log = log.concat(await read());
  expect(joined(log)).toContain("I've stopped the Fountain.");
  s = await snap(page);
  expect(s.flags['halls.valve']).toBeTruthy();
  expect(s.items).not.toContain('valve_key');

  // The ladders up decline now.
  await kbInteract(page, 'drop_ladder');
  await read();
  await kbChoose(page, 0); // pull the chain
  log = await read();
  expect(joined(log)).toContain('There. A back door.');
  await kbInteract(page, 'drop_ladder');
  log = await read();
  expect(joined(log)).toContain('I want to see where that passage goes.');

  // North to the Chart Room: the floor is a picture.
  await kbWalk(page, 25, 1);
  await read();
  await kbExit(page, 25, 1, 'up', 'chart_room');
  log = await readUntil(page, adv, 'Halfway up the hill.');
  await shot(page, 'act3-10-the-floor');
  log = log.concat(await readUntil(page, adv, "we're a boat"));
  await shot(page, 'act3-11-a-boat');
  log = log.concat(await read());
  expect((await snap(page)).flags['chart.seen']).toBeTruthy();

  // The Keeper's ledger, the shaft and bowl, the rubbing.
  await kbInteract(page, 'ledger');
  log = await read();
  expect(joined(log)).toContain('Rang at the turn. All well.');
  await kbInteract(page, 'ledger');
  log = await read();
  expect(joined(log)).toContain('Someone must stay.');
  await kbApproach(page, 5, 8, 'up');
  log = await read();
  expect(joined(log)).toContain('very nearly my house');
  await kbApproach(page, 8, 9, 'up', 'paper_charcoal');
  log = await read();
  expect(joined(log)).toContain('doing a brass');
  expect((await snap(page)).items).toContain('ship_plan');
  await kbLookItem(page, 'ship_plan');
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 5000);
  await page.waitForTimeout(500);
  await shot(page, 'act3-12-ship-plan');
  await page.keyboard.press('z');
  await waitFor(page, () => !window.moonshine.snapshot().picture, null, 5000);
  await page.waitForTimeout(400);
  if ((await snap(page)).inventoryOpen) { await page.keyboard.press('x'); await page.waitForTimeout(200); }

  // The Founders' Door: look, then draw the bolt.
  await kbInteract(page, 'founders_door_in');
  log = await read();
  expect(joined(log)).toContain("'I have bolted the door. Someone must stay.'");
  await kbInteract(page, 'founders_door_in');
  log = await read();
  expect(joined(log)).toContain("It moves like it's been waiting.");
  await shot(page, 'act3-13-door-open');

  // Through it: Ottilie, in the crypt, at dusk.
  await kbExit(page, 7, 3, 'up', 'crypt');
  log = await readUntil(page, adv, 'I have a monograph.');
  await shot(page, 'act3-14-ottilie-crypt');
  log = log.concat(await read());
  expect(joined(log)).toContain('What did you rub?');
  expect(joined(log)).toContain('Have some soup.');

  // Up through the Archive to the Crown at dusk.
  await kbExit(page, 1, 5, 'left', 'archive');
  await kbInteract(page, 'ottilie');
  log = await read();
  expect(joined(log)).toContain('There\'s a gap somewhere.');
  await kbExit(page, 7, 12, 'down', 'crown');
  log = await read();
  await settle(page);
  await shot(page, 'act3-15-crown-dusk');
  s = await snap(page);
  expect(s.lighting).toBe('dusk');
  expect(s.flags['act3.surfaced']).toBeTruthy();
  await kbInteract(page, 'watering_dusk');
  log = await read();
  expect(joined(log)).toContain('Pelletier boys');
  await kbInteract(page, 'ambrose_dusk');
  log = await read();
  expect(joined(log)).toContain('NOBODY RANG FOR THAT.');

  // The south parapet: the vista, and the end.
  await kbWalk(page, 16, 12);
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 10000);
  log = await readUntil(page, adv, 'That was me.');
  await page.waitForTimeout(300);
  await shot(page, 'act3-16-vista');
  log = log.concat(await read({ stop: (st) => !!st.flags['act3.done'] }));
  // Act 4 picks up the next morning, in the flat.
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat' && !!window.moonshine.snapshot().flags['act4.started'], null, 20000);
  expect(errors).toEqual([]);
});

test('pointer: Act 3', async ({ page }) => {
  test.setTimeout(480000);
  const errors = await start(page, START_PTR);
  const adv = ptrAdvance(page);
  const read = (opts) => readThrough(page, adv, opts);
  let log, s;

  // Click the hole: "Go down?" Yes.
  await clickTileAt(page, 10, 19);
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 15000);
  await read();

  // The lever needs the crowbar; the mirror, three times.
  await ptrInteract(page, 'lever');
  await read();
  await ptrUse(page, 'crowbar', 'lever');
  log = await read();
  expect(joined(log)).toContain("I've opened more than one lid.");
  for (let i = 0; i < 3; i++) {
    await ptrInteract(page, 'mirror');
    await read();
  }
  expect((await snap(page)).flags['gallery.hatch']).toBeTruthy();

  // Into the Cradle; the disc; down the chute.
  await ptrExit(page, 15, 2, [15, 3], 'cradle');
  await ptrInteract(page, 'cradle');
  await read();
  await ptrInteract(page, 'chute');
  await read();
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'lamp_halls', null, 15000);
  await read();

  // Drop the ladder and take the shortcut up to the gallery and back down.
  await ptrInteract(page, 'drop_ladder');
  await read();
  await ptrChoose(page, 0);
  await read();
  expect((await snap(page)).flags['halls.ladder']).toBeTruthy();
  await ptrInteract(page, 'drop_ladder');
  await read();
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 10000);
  await read();
  await shot(page, 'act3-p1-gallery-grate');
  // The ladder up to the Steps works too, before the valve.
  await ptrInteract(page, 'ladder_up');
  await read();
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'hundred_steps', null, 10000);
  await read();
  s = await snap(page);
  expect([s.x, s.y]).toEqual([10, 18]);
  await clickTileAt(page, 10, 19);
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'step_gallery', null, 15000);
  await read();
  await ptrInteract(page, 'grate');
  await read();
  await ptrChoose(page, 0);
  await waitFor(page, () => window.moonshine.snapshot().map === 'lamp_halls', null, 10000);
  await read();

  // The Bunk Room: light the lamp, take the key.
  await ptrExit(page, 13, 5, [13, 6], 'bunk_room');
  await read();
  await ptrUse(page, 'moonglass_disc', 'lamp_bunk');
  await read();
  await ptrInteract(page, 'tool_rack');
  await read();
  expect((await snap(page)).items).toContain('valve_key');
  await ptrExit(page, 4, 6, [4, 5], 'lamp_halls');

  // The valve.
  await ptrUse(page, 'valve_key', 'valve');
  log = await read();
  expect(joined(log)).toContain('Five hundred YEARS!');

  // North to the Chart Room; no paper yet.
  await ptrWalk(page, 25, 1);
  await read();
  await ptrExit(page, 25, 0, [25, 1], 'chart_room');
  log = await read();
  expect(joined(log)).toContain("Oh, we're a boat.");
  await ptrInteract(page, 'inlay_7_6'); // the mast
  log = await read();
  expect(joined(log)).toContain("Ambrose's bell is attached to something.");
  await ptrInteract(page, 'founders_door_in');
  log = await read();
  expect(joined(log)).toContain('And stayed in here.');
  await ptrInteract(page, 'founders_door_in');
  await read();
  expect((await snap(page)).flags['founders.unbolted']).toBeTruthy();

  // The crypt: Ottilie gives her paper.
  await ptrExit(page, 7, 2, [7, 3], 'crypt');
  log = await read();
  expect(joined(log)).toContain('take rubbings. Here.');
  expect((await snap(page)).items).toContain('paper_charcoal');

  // Back down through the Founders' Door for the rubbing.
  await ptrExit(page, 5, 2, [5, 3], 'chart_room');
  await read();
  await ptrUse(page, 'paper_charcoal', 'inlay_9_9');
  log = await read();
  expect(joined(log)).toContain('Then she\'d want it framed.');
  await ptrLookItem(page, 'ship_plan');
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 5000);
  await page.waitForTimeout(400);
  await clickGame(page, 128, 112);
  await waitFor(page, () => !window.moonshine.snapshot().picture, null, 5000);
  await page.waitForTimeout(400);
  if ((await snap(page)).inventoryOpen) { await clickGame(page, 241, 14); await page.waitForTimeout(300); }
  if ((await snap(page)).inventoryOpen) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }

  // The ladders decline after the valve.
  await ptrExit(page, 7, 13, [7, 12], 'lamp_halls');
  await ptrInteract(page, 'drop_ladder');
  log = await read();
  expect(joined(log)).toContain("Ottilie's door is quicker.");

  // Back up, through the Archive, to the Crown at dusk.
  await ptrWalk(page, 25, 1);
  await ptrExit(page, 25, 0, [25, 1], 'chart_room');
  await read();
  await ptrExit(page, 7, 2, [7, 3], 'crypt');
  await read();
  await ptrExit(page, 1, 5, [2, 5], 'archive');
  await read();
  await ptrUse(page, 'ship_plan', 'ottilie');
  log = await read();
  expect(joined(log)).toContain('And a sherry.');
  await ptrExit(page, 7, 13, [7, 12], 'crown');
  await read();
  await ptrInteract(page, 'kid_dusk');
  log = await read();
  expect(joined(log)).toContain('GLOWING');
  await ptrWalk(page, 11, 12);
  await clickTileAt(page, 11, 13);
  await waitFor(page, () => window.moonshine.snapshot().picture, null, 10000);
  await read({ stop: (st) => !!st.flags['act3.done'] });
  // Act 4 picks up the next morning, in the flat.
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat' && !!window.moonshine.snapshot().flags['act4.started'], null, 20000);
  expect(errors).toEqual([]);
});

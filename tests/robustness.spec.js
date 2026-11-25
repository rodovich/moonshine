// Regression tests for robustness bugs found in review: paths through doors,
// old saves, hanging effects, content errors, and script API edge cases.
import { test, expect } from '@playwright/test';
import { boot, snap, waitIdle, waitFor, clickTile, press } from './helpers.js';

const STREET = '?map=test_street&seed=1&flags=street_intro,saw_canal';

// Run a script in the game and wait (up to `ms`) for it to finish.
async function runScript(page, body, ms = 5000) {
  return page.evaluate(([src, ms]) => {
    const fn = new Function('g', `return (async () => { ${src} })();`);
    return Promise.race([
      window.moonshine.world.run(fn).then((v) => ({ done: true, v })),
      new Promise((r) => setTimeout(() => r({ done: false }), ms)),
    ]);
  }, [body, ms]);
}

test('clicking an unreachable spot never walks through a door', async ({ page }) => {
  await boot(page, `${STREET}&x=13&y=6`);
  await waitIdle(page);
  await clickTile(page, 12, 2); // the shop's roof, right above its door (an exit)
  await waitIdle(page);
  const s = await snap(page);
  expect(s.map).toBe('test_street');
  expect(s.y).toBeGreaterThanOrEqual(5);
});

test('a save from an older build still loads', async ({ page }) => {
  await page.goto('/');
  const bad = [
    // A map that no longer exists falls back to the new-game start.
    { version: 1, map: 'removed_map', x: 3, y: 3, facing: 'down', flags: {}, inventory: [], expect: 'cistern_court' },
    { version: 1, map: 'test_street', x: 0, y: 0, facing: 'sideways', flags: { street_intro: true } },
    { version: 1, map: 'test_street', x: 99, y: 99, facing: 'up', flags: { street_intro: true }, inventory: ['no_such_item', 'letter'] },
  ];
  for (const { expect: map = 'test_street', ...save } of bad) {
    await page.evaluate((s) => localStorage.setItem('moonshine.save.v1', JSON.stringify(s)), save);
    await page.goto('/');
    await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
    await page.waitForTimeout(700);
    await press(page, 'Enter'); // Continue
    await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
    await page.waitForTimeout(800);
    const s = await snap(page);
    expect(s.map).toBe(map);
    const solid = await page.evaluate(() => { const w = window.moonshine.world; return w.map.solid(w.player.x, w.player.y); });
    expect(solid).toBe(false);
    expect(['up', 'down', 'left', 'right']).toContain(s.facing);
    expect(s.items.includes('no_such_item')).toBe(false);
    expect(await page.evaluate(() => window.moonshine.effects.fadeAlpha)).toBeLessThan(0.5);
  }
});

test('effects and pans always finish', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  expect((await runScript(page, 'await g.shake(3, 0); await g.flicker(0);')).done).toBe(true);
  expect((await runScript(page, 'await Promise.all([g.shake(2, 0.3), g.shake(4, 0.5)]);')).done).toBe(true);
  expect((await runScript(page, 'await Promise.all([g.flicker(0.3), g.flicker(0.2)]);')).done).toBe(true);
  // A slow pan left and up, then back.
  await runScript(page, 'g.place("player", 20, 12);');
  expect((await runScript(page, 'await g.panCamera(2, 2, 0.5); await g.followPlayer(0.5);', 20000)).done).toBe(true);
});

test('a throwing content callback is logged and the game keeps running', async ({ page }) => {
  const errors = await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  await page.evaluate(() => {
    window.moonshine.world.mapDef.exits.push({ x: 13, y: 8, to: 'test_shop', at: [4, 8], when: (g) => g.npc('typo') });
  });
  await press(page, 'ArrowRight');
  await waitIdle(page);
  const t0 = await page.evaluate(() => window.moonshine.ticks);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.moonshine.ticks)).toBeGreaterThan(t0 + 5);
  expect((await snap(page)).map).toBe('test_street');
  expect(errors.some((e) => e.includes('typo'))).toBe(true); // logged, not fatal
  await page.evaluate(() => window.moonshine.world.mapDef.exits.pop());
});

test('script API edge cases', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  // A move's speed lasts only for that move.
  await runScript(page, "await g.movePlayer('r', { speed: 32 });");
  expect(await page.evaluate(() => window.moonshine.world.player.stepTicks)).toBe(12);
  // setFlag updates entities right away.
  const r = await runScript(page, "g.setFlag('door_unlocked'); return !!g.player && (() => { try { g.npc('shop_door'); return 'still there'; } catch { return 'gone'; } })();");
  expect(r.v).toBe('gone');
  // A long choice prompt pages instead of losing its start.
  const long = 'This is a long question. ' + 'It goes on and on, because some people talk like that. '.repeat(4);
  page.evaluate((q) => window.moonshine.world.run((g) => g.choose(q, ['Yes', 'No'], { cancel: null })), long).catch(() => {}); // never answered
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  expect((await snap(page)).text.startsWith('This is a long question.')).toBe(true);
  expect(await page.evaluate(() => window.moonshine.textbox.active.choice.cancelIndex)).toBe(null);
});

test('bag hint stays until the bag is opened', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  await clickTile(page, 3, 12); // the key
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  for (let i = 0; i < 10 && (await snap(page)).text; i++) await press(page, 'z');
  await waitIdle(page);
  await page.waitForTimeout(1500);
  expect((await snap(page)).hint).toContain('X: bag');
  await page.screenshot({ path: 'tests/screenshots/19-bag-hint.png' });
  await press(page, 'x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await press(page, 'x');
  await waitIdle(page);
  expect((await snap(page)).hint).toBe(null);
});

test('patrolling kid stops while Cheryl is near', async ({ page }) => {
  await boot(page, `${STREET}&x=16&y=8`);
  await waitIdle(page);
  await page.waitForTimeout(4000);
  const k = (await snap(page)).entities.find((e) => e.id === 'kid');
  const p = await snap(page);
  expect(Math.abs(k.x - p.x) + Math.abs(k.y - p.y)).toBeLessThanOrEqual(2);
  await page.waitForTimeout(1000);
  expect((await snap(page)).entities.find((e) => e.id === 'kid')).toMatchObject({ x: k.x, y: k.y });
  // Walk away: he carries on.
  await clickTile(page, 8, 8);
  await waitIdle(page);
  await page.waitForTimeout(1500);
  const k2 = (await snap(page)).entities.find((e) => e.id === 'kid');
  expect(k2.x !== k.x || k2.y !== k.y).toBe(true);
});

test('audio unlocks on the first key or tap', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  await press(page, 'ArrowLeft');
  await page.waitForTimeout(300);
  const ready = await page.evaluate(async () => (await import('/src/audio/index.js')).audioReady());
  expect(ready).toBe(true);
});

test('closing the bag with a tap never acts in the world; letterbox taps are ignored', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await boot(page, `${STREET}&x=12&y=8&items=letter`);
  await waitIdle(page);
  const click = async (gx, gy) => {
    const p = await page.evaluate(([x, y]) => window.moonshine.display.toClient(x, y), [gx, gy]);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(150);
  };
  await click(256 - 14, 14); // bag
  const slot = await page.evaluate(() => window.moonshine.inventory.slotRect(0));
  await click(slot.x + 10, slot.y + 10); // select (the bag stays open)
  expect((await snap(page)).inventoryOpen).toBe(true);
  await click(24 + 208 - 10 - 48 - 4 - 44 + 22, 14 + 96 - 24 + 8); // Use
  await waitIdle(page);
  let s = await snap(page);
  expect(s.holding).toBe('letter');
  expect([s.x, s.y]).toEqual([12, 8]);
  // A click in the black margin beside the frame does nothing.
  await page.mouse.click(1270, 400);
  await page.waitForTimeout(400);
  s = await snap(page);
  expect(s.holding).toBe('letter');
  expect([s.x, s.y, s.text]).toEqual([12, 8, null]);
});

// Watch every frame for a character overlapping Cheryl (by pixels).
async function watchOverlap(page, seconds) {
  return page.evaluate(async (seconds) => {
    const w = window.moonshine.world;
    let worst = null;
    const end = performance.now() + seconds * 1000;
    while (performance.now() < end) {
      await new Promise((r) => requestAnimationFrame(r));
      const p = w.player;
      for (const e of w.entities) {
        if (e.isPlayer || !e.solid || !e.visible) continue;
        if (Math.abs(e.px - p.px) < 16 && Math.abs(e.py - p.py) < 16) worst = `${e.id} at ${e.px},${e.py} on Cheryl at ${p.px},${p.py}`;
      }
    }
    return worst;
  }, seconds);
}

test('a patrolling NPC never runs through Cheryl, even a ghost patrol', async ({ page }) => {
  await boot(page, `${STREET}&x=16&y=6&facing=left`);
  await waitIdle(page);
  // No stopNear: he has to wait for her because she's in his way.
  await page.evaluate(() => {
    const k = window.moonshine.world.byId.get('kid');
    k.def = { ...k.def, behavior: { type: 'patrol', route: [[14, 6], [19, 6], [19, 9], [14, 9]], ghost: true } };
  });
  expect(await watchOverlap(page, 6)).toBe(null);
});

test('a scripted walk into Cheryl waits, then she steps aside; it never passes through her', async ({ page }) => {
  await boot(page, `${STREET}&x=17&y=6&facing=left`);
  await waitIdle(page);
  const watching = watchOverlap(page, 6);
  const r = await runScript(page, "await g.moveNpc('kid', 'r r r r r', { ghost: true }); return [g.npc('kid').x, g.player.x, g.player.y];", 8000);
  expect(await watching).toBe(null);
  expect(r.done).toBe(true);
  expect(r.v[0]).toBeGreaterThanOrEqual(19); // he got past where she stood
  expect([r.v[1], r.v[2]]).not.toEqual([17, 6]); // because she stepped aside
});

test('a non-solid patroller on a one-tile corridor: Cheryl gets through, he turns back, no overlap', async ({ page }) => {
  await boot(page, `${STREET}&x=18&y=8&facing=left`);
  await waitIdle(page);
  // Walls above and below row 8 from x=10 to x=17: a one-tile corridor.
  await page.evaluate(() => {
    const w = window.moonshine.world;
    for (let x = 10; x <= 17; x++) {
      w.map.setTile('ground', x, 7, { tile: 'street:retain_top', solid: true });
      w.map.setTile('ground', x, 9, { tile: 'street:retain_top', solid: true });
    }
    const k = w.byId.get('kid');
    k.solid = false;
    k.def = { ...k.def, solid: false, behavior: { type: 'patrol', route: [[9, 8], [18, 8], [18, 6], [9, 6]], ghost: true } };
    k.x = k.fromX = 11; k.y = k.fromY = 8;
    k.patrolIdx = 1;
    const om = w.byId.get('old_man'); // keep his route clear of other people
    om.x = om.fromX = 3; om.y = om.fromY = 6;
  });
  const watching = watchOverlap(page, 12);
  // Planning goes through him: there is a route.
  expect(await page.evaluate(() => { const w = window.moonshine.world; return !!w.pathFor(w.player, [[8, 8]]); })).toBe(true);
  await clickTile(page, 8, 8);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.x === 8 && s.y === 8; }, null, 12000);
  expect(await watching).toBe(null);
});

test('using a held item on plain ground beside Cheryl says so and drops it', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8&items=letter`);
  await waitIdle(page);
  await page.evaluate(() => { window.moonshine.world.control.holding = 'letter'; });
  await clickTile(page, 13, 8);
  await waitFor(page, () => !!window.moonshine.snapshot().text);
  expect((await snap(page)).text).toContain('nothing there');
  expect((await snap(page)).holding).toBe(null);
});

test('start=continue saves (it is the player own game)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('moonshine.save.v1', JSON.stringify({ version: 1, map: 'test_street', x: 12, y: 5, facing: 'up', flags: { street_intro: true, door_unlocked: true }, inventory: [] })));
  await boot(page, '?start=continue');
  await waitIdle(page);
  await press(page, 'ArrowUp');
  await waitFor(page, () => window.moonshine.snapshot().map === 'test_shop');
  await waitIdle(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moonshine.save.v1')).map);
  expect(saved).toBe('test_shop');
});

test('an idle character in a one-tile corridor steps out of Cheryl\'s way, then goes home', async ({ page }) => {
  await boot(page, `${STREET}&x=18&y=8&facing=left`);
  await waitIdle(page);
  await page.evaluate(() => {
    const w = window.moonshine.world;
    for (let x = 10; x <= 17; x++) {
      w.map.setTile('ground', x, 7, { tile: 'street:retain_top', solid: true });
      w.map.setTile('ground', x, 9, { tile: 'street:retain_top', solid: true });
    }
    const k = w.byId.get('kid'); // out of the way
    k.x = k.fromX = 20; k.y = k.fromY = 5; k.def = { ...k.def, behavior: 'idle' };
    const om = w.byId.get('old_man'); // stands in the corridor
    om.x = om.fromX = 13; om.y = om.fromY = 8;
    om.home = { x: 13, y: 8, facing: 'down' };
  });
  // A route exists (planning goes through characters).
  expect(await page.evaluate(() => { const w = window.moonshine.world; return !!w.pathFor(w.player, [[8, 8]]); })).toBe(true);
  const watching = watchOverlap(page, 14);
  await clickTile(page, 8, 8);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.x === 8 && s.y === 8; }, null, 14000);
  // Then, with Cheryl gone by, he walks back to his spot.
  await page.evaluate(() => window.moonshine.world.control.walkTo(5, 6));
  await waitFor(page, () => { const o = window.moonshine.world.byId.get('old_man'); return o.x === 13 && o.y === 8 && !o.yieldHome; }, null, 14000);
  expect(await watching).toBe(null);
});

test('a character marked blocks: true holds its tile; routes go around or not at all', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  const r = await page.evaluate(() => {
    const w = window.moonshine.world;
    const om = w.byId.get('old_man');
    om.def = { ...om.def, blocks: true };
    const through = w.pathFor(w.player, [[om.x, om.y]]);
    return through === null;
  });
  expect(r).toBe(true);
});

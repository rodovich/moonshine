// Engine features for Act 2 and later: item looks, item use precedence,
// barks and emotes, characters placed by story state, blocked and confirm
// exits, map variants, darkness, tweens, effects, and the map viewer.
import { test, expect } from '@playwright/test';
import { boot, snap, waitIdle, waitFor, waitText, readAll, press, clickTile, shot } from './helpers.js';

const STREET = '?map=test_street&seed=1&flags=street_intro,saw_canal';

async function runScript(page, body, ms = 8000) {
  return page.evaluate(([src, ms]) => {
    const fn = new Function('g', `return (async () => { ${src} })();`);
    return Promise.race([
      window.moonshine.world.run(fn).then((v) => ({ done: true, v })),
      new Promise((r) => setTimeout(() => r({ done: false }), ms)),
    ]);
  }, [body, ms]);
}

test('Look in the bag cycles an item\'s descriptions and returns to the bag', async ({ page }) => {
  await boot(page, `${STREET}&items=letter`);
  await waitIdle(page);
  const seen = [];
  await press(page, 'x');
  for (let i = 0; i < 4; i++) {
    await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
    // Keyboard: down to the buttons (Look is selected first? Use is), left to Look, Z.
    await press(page, 'ArrowDown');
    await press(page, 'ArrowLeft');
    if (i === 0) await shot(page, '24-bag-look-button');
    await press(page, 'z');
    await waitText(page);
    seen.push((await snap(page)).text);
    // Dismiss the text (not readAll: Z in the reopened bag would mean Use).
    while ((await snap(page)).text) await press(page, 'z');
  }
  expect(seen[0]).toContain('hold it up');
  expect(seen[1]).toContain('cedar');
  expect(seen[2]).toContain('crack');
  expect(seen[3]).toContain('cedar'); // cycles after the first
});

test('item use precedence: target, item useOn, decline, default', async ({ page }) => {
  await boot(page, `${STREET}&x=8&y=7&facing=right&items=brass_key,letter`);
  await waitIdle(page);
  const said = async (body) => {
    page.evaluate((b) => window.moonshine.world.run(new Function('g', `return (async () => { ${b} })();`)), body).catch(() => {});
    await waitText(page);
    const t = (await snap(page)).text;
    await readAll(page, 'z', 6);
    await waitIdle(page);
    return t;
  };
  const om = "window.moonshine.world.interactWith(window.moonshine.world.byId.get('old_man'), ";
  void om;
  expect(await said("await g.npc('old_man'); return window.moonshine.world.useItemOn(g.npc('old_man'), 'brass_key');")).toContain('My key');
  expect(await said("return window.moonshine.world.useItemOn(g.npc('old_man'), 'letter');")).toContain('everything I need');
  expect(await said("return window.moonshine.world.useItemOn(g.npc('kid'), 'brass_key');")).toContain('strangers');
  // The content's default: Cheryl's fallback lines, in turn (docs/design/01-opening.md).
  expect(await said("return window.moonshine.world.useItemOn(g.npc('cat'), 'letter');")).toMatch(/^No\.$|not where that goes|somehow|explain it later/);
});

test('barks and emotes don\'t stop the player', async ({ page }) => {
  await boot(page, `${STREET}&x=13&y=8`);
  await waitIdle(page);
  await runScript(page, "g.bark('Skipping Girls', 'One for the steps and two for the tide!', { seconds: 3 }); g.emote('old_man', 'note', { seconds: 3 });");
  await page.waitForTimeout(200);
  await shot(page, '25-bark-emote');
  expect(await page.evaluate(() => !!window.moonshine.world.ambient.barkState)).toBe(true);
  await press(page, 'ArrowLeft'); // still walks while the bark shows
  await waitIdle(page);
  expect((await snap(page)).x).toBe(12);
});

test('characters move between maps by story state', async ({ page }) => {
  await boot(page, STREET);
  await waitIdle(page);
  expect((await snap(page)).entities.some((e) => e.id === 'kid')).toBe(true);
  await runScript(page, "g.setFlag('letter_delivered');");
  expect((await snap(page)).entities.some((e) => e.id === 'kid')).toBe(false);
  await runScript(page, "g.setFlag('lane_intro'); await g.changeMap('test_lane', 9, 2, 'down');", 15000);
  await waitIdle(page, 15000);
  const kid = (await snap(page)).entities.find((e) => e.id === 'kid');
  expect(kid).toMatchObject({ x: 12, y: 5 });
});

test('a blocked exit explains itself and steps back; confirm asks first', async ({ page }) => {
  await boot(page, `${STREET}&x=1&y=7`);
  await waitIdle(page);
  await press(page, 'ArrowLeft');
  await waitText(page);
  expect((await snap(page)).text).toContain('closed off');
  await readAll(page);
  await waitIdle(page);
  expect([(await snap(page)).x, (await snap(page)).map]).toEqual([1, 'test_street']);
  // A confirm exit, added on the fly: "Not yet" stays, "Yes" goes.
  await page.evaluate(() => window.moonshine.world.mapDef.exits.push({ x: 2, y: 8, to: 'test_shop', at: [4, 8], facing: 'up', confirm: 'Go in?' }));
  await press(page, 'ArrowDown');
  await waitIdle(page);
  await press(page, 'ArrowRight');
  // Wait for the options themselves (the prompt types out first).
  await waitFor(page, () => window.moonshine.textbox.active?.choice?.rects.length > 0);
  await press(page, 'ArrowDown');
  await press(page, 'z');
  await waitIdle(page);
  expect((await snap(page)).map).toBe('test_street');
  expect([(await snap(page)).x, (await snap(page)).y]).not.toEqual([2, 8]);
  await page.evaluate(() => window.moonshine.world.mapDef.exits.pop());
});

test('map variant: the canal drains, and the shop goes dark around Cheryl', async ({ page }) => {
  await boot(page, '?map=test_lane&x=9&y=9&flags=lane_intro,letter_delivered');
  await waitIdle(page);
  expect(await page.evaluate(() => window.moonshine.world.map.solid(5, 11))).toBe(false);
  await shot(page, '26-variant-drained');
  await boot(page, '?map=test_shop&x=4&y=6&flags=letter_delivered');
  await waitIdle(page);
  await shot(page, '27-darkness');
  const dark = await page.evaluate(() => {
    const c = window.moonshine.display.buffer.getContext('2d');
    const corner = c.getImageData(30, 40, 1, 1).data;
    return corner[0] + corner[1] + corner[2];
  });
  expect(dark).toBeLessThan(120);
});

test('tween, clip, effects, and cycle finish', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  const r = await runScript(page, `
    await g.tween('player', { offset: [0, 16], seconds: 0.5, clipBelow: true });
    await g.tween('player', { offset: [0, 0], seconds: 0.2, clipBelow: false });
    const fx = g.spawnEffect({ sprite: { sheet: g.npc('cat').def.sprite.sheet, frame: 'cat_sleep' }, path: [[12, 9], [16, 9]], speed: 2 });
    await fx;
    const a = g.cycle('mirror', ['n', 'e', 's']);
    const b = g.cycle('mirror', ['n', 'e', 's']);
    return a + b;
  `);
  expect(r).toEqual({ done: true, v: 'ne' });
});

test('map viewer renders every map without errors', async ({ page }) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  for (const id of ['test_street', 'test_shop', 'test_lane']) {
    await page.goto(`/dev/map.html?map=${id}&zoom=1`);
    await page.waitForFunction(() => document.getElementById('info').textContent.length > 0);
    expect(await page.evaluate(() => document.getElementById('errors').textContent)).toBe('');
  }
  await page.goto('/dev/map.html?map=test_street&zoom=2');
  await page.waitForTimeout(300);
  await shot(page, '28-map-viewer');
  expect(errs).toEqual([]);
});

test('content validator passes', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, ['tests/check-content.mjs'], { encoding: 'utf8' });
  expect(out).toContain('0 error(s)');
});

test('character frames: art names walk and idle; poses follow facing', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  // Sample frames over a walk: never missing.
  await page.keyboard.down('ArrowLeft');
  const missing = await page.evaluate(async () => {
    const w = window.moonshine.world;
    let n = 0;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      for (const e of [w.player, w.byId.get('kid')]) if (e && !e.currentFrame()?.img) n++;
    }
    return n;
  });
  await page.keyboard.up('ArrowLeft');
  expect(missing).toBe(0);
  // A pose base follows facing; an offset applies while posed.
  const r = await runScript(page, `
    const p = g.player;
    p.facing = 'left';
    g.pose('player', 'reach', { offset: [0, -3] });
    const a = p.currentFrame().img;
    g.pose('player', 'reach_left');
    const b = p.currentFrame().img;
    g.pose('player', null);
    return a === b && a !== null;
  `);
  expect(r.v).toBe(true);
});

test('waitForInput resolves on a key', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  const pending = page.evaluate(() => window.moonshine.world.run(async (g) => { await g.waitForInput(); return 'ok'; }));
  await page.waitForTimeout(300);
  await press(page, 'z');
  expect(await pending).toBe('ok');
});

test('cutscene visit: camera follows an NPC on another map, then Cheryl comes back', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  const r = await runScript(page, `
    g.setFlag('letter_delivered'); // the Kid is in the lane now
    g.setFlag('lane_intro');
    await g.changeMap('test_lane', null, null, null, { cutscene: true, fade: false });
    const hidden = !g.player.visible;
    g.cameraFollow('kid');
    await g.moveNpc('kid', [16, 5]);
    const cam = window.moonshine.world.cam.x;
    await g.restorePlayer({ fade: false });
    return { hidden, cam, map: g.map, x: g.player.x, y: g.player.y, visible: g.player.visible };
  `, 15000);
  expect(r.done).toBe(true);
  expect(r.v).toMatchObject({ hidden: true, map: 'test_street', x: 12, y: 8, visible: true });
  expect(r.v.cam).toBeGreaterThan(0);
});

test('a closed conditional exit is ordinary floor for paths', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=7`);
  await waitIdle(page);
  await page.evaluate(() => window.moonshine.world.mapDef.exits.push({ x: 13, y: 7, to: 'test_shop', at: [4, 8], when: () => false }));
  const path = await page.evaluate(() => {
    const w = window.moonshine.world;
    return w.pathFor(w.player, [[14, 7]]);
  });
  expect(path).toEqual([[13, 7], [14, 7]]);
  await page.evaluate(() => window.moonshine.world.mapDef.exits.pop());
});

test('Act 4 scene tools: held tilt, white fade, timed tile swaps, chained pans', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  const r = await runScript(page, `
    await g.tilt(2, 0, 0.3);
    const held = window.moonshine.effects.shakeOffset()[0];
    await g.tilt(0, 0, 0.2);
    await g.fade('out', 0.2, 'white_light');
    await g.fade('in', 0.2);
    for (let x = 6; x < 10; x++) { g.setTile('ground', x, 12, 'canal:water'); await g.wait(0.05); }
    await g.panCamera(20, 8, 1.5);
    await g.panCamera(20, 14, 1.5);
    await g.followPlayer(3);
    return held;
  `, 20000);
  expect(r).toEqual({ done: true, v: 2 });
});

test('credits roll over a picture, skip after a moment, then back to the title', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8&save=1`);
  await waitIdle(page);
  page.evaluate(() => window.moonshine.world.run(async (g) => {
    g.markComplete();
    await g.credits([{ text: 'MOONSHINE', heading: true }, '', 'Engine', 'a lander task', '', 'Thank you for playing.'], { skipAfter: 0.5, hold: 0.5, fade: 0.2 });
    await g.toTitle();
  })).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tests/screenshots/31-credits.png' });
  await press(page, 'z'); // skip to the last line
  await waitFor(page, () => window.moonshine.snapshot().scene === 'title', null, 10000);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moonshine.save.v1')));
  expect(saved.flags['game.complete']).toBe(true);
});

test('ambient script events and music as a function of state', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=8`);
  await waitIdle(page);
  await page.evaluate(() => {
    const def = window.moonshine.world.mapDef;
    def.ambient = [...(def.ambient || []), { every: [0.3, 0.3], when: (g) => !g.flag('bell'), script: true, run: async (g) => { g.setFlag('bell'); await g.say('Bell', 'BONG.'); } }];
  });
  await waitFor(page, () => window.moonshine.snapshot().speaker === 'Bell', null, 5000);
  await readAll(page);
  await waitIdle(page);
  const r = await runScript(page, `
    const def = window.moonshine.world.mapDef;
    def.music = (g) => (g.flag('bell') ? 'title' : 'cistern_court');
    await g.changeMap('test_street', 12, 8, 'down', { fade: false });
    return (await import('/src/audio/index.js')).currentMusic();
  `);
  expect(r.v).toBe('title');
});

test('interaction targeting: characters beat hotspots, shared tiles, moving targets, tall things', async ({ page }) => {
  await boot(page, `${STREET}&x=8&y=7&facing=right`);
  await waitIdle(page);
  const w = (fn) => page.evaluate(fn);
  // 1. A hotspot under the Old Man: Z talks to him, not the hotspot.
  await w(() => {
    const world = window.moonshine.world;
    world.mapDef.entities.push({ id: 'grate', x: 9, y: 7, solid: false, look: 'A drain grate.' });
    world.refreshEntities();
  });
  await press(page, 'z');
  await waitText(page);
  expect((await snap(page)).speaker).toBe('Old Man');
  for (let i = 0; i < 30; i++) {
    const s = await snap(page);
    if (!s.text && !s.busy) break;
    if (s.choice) await press(page, 'Enter'); else await press(page, 'z');
  }
  await waitIdle(page, 10000);
  // 4. Clicking a lamp's top (overhead) reaches a hotspot on the post below.
  await w(() => {
    const world = window.moonshine.world;
    world.mapDef.entities.push({ id: 'lamp', x: 7, y: 7, look: 'A lamp. Lit early.' });
    world.refreshEntities();
  });
  await clickTile(page, 7, 6);
  await waitText(page, 10000);
  expect((await snap(page)).text).toContain('Lit early');
  await readAll(page);
  await waitIdle(page);
  // 2. A non-solid character on Cheryl's own tile: Z still reaches him.
  await runScript(page, `
    const k = g.npc('kid');
    k.solid = false; k.def = { ...k.def, behavior: 'idle' };
    g.place('kid', g.player.x, g.player.y, 'up');
  `);
  await press(page, 'z');
  await waitText(page);
  expect((await snap(page)).speaker).toBe('Sweaty Kid');
  await readAll(page);
  await waitIdle(page);
});

test('click-to-talk reaches a character who keeps moving', async ({ page }) => {
  await boot(page, `${STREET}&x=13&y=8`);
  await waitIdle(page);
  await page.evaluate(() => {
    const k = window.moonshine.world.byId.get('kid');
    k.def = { ...k.def, behavior: { type: 'patrol', route: [[14, 6], [19, 6], [19, 9], [14, 9]] } };
  });
  await page.waitForTimeout(600);
  const kid = await page.evaluate(() => { const k = window.moonshine.world.byId.get('kid'); return [k.x, k.y]; });
  await clickTile(page, kid[0], kid[1]);
  await waitFor(page, () => window.moonshine.snapshot().speaker === 'Sweaty Kid', null, 15000);
});

test('click-to-use chases a fast runner until he stops, then uses the item', async ({ page }) => {
  await boot(page, `${STREET}&x=13&y=8&items=letter`);
  await waitIdle(page);
  await page.evaluate(() => {
    const w = window.moonshine.world;
    const k = w.byId.get('kid');
    k.stepTicks = 7; // faster than Cheryl
    k.def = { ...k.def, behavior: { type: 'patrol', route: [[14, 6], [19, 6], [19, 9], [14, 9]], stopNear: 2 } };
    w.control.holding = 'letter';
  });
  await page.waitForTimeout(700);
  const at = await page.evaluate(() => { const w = window.moonshine.world; const d = w.byId.get('kid').lastDrawn; return w.game.display.toClient(d.x + d.w / 2 - w.cam.x, d.y + d.h - 10 - w.cam.y); });
  await page.mouse.click(at.x, at.y);
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('SPEED'), null, 15000);
});

test('click-to-use waits when the only free side is briefly blocked, then uses the item', async ({ page }) => {
  await boot(page, `${STREET}&x=13&y=9&items=letter`);
  await waitIdle(page);
  await page.evaluate(() => {
    const w = window.moonshine.world;
    // The Kid stands still at (14,8); walls on three sides leave (14,9) free,
    // and a crate sits there for a second.
    const k = w.byId.get('kid');
    k.x = k.fromX = 14; k.y = k.fromY = 8; k.def = { ...k.def, behavior: 'idle' };
    for (const [x, y] of [[14, 7], [13, 8], [15, 8]]) w.map.setTile('ground', x, y, { tile: 'street:retain_top', solid: true });
    w.mapDef.entities.push({ id: 'crate_tmp', x: 14, y: 9, sprite: { sheet: w.byId.get('cat').def.sprite.sheet, frame: 'cat_sleep' } });
    w.refreshEntities();
    w.control.holding = 'letter';
    setTimeout(() => { w.removeEntity(w.byId.get('crate_tmp')); w.removed.add('crate_tmp'); }, 1000);
  });
  const at = await page.evaluate(() => { const w = window.moonshine.world; const d = w.byId.get('kid').lastDrawn; return w.game.display.toClient(d.x + d.w / 2 - w.cam.x, d.y + d.h - 10 - w.cam.y); });
  await page.mouse.click(at.x, at.y);
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('SPEED'), null, 8000);
});

test('a thing reachable only diagonally: Z reaches it, and a click walks to the diagonal', async ({ page }) => {
  await boot(page, `${STREET}&x=12&y=9&facing=up`);
  await waitIdle(page);
  await page.evaluate(() => {
    const w = window.moonshine.world;
    // A plaque at (14,7) with walls on all four sides.
    for (const [x, y] of [[14, 6], [13, 7], [15, 7], [14, 8]]) w.map.setTile('ground', x, y, { tile: 'street:retain_top', solid: true });
    w.mapDef.entities.push({ id: 'plaque', x: 14, y: 7, look: 'A plaque, wedged in a corner.' });
    w.refreshEntities();
  });
  // Pointer: click it, and Cheryl walks to a diagonal tile and reads it.
  await clickTile(page, 14, 7);
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('plaque'), null, 10000);
  await readAll(page);
  await waitIdle(page);
  // Keyboard: from (13,8), diagonal below-left, facing up with nothing ahead.
  await runScript(page, "g.place('player', 13, 8, 'up');");
  await press(page, 'z');
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('plaque'), null, 5000);
});

test('no lone word on the last page of a line', async ({ page }) => {
  await boot(page, STREET);
  const pages = await page.evaluate(async () => {
    const { paginate } = await import('/src/engine/textbox.js');
    return [paginate(['a b', 'c d', 'e f', 'one.']), paginate(['a b', 'c d', 'e f', 'one more.']), paginate(['one.'])];
  });
  expect(pages[0]).toEqual([['a b', 'c d'], ['e f', 'one.']]);
  expect(pages[1]).toEqual([['a b', 'c d', 'e f'], ['one more.']]);
  expect(pages[2]).toEqual([['one.']]);
});

test('a tap on the top half of a door goes through the door', async ({ page }) => {
  await boot(page, '?map=cistern_court&x=3&y=13&seed=3');
  await waitIdle(page);
  await readAll(page);
  await waitIdle(page);
  expect(await page.evaluate(() => window.moonshine.world.map.solid(3, 10))).toBe(true);
  await clickTile(page, 3, 10); // the wall tile above the flat's door
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat', null, 10000);
});

test('a tap past a trigger marked avoid routes around it (the Act 4 cordon)', async ({ page }) => {
  // Act 4, the Mayor guarding the roped-off Fountain; the four rope triggers
  // step Cheryl back. Marked avoid, a tap beyond the Fountain goes around them.
  await boot(page, '?map=fountain_square&x=11&y=13&flags=act1.moonrise,act2.done,act3.started,act3.done,act4.started,halls.valve,clockmaker.atDoor&seed=3');
  await waitIdle(page);
  await page.evaluate(() => { for (const t of window.moonshine.world.mapDef.triggers.slice(0, 4)) t.avoid = true; });
  await clickTile(page, 11, 4);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return (s.x === 11 && s.y === 4) || !!s.text; }, null, 20000);
  const s = await snap(page);
  expect(s.text || '').not.toContain('Behind the rope');
  expect([s.x, s.y]).toEqual([11, 4]);
});

// Plays the whole opening, start to finish: once by keyboard alone, once by
// pointer alone. Screenshots of key moments go to tests/screenshots/opening-*.
import { test, expect } from '@playwright/test';
import { boot, snap, waitFor, shot } from './helpers.js';
import { settle, newGame, readThrough, pageTexts, kbAdvance, kbWalk, kbFace, kbInteract, kbHold, clickTileAt, ptrAdvance, ptrWalk, ptrInteract, ptrUse } from './playthrough.js';

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
  expect((await snap(page)).items).toContain('moon_chart');
  expect((await snap(page)).items).not.toContain('hat'); // the hat stays in the wardrobe (structure pass)
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
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('Down, then.'), null, 5000);
  // Act 2 picks up on Lamp Street.
  await read({ stop: (s) => s.map === 'lamp_street' });
  expect((await snap(page)).map).toBe('lamp_street');
  expect(errors).toEqual([]);
});

// Steps through the moonrise taking screenshots, ending in control in the flat.
async function moonriseShots(page, advance) {
  const log = [];
  await readThrough(page, advance, { log, stop: (s) => s.picture });
  // The pins, lined up on the Gate, before the glow.
  let sawPins = false;
  await readThrough(page, advance, { log, stop: (s) => { if ((s.text || '').includes('Any second now')) sawPins = true; return sawPins && !s.text; } });
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
  await read({ stop: (s) => s.map === 'lamp_street' });
  expect((await snap(page)).map).toBe('lamp_street');
  expect(errors).toEqual([]);
});

// Without Act 2's maps, the Squeeze ends the slice with the end card. The
// switch is the opening module's `squeezeTo`; clearing it stands in for a
// build without Lamp Street.
test('without Act 2, the Squeeze shows the end card and returns to the title', async ({ page }) => {
  const errors = await boot(page, '?map=cistern_court&x=15&y=24&facing=down&flags=act1.moonrise,n.squeezeSeen');
  await page.evaluate(async () => { (await import('/src/content/opening/court.js')).opening.squeezeTo = null; });
  await waitFor(page, () => window.moonshine.snapshot().idle);
  await page.keyboard.press('ArrowDown');
  await waitFor(page, () => (window.moonshine.snapshot().text || '').includes('Down, then.'), null, 5000);
  await readThrough(page, kbAdvance(page), { stop: (s) => s.flags['act1.done'] });
  await page.waitForTimeout(1800);
  await shot(page, 'opening-15-end-card');
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

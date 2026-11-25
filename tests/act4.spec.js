// Plays Act 4 start to finish, by keyboard alone and by pointer alone, from
// the morning after Act 3 (entered by debug parameters until Act 3 merges),
// through the bell, the Sisters, the rise, the climb, and the reveal, to the
// end card. Screenshots go to tests/screenshots/act4-*.
//
import { test, expect } from '@playwright/test';
import { boot, snap, waitFor, shot } from './helpers.js';
import { settle, readThrough, pageTexts, kbAdvance, kbWalk, kbInteract, ptrAdvance, ptrWalk, ptrInteract, ptrUse } from './playthrough.js';

const START = '?map=flat&x=8&y=4&seed=1'
  + '&flags=act1.moonrise,act2.started,act2.done,piano.slid,counter.left,step.open,act3.surfaced,act3.done,founders.unbolted,halls.valve,moonEyes.glow,got.shipPlan,got.moon_chart,got.crowbar'
  + '&items=moon_chart,guidebook,crowbar,ship_plan,moonglass_disc&run=act4_start';

async function mapIs(page, id) {
  try {
    await waitFor(page, (id) => window.moonshine.snapshot().map === id && window.moonshine.snapshot().idle, id, 15000);
  } catch (err) {
    const s = await snap(page);
    throw new Error(`expected to be idle on ${id}; at ${s.map} (${s.x},${s.y}) busy=${s.busy} text=${s.text}`);
  }
}

// Keyboard: walk onto an exit tile (or the first tile of an exit to `to`) and wait for the new map.
async function kbExit(page, to, at = null) {
  const tile = at || await page.evaluate((to) => {
    const ex = window.moonshine.world.mapDef.exits.find((e) => e.to === to);
    return [ex.x, ex.y];
  }, to);
  for (let i = 0; i < 4 && (await snap(page)).map !== to; i++) {
    await kbWalk(page, tile[0], tile[1]);
    await readThrough(page, kbAdvance(page), { stop: (s) => s.map === to && s.idle });
  }
  await mapIs(page, to);
}

// Pointer: the same by clicking.
async function ptrExit(page, to, at = null) {
  const tile = at || await page.evaluate((to) => {
    const ex = window.moonshine.world.mapDef.exits.find((e) => e.to === to);
    return [ex.x, ex.y];
  }, to);
  for (let i = 0; i < 4 && (await snap(page)).map !== to; i++) {
    await ptrWalk(page, tile[0], tile[1]);
    await readThrough(page, ptrAdvance(page), { stop: (s) => s.map === to && s.idle });
  }
  await mapIs(page, to);
}

test.describe.configure({ mode: 'parallel' });

test('keyboard: Act 4, the morning to the reveal', async ({ page }) => {
  test.setTimeout(600000);
  const errors = await boot(page, START);
  const read = (opts) => readThrough(page, kbAdvance(page), opts);
  let log = await read();
  expect(pageTexts(log)).toContain('my teacup has walked to the edge');
  await kbInteract(page, 'teacup'); await read();
  await settle(page); await shot(page, 'act4-01-flat');

  // Out to Lamp Street, through the court and the Squeeze.
  await kbExit(page, 'cistern_court');
  await kbExit(page, 'lamp_street', [15, 25]);

  // The Skipping Girls, each with her own version.
  for (const id of ['girl_1_a4', 'girl_2_a4', 'girl_3_a4']) { await kbInteract(page, id); log = await read(); }
  expect(pageTexts(log)).toContain('Two of them say thin first');

  // The throat thread: Mott, sober, at his shack on the Goat Path.
  await kbExit(page, 'goat_path', [0, 10]);
  await kbInteract(page, 'mott_a4'); await read();
  await kbInteract(page, 'mott_a4', 'moon_chart'); log = await read();
  expect(pageTexts(log)).toContain('the greedy one');
  expect((await snap(page)).items).toEqual(expect.arrayContaining(['copper_throat', 'square_jug']));
  await settle(page); await shot(page, 'act4-01b-mott');
  await kbExit(page, 'lamp_street');

  // The bell thread.
  await kbExit(page, 'crown');
  await kbInteract(page, 'ambrose_a4'); await read();
  await kbInteract(page, 'tower_door_a4'); await read();
  await kbInteract(page, 'clockmaker_door', 'guidebook'); await read();
  await settle(page); await shot(page, 'act4-02-clockmaker-sundial');
  await kbExit(page, 'belfry');
  await kbInteract(page, 'lever'); await read();
  await kbInteract(page, 'lever'); await read();
  expect((await snap(page)).flags['clock.lifted']).toBe(true);
  await settle(page); await shot(page, 'act4-03-belfry-lever');
  await kbExit(page, 'crown');
  await kbInteract(page, 'ambrose_a4');
  log = await read({ stop: (s) => (s.text || '').includes('NOW') });
  await page.keyboard.press('z');
  await page.waitForTimeout(1500);
  await shot(page, 'act4-04-ringing');
  log = log.concat(await read());
  expect(pageTexts(log)).toContain("It's instructions.");
  expect((await snap(page)).flags['bell.restored']).toBe(true);

  // The order thread: Ottilie reads the Ship Plan.
  await kbExit(page, 'crown');
  await kbExit(page, 'archive');
  await kbInteract(page, 'ottilie_a4', 'ship_plan'); log = await read();
  expect(pageTexts(log)).toContain('Thin, Stout, and Middle');

  // Down the town to the Square, over the rope, and into the Fountain.
  await kbExit(page, 'crown');
  await kbExit(page, 'lamp_street');
  await kbExit(page, 'hundred_steps');
  await kbExit(page, 'fountain_square');
  await kbWalk(page, 11, 10); await read();
  await kbInteract(page, 'ring_hatch'); await read();
  await settle(page); await shot(page, 'act4-05-hatch');
  await kbExit(page, 'pump_hall');
  await read();

  // The Sisters: the throat, a wrong order, then Thin, Stout, Middle.
  await kbInteract(page, 'sister_middle', 'copper_throat'); await read();
  await kbInteract(page, 'valve_stout'); log = await read();
  expect(pageTexts(log)).toContain('like a class');
  await kbInteract(page, 'valve_thin'); await read();
  await kbInteract(page, 'valve_stout'); await read();
  await kbInteract(page, 'valve_middle');
  log = await read();
  expect(pageTexts(log)).toContain('Put her back to bed');
  await settle(page); await shot(page, 'act4-06-sisters-running');
  await kbInteract(page, 'valve_middle');
  log = await read();
  expect(pageTexts(log)).toContain('Up, then.');
  await shot(page, 'act4-07-flood');

  // The climb, the cellar, the reveal.
  await kbExit(page, 'emergency_shaft', [22, 2]);
  for (let i = 0; i < 80; i++) {
    const s = await snap(page);
    if (s.map === 'ice_cellar') break;
    if (s.text) { await page.keyboard.press('z'); await page.waitForTimeout(80); continue; }
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(250); await page.keyboard.up('ArrowUp');
  }
  await read();
  await mapIs(page, 'ice_cellar');
  await settle(page); await shot(page, 'act4-08-cellar');
  await kbWalk(page, 6, 1);
  await waitFor(page, () => window.moonshine.snapshot().map === 'bilge_dry', null, 10000);
  await page.waitForTimeout(9000);
  await shot(page, 'act4-09-reveal-pan');
  log = await read();
  expect(pageTexts(log)).toContain('I did that.');
  expect((await snap(page)).flags['act4.risen']).toBe(true);
  await settle(page); await shot(page, 'act4-10-dry-bilge');

  // Free roam, then the door ends the act.
  await kbInteract(page, 'fishmonger'); await read();
  await kbInteract(page, 'door_view');
  log = await read({ stop: (s) => !!s.flags['act4.done'] });
  expect(pageTexts(log)).toContain('A door at the bottom of the sea');
  await page.waitForTimeout(2500);
  await shot(page, 'act4-11-end-card');
  // Act 4 ends on its card and the title, or (with Act 5 registered) hands over to Act 5.
  await waitFor(page, () => { const st = window.moonshine.snapshot(); return st.scene === 'title' || !!st.flags?.['act5.started']; }, null, 20000);
  expect(errors).toEqual([]);
});

test('pointer: Act 4, the morning to the reveal', async ({ page }) => {
  test.setTimeout(600000);
  const errors = await boot(page, START);
  const read = (opts) => readThrough(page, ptrAdvance(page), opts);
  await read();

  // This time the order thread first: Ottilie, then the girls, then the bell.
  await ptrExit(page, 'cistern_court');
  await ptrExit(page, 'lamp_street', [16, 25]);
  await ptrExit(page, 'goat_path', [0, 10]);
  await ptrUse(page, 'moon_chart', 'mott_a4'); await read();
  expect((await snap(page)).items).toContain('copper_throat');
  await ptrExit(page, 'lamp_street');
  await ptrExit(page, 'crown');
  await ptrExit(page, 'archive');
  await ptrUse(page, 'ship_plan', 'ottilie_a4'); await read();
  await ptrExit(page, 'crown');
  await ptrInteract(page, 'tower_door_a4'); await read();
  await ptrUse(page, 'guidebook', 'clockmaker_door'); await read();
  await ptrExit(page, 'belfry');
  await ptrInteract(page, 'lever'); await read();
  await ptrInteract(page, 'lever'); await read();
  await ptrExit(page, 'crown');
  await ptrInteract(page, 'ambrose_a4');
  const log = await read({ timeout: 120000 });
  expect(pageTexts(log)).toContain("It's instructions.");
  await ptrExit(page, 'crown');
  await ptrExit(page, 'lamp_street');
  await ptrExit(page, 'hundred_steps');
  await ptrExit(page, 'fountain_square');
  // Stepping over the rope on the way says a line, which interrupts the walk; click again.
  for (let i = 0; i < 3 && !(await snap(page)).flags['hatch.open']; i++) { await ptrInteract(page, 'ring_hatch'); await read(); }
  await ptrExit(page, 'pump_hall');
  await read();
  await ptrUse(page, 'copper_throat', 'sister_middle'); await read();
  for (const v of ['valve_thin', 'valve_stout', 'valve_middle']) { await ptrInteract(page, v); await read(); }
  await ptrInteract(page, 'valve_middle'); await read();
  expect((await snap(page)).flags['pumps.burst']).toBe(true);
  // Climbing by tapping the top of the screen, a rung at a time.
  await ptrExit(page, 'emergency_shaft', [22, 2]);
  for (let i = 0; i < 40; i++) {
    const s = await snap(page);
    if (s.map === 'ice_cellar') break;
    if (s.text || s.busy) { await ptrAdvance(page)(); await page.waitForTimeout(150); continue; }
    const p = await page.evaluate(() => window.moonshine.display.toClient(128, 10));
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(700);
  }
  await read();
  await mapIs(page, 'ice_cellar');
  await ptrWalk(page, 6, 1);
  await waitFor(page, () => window.moonshine.snapshot().map === 'bilge_dry', null, 10000);
  await read({ timeout: 120000 });
  expect((await snap(page)).flags['act4.risen']).toBe(true);
  await ptrInteract(page, 'boatman'); await read();
  await ptrInteract(page, 'door_view');
  await read({ stop: (s) => !!s.flags['act4.done'] });
  // Act 4 ends on its card and the title, or (with Act 5 registered) hands over to Act 5.
  await waitFor(page, () => { const st = window.moonshine.snapshot(); return st.scene === 'title' || !!st.flags?.['act5.started']; }, null, 20000);
  expect(errors).toEqual([]);
});

// Every Act 4 hotspot and character answers a look and an item.
const SCENES = [
  ['belfry', '?map=belfry&x=2&y=7&flags=act4.started'],
  ['pump hall', '?map=pump_hall&x=2&y=3&flags=act4.started,bell.restored,hatch.open'],
  ['tide wheel', '?map=tide_wheel&x=1&y=4&flags=act4.started,bell.restored'],
  ['sea cave', '?map=sea_cave&x=4&y=6&flags=act4.started'],
  ['ice cellar', '?map=ice_cellar&x=2&y=5&flags=act4.started,cellar.shut'],
  ['dry Bilge', '?map=bilge_dry&x=4&y=4&flags=act4.started,act4.risen'],
  ['the Crown', '?map=crown&x=11&y=12&flags=act2.started,act4.started,clockmaker.out'],
  ['Fountain Square', '?map=fountain_square&x=11&y=13&flags=act2.started,piano.slid,counter.left,step.open,act4.started'],
];
for (const [label, query] of SCENES) {
  test(`every Act 4 object answers: ${label}`, async ({ page }) => {
    test.setTimeout(180000);
    const errors = await boot(page, `${query}&items=soap,moon_chart`);
    await page.waitForTimeout(800);
    await readThrough(page, kbAdvance(page));
    const ids = await page.evaluate(() => window.moonshine.world.entities
      .filter((e) => !e.isPlayer && (e.def.interact || e.def.look || e.def.looks || e.def.talk))
      .map((e) => e.id));
    expect(ids.length).toBeGreaterThan(1);
    for (const id of ids) {
      if (['door_view', 'lever', 'ring_hatch', 'ambrose_a4', 'tower_door_a4'].includes(id) || id.startsWith('valve_')) continue; // these start scenes
      for (const item of [null, 'soap']) {
        const there = await page.evaluate(([id, item]) => {
          const w = window.moonshine.world;
          const e = w.entity(id);
          if (e) w.run(() => w.interactWith(e, item));
          return !!e;
        }, [id, item]);
        if (!there) continue;
        await page.waitForTimeout(50);
        const log = await readThrough(page, kbAdvance(page), { timeout: 20000 });
        expect(log.length, `${id} with ${item || 'a look'}`).toBeGreaterThan(0);
        await page.evaluate(() => { const st = window.moonshine.world.state; if (!st.inventory.includes('soap')) st.inventory.push('soap'); });
      }
    }
    expect(errors).toEqual([]);
  });
}

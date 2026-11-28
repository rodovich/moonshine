// The isometric view (?view=iso): the same game drawn at 640×480 in 2:1
// dimetric. Boot, walk by keyboard and by click, talk, use an item, change
// maps, save in one view and continue in the other, and every map renders.
import { test, expect } from '@playwright/test';
import { boot, snap, waitFor, waitIdle, waitText, readAll, press, shot } from './helpers.js';

const COURT = '?view=iso&map=cistern_court&seed=3';

async function clickTile(page, x, y) {
  const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [x, y]);
  await page.mouse.click(p.x, p.y);
}

test('boots into the isometric view at 640×480 and remembers the choice', async ({ page }) => {
  const errors = await boot(page, '?view=iso');
  expect(await page.evaluate(() => [window.moonshine.view.kind, window.moonshine.display.width, window.moonshine.display.height])).toEqual(['iso', 640, 480]);
  await shot(page, 'iso-title');
  // The choice is remembered; ?view=snes switches back.
  await page.goto('/');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  expect(await page.evaluate(() => window.moonshine.view.kind)).toBe('iso');
  await page.goto('/?view=snes');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  expect(await page.evaluate(() => [window.moonshine.view.kind, window.moonshine.display.width])).toEqual(['snes', 256]);
  expect(errors).toEqual([]);
});

test('new game from the title plays the opening in the isometric view', async ({ page }) => {
  const errors = await boot(page, '?view=iso&seed=3');
  await page.waitForTimeout(700);
  await press(page, 'Enter');
  await waitText(page, 10000);
  const s = await snap(page);
  expect(s.view).toBe('iso');
  expect(s.map).toBe('cistern_court');
  await shot(page, 'iso-opening');
  expect(errors).toEqual([]);
});

test('keyboard: arrows walk the grid along the screen diagonals', async ({ page }) => {
  const errors = await boot(page, `${COURT}&x=8&y=18`);
  await waitIdle(page);
  // Up walks the grid's up (up-right on screen), Left its left (up-left).
  await press(page, 'ArrowUp');
  await waitIdle(page);
  expect((await snap(page)).y).toBe(17);
  await press(page, 'ArrowLeft');
  await waitIdle(page);
  expect((await snap(page)).x).toBe(7);
  await press(page, 'ArrowDown');
  await waitIdle(page);
  await press(page, 'ArrowRight');
  await waitIdle(page);
  const s = await snap(page);
  expect([s.x, s.y]).toEqual([8, 18]);
  expect(errors).toEqual([]);
});

test('click to walk, click a character to talk, Z to read on', async ({ page }) => {
  const errors = await boot(page, `${COURT}&x=8&y=18`);
  await waitIdle(page);
  await clickTile(page, 11, 20);
  await waitFor(page, () => { const s = window.moonshine.snapshot(); return s.x === 11 && s.y === 20 && s.idle; }, null, 10000);
  await clickTile(page, 2, 16); // the Old Man
  await waitText(page, 10000);
  const s = await snap(page);
  expect(s.speaker).toBe('Old Man');
  await shot(page, 'iso-talk');
  await readAll(page);
  expect(errors).toEqual([]);
});

test('use an item from the bag by keyboard', async ({ page }) => {
  const errors = await boot(page, `${COURT}&x=3&y=17&facing=left&items=soap`);
  await waitIdle(page);
  await press(page, 'x');
  await waitFor(page, () => window.moonshine.snapshot().inventoryOpen);
  await shot(page, 'iso-bag');
  await press(page, 'z'); // Use the soap
  await waitFor(page, () => window.moonshine.snapshot().holding === 'soap');
  await press(page, 'z'); // on the Old Man, to her left
  await waitText(page, 8000);
  expect((await snap(page)).holding).toBe(null);
  await readAll(page);
  expect(errors).toEqual([]);
});

test('a door in a wall takes a click; save in one view, continue in the other', async ({ page }) => {
  const errors = await boot(page, '?view=iso&map=cistern_court&x=5&y=14&seed=3&save=1');
  await waitIdle(page);
  await clickTile(page, 3, 11); // the flat's door, set into the wall
  await waitFor(page, () => window.moonshine.snapshot().map === 'flat', null, 10000);
  await waitIdle(page);
  await shot(page, 'iso-flat');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moonshine.save.v1')));
  expect(saved.map).toBe('flat');
  // Continue in the SNES view.
  await page.goto('/?view=snes');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  await page.waitForTimeout(700);
  await press(page, 'Enter'); // Continue
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  let s = await snap(page);
  expect([s.view, s.map]).toEqual(['snes', 'flat']);
  // And back.
  await page.goto('/?view=iso');
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  await page.waitForTimeout(700);
  await press(page, 'Enter');
  await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
  s = await snap(page);
  expect([s.view, s.map]).toEqual(['iso', 'flat']);
  expect(errors).toEqual([]);
});

test('a picture shows full screen at 640×480', async ({ page }) => {
  const errors = await boot(page, `${COURT}&x=5&y=5`);
  await waitIdle(page);
  await page.evaluate(() => window.moonshine.world.run((g) => g.showPicture((ctx) => { ctx.fillStyle = '#3060a0'; ctx.fillRect(0, 0, 256, 224); }, { fade: 0 })));
  await waitFor(page, () => window.moonshine.snapshot().picture);
  await page.waitForTimeout(100);
  const px = await page.evaluate(() => Array.from(window.moonshine.display.bctx.getImageData(320, 240, 1, 1).data.slice(0, 3)));
  expect(px).toEqual([48, 96, 160]);
  expect(errors).toEqual([]);
});

test("a later act's change to a hand-built map shows, and an act can extend the scene", async ({ page }) => {
  const errors = await boot(page, '?view=iso&map=cistern_court&x=8&y=18&seed=3');
  await waitIdle(page);
  await page.waitForFunction(() => window.moonshine.view.renderer.sceneReady(window.moonshine.world), null, { timeout: 10000 });
  const r = await page.evaluate(async () => {
    const g = window.moonshine;
    const w = g.world;
    const def = w.mapDef;
    // A later act patches a tile under a flag the scene doesn't follow...
    const base = def.patches;
    const someTile = def.legend[Object.keys(def.legend)[0]];
    def.patches = (api) => [...((base && base(api)) || []), ...(api.flag('test.later') ? [['detail', 10, 20, someTile]] : [])];
    // ...and extends the scene with a piece of its own.
    def.iso.extend = [(api, list, kit) => { if (api.flag('test.later')) kit.add(list, 'cistern', 'stool', 12, 20, 0); return list; }];
    w.api.setFlag('test.later');
    g.render();
    const ren = g.view.renderer;
    const list = ren.sceneFor(w);
    const out = {
      net: [...ren.netCells],
      drawnAtCell: list.some((d) => d.x0 === 10 && d.y0 === 20),
      extended: list.some((d) => d.f === 'stool' && d.x0 === 12 && d.y0 === 20),
    };
    def.patches = base;
    delete def.iso.extend;
    return out;
  });
  expect(r.net).toContain('10,20');
  expect(r.drawnAtCell).toBe(false); // the scene's cobble there gives way to the converter's cell
  expect(r.extended).toBe(true);
  expect(errors).toEqual([]);
});

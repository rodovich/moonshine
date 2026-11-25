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
    { version: 1, map: 'removed_map', x: 3, y: 3, facing: 'down', flags: {}, inventory: [] },
    { version: 1, map: 'test_street', x: 0, y: 0, facing: 'sideways', flags: { street_intro: true } },
    { version: 1, map: 'test_street', x: 99, y: 99, facing: 'up', flags: { street_intro: true }, inventory: ['no_such_item', 'letter'] },
  ];
  for (const save of bad) {
    await page.evaluate((s) => localStorage.setItem('moonshine.save.v1', JSON.stringify(s)), save);
    await page.goto('/');
    await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
    await page.waitForTimeout(700);
    await press(page, 'Enter'); // Continue
    await waitFor(page, () => window.moonshine.snapshot().scene === 'world');
    await page.waitForTimeout(800);
    const s = await snap(page);
    expect(s.map).toBe('test_street');
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

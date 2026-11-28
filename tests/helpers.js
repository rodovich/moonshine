// Shared helpers for Playwright tests. The game exposes `window.moonshine`
// (the Game object) with snapshot(), tileToClient(), and display.toClient().
import { expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

export const SHOTS = 'tests/screenshots';
mkdirSync(SHOTS, { recursive: true });

export async function boot(page, query = '') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`/${query}`);
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  return errors;
}

export const snap = (page) => page.evaluate(() => window.moonshine.snapshot());

export async function waitFor(page, pred, arg, timeout = 8000) {
  await page.waitForFunction(pred, arg, { timeout });
}

// Waits until the player is idle, after letting the game process any input
// sent just before (a few ticks must pass first).
export async function waitIdle(page, timeout = 8000) {
  const t0 = await page.evaluate(() => window.moonshine.ticks);
  await waitFor(page, (t) => window.moonshine.ticks >= t + 3 && window.moonshine.snapshot().idle, t0, timeout);
}

export async function waitText(page, timeout = 8000) {
  await waitFor(page, () => !!window.moonshine.snapshot().text, null, timeout);
}

// Advance dialog with the keyboard until no text box is open.
export async function readAll(page, key = 'z', max = 20) {
  for (let i = 0; i < max; i++) {
    const s = await snap(page);
    if (!s.text && !s.busy) return;
    if (s.choice) throw new Error(`readAll hit a choice: ${s.choice.join(' / ')}`);
    await page.keyboard.press(key);
    await page.waitForTimeout(60);
  }
}

// Advance dialog until a text box containing `substr` is showing.
export async function readUntil(page, substr, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const s = await snap(page);
    if (s.text && s.text.includes(substr)) return;
    if (s.text) await page.keyboard.press('z');
    await page.waitForTimeout(80);
  }
  throw new Error(`never saw text containing "${substr}"`);
}

export async function tapAll(page, max = 20) {
  for (let i = 0; i < max; i++) {
    const s = await snap(page);
    if (!s.text && !s.busy) return;
    await page.mouse.click(10, 10);
    await page.waitForTimeout(60);
  }
}

export async function press(page, key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(40);
  }
}

// Press an arrow meaning "step one tile". A press toward something
// interactable on an open tile, while Cheryl faces another way, only turns
// her (turn-in-place); then a second press steps. Use plain presses where a
// test means only to face something.
const ARROWS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
export async function stepKey(page, dir) {
  const key = ARROWS[dir] || dir;
  const t0 = await page.evaluate(() => window.moonshine.ticks);
  await page.keyboard.press(key);
  await page.waitForFunction((t0) => window.moonshine.ticks >= t0 + 3, t0, { timeout: 3000 }).catch(() => {});
  const turned = await page.evaluate((t0) => (window.moonshine.world?.control.turnedAt ?? -1) >= t0, t0);
  if (turned) await page.keyboard.press(key);
}

// Hold a key for roughly `ms`.
export async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function tileOnScreen(page, tx, ty) {
  const p = await page.evaluate(([x, y]) => window.moonshine.tileToClient(x, y), [tx, ty]);
  const g = await page.evaluate(([x, y]) => ({ x: x * 16 + 8 - window.moonshine.world.cam.x, y: y * 16 + 8 - window.moonshine.world.cam.y }), [tx, ty]);
  if (g.x < 0 || g.y < 0 || g.x >= 256 || g.y >= 224) throw new Error(`tile ${tx},${ty} is off screen`);
  return p;
}

export async function clickTile(page, tx, ty) {
  const p = await tileOnScreen(page, tx, ty);
  await page.mouse.click(p.x, p.y);
}

export async function tapTile(page, tx, ty) {
  const p = await tileOnScreen(page, tx, ty);
  await page.touchscreen.tap(p.x, p.y);
}

// Click a point in game pixels (0..256, 0..224).
export async function clickGame(page, gx, gy) {
  const p = await page.evaluate(([x, y]) => window.moonshine.display.toClient(x, y), [gx, gy]);
  await page.mouse.click(p.x, p.y);
}

export async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

export async function expectAt(page, x, y) {
  const s = await snap(page);
  expect([s.x, s.y]).toEqual([x, y]);
}

// Click a UI element in whichever view is on (see Game.uiToClient).
export async function clickUi(page, name, arg = 0) {
  const p = await page.evaluate(([n, a]) => window.moonshine.uiToClient(n, a), [name, arg]);
  await page.mouse.click(p.x, p.y);
}

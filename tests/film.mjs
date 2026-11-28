// Dev tool: play a scene and save a screenshot every `ms`, advancing text as a
// player would (after it has shown for a moment), at the isometric view's
// 640×480 when the query asks for ?view=iso. Prints each line of text once.
// Usage: node tests/film.mjs "<query>" <out-prefix> [count=40] [ms=1500]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [query = '', prefix = '/tmp/film', count = '40', ms = '1500'] = process.argv.slice(2);
const port = 8180 + Math.floor(Math.random() * 50);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const iso = /view=iso/.test(query);
  const page = await browser.newPage({ viewport: iso ? { width: 640, height: 480 } : { width: 512, height: 448 } });
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:${port}/${query}`);
  await page.waitForFunction(() => window.moonshine && window.moonshine.scene);
  let last = null;
  for (let i = 0; i < Number(count); i++) {
    await page.waitForTimeout(Number(ms));
    const s = await page.evaluate(() => window.moonshine.snapshot());
    const name = `${prefix}-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: name });
    if (s.text && s.text !== last) console.log(`${name}  ${s.speaker ? s.speaker + ': ' : ''}${s.text.replace(/\n/g, ' ')}`);
    else console.log(`${name}  [${s.map} ${s.x},${s.y}${s.picture ? ' picture' : ''}${s.busy ? ' busy' : ''}]`);
    if (s.text) { last = s.text; await page.keyboard.press('z'); }
  }
} finally {
  await browser.close();
  server.kill();
}

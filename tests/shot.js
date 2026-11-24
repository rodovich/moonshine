// Screenshot the game at a URL query, after optional key presses.
// Usage: node tests/shot.js "<query>" out.png [waitMs] [keys...]
//   node tests/shot.js "?map=test_yard&x=10&y=8" yard.png 800 ArrowRight ArrowRight
// Starts its own server on port 8124. Prints console errors.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [query = '', out = 'shot.png', wait = '800', ...keys] = process.argv.slice(2);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, '8124'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 512, height: 448 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:8124/${query}`);
  await page.waitForTimeout(Number(wait));
  for (const k of keys) {
    if (k.startsWith('wait:')) await page.waitForTimeout(Number(k.slice(5)));
    else if (k.startsWith('click:')) {
      const [x, y] = k.slice(6).split(',').map(Number);
      await page.mouse.click(x * 2, y * 2);
    } else await page.keyboard.press(k);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
} finally {
  await browser.close();
  server.kill();
}

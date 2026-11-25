// Full-page screenshot of a dev page. Usage: node tests/devshot.mjs "dev/art.html?only=scene:court" out.png [width] [height]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [query, out, w = '1300', h = '1000'] = process.argv.slice(2);
const server = spawn(process.execPath, [new URL('./serve.js', import.meta.url).pathname, '8125'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
  await page.goto(`http://localhost:8125/${query}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out, fullPage: true });
} finally {
  await browser.close();
  server.kill();
}

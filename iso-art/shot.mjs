// Screenshot the isometric art dev page with Playwright.
//   node iso-art/shot.mjs out.png "only=court&cam=roof&tint=dusk" [selector] [width]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [out, query = '', selector = 'canvas', width = '1400'] = process.argv.slice(2);
const port = 8900 + Math.floor(Math.random() * 90);
const server = spawn('node', [fileURLToPath(new URL('../tests/serve.js', import.meta.url)), String(port)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: +width, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://localhost:${port}/dev/iso-art.html?${query}`);
  await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
  await page.waitForTimeout(200);
  const el = await page.$(selector);
  await (el || page).screenshot({ path: out });
  const missing = await page.$$eval('p', (ps) => ps.map((p) => p.textContent).filter((t) => t.startsWith('Missing')));
  if (missing.length) console.log(missing.join('\n'));
  if (errors.length) console.log('Errors:\n' + errors.join('\n'));
} finally {
  await browser.close();
  server.kill();
}

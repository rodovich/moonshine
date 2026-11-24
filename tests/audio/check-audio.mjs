// Browser check for the audio system: loads game/dev/audio.html in Chromium, plays music, cues, and
// every sound effect through the live API, then renders everything offline and checks levels.
//   node tests/audio/check-audio.mjs [--screenshot path.png] [--playwright path/to/playwright/index.mjs]
// Needs the `playwright` package; pass --playwright if it isn't installed in this repo.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const { chromium } = await import(arg('--playwright') || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../game');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/dev/audio.html`;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`console ${m.type()}: ${m.text()}`); });

await page.goto(url);
await page.click('[data-music="title"]');
await page.waitForTimeout(1500);
await page.click('[data-music="neighborhood"]'); // crossfade
await page.waitForTimeout(1500);
await page.click('[data-music="wrongness"]'); // cue interrupts
await page.waitForTimeout(500);
const during = await page.evaluate(async () => (await import('../src/audio/index.js')).currentMusic());
for (const b of await page.$$('#sfx button')) { await b.click(); await page.waitForTimeout(60); }
await page.click('#talk');
await page.waitForTimeout(800);
await page.click('#stop');
await page.waitForTimeout(300);

const rows = await page.evaluate(() => window.audioDev.checkAll());
let failed = false;
console.log('id                         length  peak dB  rms dB  loudest  limited');
for (const r of rows) {
  const flag = r.raw.peakDb > -1 || r.raw.clipped > 0 ? '  <-- too hot' : '';
  if (flag) failed = true;
  console.log(`${(r.kind + ':' + r.id).padEnd(26)} ${r.length.toFixed(1).padStart(6)} ${r.raw.peakDb.toFixed(1).padStart(8)} ${r.raw.rmsDb.toFixed(1).padStart(7)} ${r.raw.loudestWindowDb.toFixed(1).padStart(8)} ${r.limited.peakDb.toFixed(1).padStart(8)}${flag}`);
  if (r.raw.peakDb < -40) { console.log(`  ${r.id} is nearly silent`); failed = true; }
}
if (during !== 'neighborhood') { problems.push(`expected neighborhood to stay current under the cue, got ${during}`); }

const shot = arg('--screenshot');
if (shot) {
  await page.click('#check');
  await page.waitForSelector('#report table', { timeout: 120000 });
  await page.screenshot({ path: shot, fullPage: true });
}

await browser.close();
server.close();
for (const p of problems) console.log(p);
if (problems.length || failed) { console.log('FAIL'); process.exit(1); }
console.log('OK');

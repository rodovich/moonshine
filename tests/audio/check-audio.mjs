// Browser check for the audio system: loads game/dev/audio.html in Chromium, plays music, a cue,
// the wind-down, every sound effect and loop through the live API, then renders everything
// offline and checks levels, the balance of voices, the spectrum, and the music lint.
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
await page.waitForTimeout(1200);
await page.click('[data-music="cistern_court"]'); // crossfade
await page.waitForTimeout(1200);
await page.click('[data-music="wrongness"]'); // cue interrupts
await page.waitForTimeout(500);
const during = await page.evaluate(async () => (await import('../src/audio/index.js')).currentMusic());
for (const b of await page.$$('#sfx button')) { await b.click(); await page.waitForTimeout(40); }
for (const b of await page.$$('#loops button')) { await b.click(); await page.waitForTimeout(300); await b.click(); }
await page.click('#talk');
await page.waitForTimeout(600);
await page.click('[data-music="moonrise"]');
await page.waitForTimeout(1200);
await page.click('#wind'); // the music box runs down
await page.waitForTimeout(300);
const afterWind = await page.evaluate(async () => (await import('../src/audio/index.js')).currentMusic());
await page.click('#stop');
await page.waitForTimeout(300);
// Act 4's controls: bend the pumps cue sharp, fade a loop's level, dip everything for an ear-pop.
await page.evaluate(async () => {
  const a = await import('../src/audio/index.js');
  a.playMusic('pumps', { fadeMs: 0 });
  a.startLoop('roar');
  await new Promise((r) => setTimeout(r, 400));
  a.bendMusic(80, 600);
  a.setLoopVolume('roar', 0.2, 300);
  a.sfx('ear_pop');
  a.setMusicFilter('muffled');
  await new Promise((r) => setTimeout(r, 900));
  a.setMusicFilter(null);
  a.stopLoop('roar', 0);
  a.stopMusic(0);
});

let failed = false;
const fail = (msg) => { problems.push(msg); failed = true; };
if (during !== 'cistern_court') fail(`expected cistern_court to stay current under the cue, got ${during}`);
if (afterWind !== null) fail(`expected no current music after windDownMusic, got ${afterWind}`);

// Levels.
const rows = await page.evaluate(() => window.audioDev.checkAll());
console.log('LEVELS (full volume, before the clipper)');
console.log('id                              length  peak dB  rms dB  loudest  clipped');
for (const r of rows) {
  const flag = r.raw.peakDb > -1 || r.raw.clipped > 0 ? 'too hot' : r.raw.peakDb < -40 ? 'nearly silent' : '';
  if (flag) fail(`${r.kind} ${r.id}: ${flag}`);
  console.log(`${(r.kind + ':' + r.id).padEnd(31)} ${r.length.toFixed(1).padStart(6)} ${r.raw.peakDb.toFixed(1).padStart(8)} ${r.raw.rmsDb.toFixed(1).padStart(7)} ${r.raw.loudestWindowDb.toFixed(1).padStart(8)} ${r.limited.peakDb.toFixed(1).padStart(8)}${flag ? '  <-- ' + flag : ''}`);
}
const wind = rows.find((r) => r.id === 'moonrise (wind-down)');
if (!(wind.raw.soundUntil < 21)) fail(`moonrise didn't stop after winding down (sound until ${wind.raw.soundUntil.toFixed(1)} s)`);

// Balance: the melody leads every other voice by 3 dB (A-weighted, each voice alone).
const balance = await page.evaluate(() => window.audioDev.balanceAll());
console.log('\nBALANCE (A-weighted dB of each voice alone; melody first)');
for (const [id, sections] of Object.entries(balance)) {
  for (const s of sections) {
    const lv = Object.entries(s.levels).sort((a, b) => (a[0] === s.melody ? -1 : b[0] === s.melody ? 1 : b[1] - a[1]));
    console.log(`${(id + '/' + s.pattern).padEnd(22)} ${lv.map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ')}${s.ok ? '' : `  <-- ${s.rivals.join(', ')} too close to the melody`}`);
    if (!s.ok) fail(`${id}/${s.pattern}: ${s.rivals.join(', ')} within 3 dB of the melody`);
  }
}

// Spectrum: watch for mud (low-mid piling up), wasted sub-bass, and dullness.
const spectra = await page.evaluate(() => window.audioDev.spectrumAll());
console.log('\nSPECTRUM (dB of each band relative to the whole track)');
console.log('track            sub   bass  lowmid    mid presence    air   A-weighted');
for (const [id, s] of Object.entries(spectra)) {
  const b = s.bands;
  const notes = [];
  const scene = await page.evaluate(async (id) => !!(await import('../src/audio/music/index.js')).SONGS[id].scene, id);
  if (!scene) {
    if (b.sub > -12) notes.push('too much sub-bass');
    if (b.lowmid > b.mid + 3) notes.push('muddy: low-mid well above mid');
    if (b.presence < -35 && id !== 'wrongness') notes.push('dull: almost nothing above 2 kHz');
  }
  for (const n of notes) fail(`${id}: ${n}`);
  console.log(`${id.padEnd(14)} ${[b.sub, b.bass, b.lowmid, b.mid, b.presence, b.air].map((x) => x.toFixed(1).padStart(6)).join(' ')}   ${s.aWeightedDb.toFixed(1).padStart(6)}${notes.length ? '  <-- ' + notes.join('; ') : ''}`);
}

// Lint.
const lint = await page.evaluate(() => window.audioDev.lintAll());
for (const [id, { issues }] of Object.entries(lint)) {
  for (const i of issues) if (i.level === 'warn') fail(`lint ${id} ${i.where}: ${i.msg}`);
}

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

// Build the isometric art: render every sheet under iso-art/sheets/ into PNG
// atlases and write game/assets/iso/manifest.js.
//
//   npm run art:iso                 # every sheet
//   npm run art:iso -- cheryl court # only these sheets (the manifest keeps the others)
//
// A sheet module default-exports { name, frames(): [job…], anims?, fonts?, meta? }.
// Each job is { name, render(): [{ name, img, shadow?, fp?, h? }…] } and runs in a
// worker thread, so jobs must build their scenes inside render().

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodePNG } from './lib/png.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'game/assets/iso');
const SHEETS = path.join(HERE, 'sheets');

async function loadSheet(file) {
  return (await import(pathToFileURL(path.join(SHEETS, file)).href)).default;
}

if (!isMainThread) {
  parentPort.on('message', async ({ file, index }) => {
    try {
      const sheet = await loadSheet(file);
      const job = sheet.frames()[index];
      const outs = await job.render();
      parentPort.postMessage({ ok: true, outs: outs.map((o) => ({ ...o, img: pack(o.img), shadow: o.shadow && pack(o.shadow) })) });
    } catch (e) {
      parentPort.postMessage({ ok: false, error: `${file}#${index}: ${e.stack}` });
    }
  });
} else {
  main();
}

function pack(img) { return { w: img.w, h: img.h, ax: img.ax, ay: img.ay, data: Buffer.from(img.data) }; }

// Shelf-pack images into an atlas of the given width.
function atlas(items, width) {
  const sorted = [...items].sort((a, b) => b.img.h - a.img.h || b.img.w - a.img.w);
  let x = 0, y = 0, rowH = 0;
  for (const it of sorted) {
    if (x + it.img.w > width) { x = 0; y += rowH + 1; rowH = 0; }
    it.x = x; it.y = y;
    x += it.img.w + 1; rowH = Math.max(rowH, it.img.h);
  }
  const h = y + rowH;
  const data = new Uint8Array(width * h * 4);
  for (const it of items) {
    for (let r = 0; r < it.img.h; r++) data.set(it.img.data.subarray(r * it.img.w * 4, (r + 1) * it.img.w * 4), ((it.y + r) * width + it.x) * 4);
  }
  return { w: width, h, data };
}

async function main() {
  const only = process.argv.slice(2);
  const files = fs.readdirSync(SHEETS).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  const sheets = [];
  for (const f of files) {
    const s = await loadSheet(f);
    if (only.length && !only.includes(s.name)) continue;
    sheets.push({ file: f, sheet: s, jobs: s.frames() });
  }
  fs.mkdirSync(OUT, { recursive: true });
  const n = Math.max(1, Math.min(os.cpus().length - 1, 12));
  const queue = [];
  for (const s of sheets) s.jobs.forEach((j, i) => queue.push({ s, i, name: j.name }));
  console.log(`Rendering ${queue.length} jobs from ${sheets.length} sheets on ${n} threads…`);
  const t0 = Date.now();
  const results = new Map(sheets.map((s) => [s.sheet.name, []]));
  let done = 0, failed = false;
  await new Promise((resolve) => {
    let active = 0;
    const workers = Array.from({ length: Math.min(n, queue.length) }, () => new Worker(fileURLToPath(import.meta.url)));
    if (!workers.length) resolve();
    const next = (w) => {
      const job = queue.shift();
      if (!job) { w.terminate(); if (--active === 0) resolve(); return; }
      w.once('message', (msg) => {
        if (!msg.ok) { console.error(msg.error); failed = true; }
        else results.get(job.s.sheet.name).push({ order: job.i, outs: msg.outs });
        done++;
        if (done % 10 === 0 || done === queue.length + done) process.stdout.write(`\r  ${done} done`);
        next(w);
      });
      w.postMessage({ file: job.s.file, index: job.i });
    };
    for (const w of workers) { active++; next(w); }
  });
  console.log(`\nRendered in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (failed) process.exit(1);

  // Load the existing manifest so a partial build keeps the other sheets.
  const manifestPath = path.join(OUT, 'manifest.js');
  let manifest = { tile: { w: 64, h: 32, zPx: 40 }, sheets: {}, fonts: {} };
  if (fs.existsSync(manifestPath)) {
    const m = (await import(pathToFileURL(manifestPath).href + '?t=' + Date.now())).default;
    manifest = { ...manifest, ...m };
  }
  for (const { sheet } of sheets) {
    const outs = results.get(sheet.name).sort((a, b) => a.order - b.order).flatMap((r) => r.outs);
    const items = [];
    for (const o of outs) {
      items.push({ name: o.name, img: o.img, o });
      if (o.shadow) items.push({ name: `${o.name}.shadow`, img: o.shadow, o: {} });
    }
    const maxW = Math.max(...items.map((i) => i.img.w));
    const area = items.reduce((s, i) => s + (i.img.w + 1) * (i.img.h + 1), 0);
    const width = Math.max(maxW, Math.min(2048, 2 ** Math.ceil(Math.log2(Math.sqrt(area) * 1.15))));
    const at = atlas(items, width);
    fs.writeFileSync(path.join(OUT, `${sheet.name}.png`), encodePNG(at.w, at.h, at.data));
    const frames = {};
    for (const it of items) {
      const f = [it.x, it.y, it.img.w, it.img.h, it.img.ax, it.img.ay];
      if (it.o.fp || it.o.h != null) f.push(...(it.o.fp || [1, 1]), it.o.h ?? 0);
      frames[it.name] = f;
    }
    manifest.sheets[sheet.name] = { image: `${sheet.name}.png`, frames, ...(sheet.anims ? { anims: sheet.anims } : {}), ...(sheet.meta || {}) };
    if (sheet.fonts) Object.assign(manifest.fonts, sheet.fonts(frames));
    console.log(`  ${sheet.name}: ${items.length} frames, ${at.w}×${at.h}`);
  }
  const body = `// Generated by iso-art/build.mjs (npm run art:iso). Do not edit by hand.\n` +
    `// Frame: [x, y, w, h, anchorX, anchorY, footprintW?, footprintD?, heightPx?]. See docs/iso-art-direction.md.\n` +
    `export default ${JSON.stringify(manifest, null, 0).replace(/("[^"]+":\[)/g, '\n$1')};\n`;
  fs.writeFileSync(manifestPath, body);
  console.log(`Wrote ${path.relative(ROOT, manifestPath)}`);
}

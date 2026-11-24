// Checks every art module under game/src/art against the format rules in docs/decisions.md
// and docs/art-direction.md. Run: node tests/check-art.mjs  (exits 1 on any problem)
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const artDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game', 'src', 'art');
const { COLORS } = await import(pathToFileURL(path.join(artDir, 'palette.js')));
const RESERVED = /^wrong/;      // the Wrongness colors
const problems = [];
const say = (m) => problems.push(m);

for (const [name, hex] of Object.entries(COLORS)) {
  if (!/^#[0-9a-f]{6}$/.test(hex)) say(`palette: ${name} '${hex}' is not #rrggbb (lowercase)`);
  else for (const i of [1, 3, 5]) if (parseInt(hex.slice(i, i + 2), 16) % 8) say(`palette: ${name} ${hex} is not 15-bit (channels must be multiples of 8)`);
}

let sheets = 0, frames = 0;
for (const file of readdirSync(artDir).filter(f => f.endsWith('.js') && f !== 'palette.js').sort()) {
  const mod = await import(pathToFileURL(path.join(artDir, file)));
  for (const [sheetName, sheet] of Object.entries(mod)) {
    if (!sheet || typeof sheet !== 'object' || !sheet.frames) continue;
    sheets++;
    const where = `${file}: ${sheetName}`;
    const [w, h] = sheet.size || [];
    if (!(w > 0 && h > 0)) say(`${where}: missing size`);
    const palettes = { base: sheet.palette, ...Object.fromEntries(Object.entries(sheet.palettes || {}).map(([k, v]) => [k, { ...sheet.palette, ...v }])) };
    for (const [pn, pal] of Object.entries(palettes)) {
      const letters = Object.keys(pal);
      if (letters.length > 15) say(`${where} (${pn}): ${letters.length} colors, max 15`);
      for (const [ch, cn] of Object.entries(pal)) {
        if (ch.length !== 1 || ch === '.') say(`${where} (${pn}): bad palette letter '${ch}'`);
        if (!(cn in COLORS)) say(`${where} (${pn}): unknown color '${cn}'`);
      }
    }
    const usesWrong = Object.values(sheet.palette).some(c => RESERVED.test(c));
    for (const [fn, rows] of Object.entries(sheet.frames)) {
      frames++;
      if (rows.length !== h) say(`${where}.${fn}: ${rows.length} rows, expected ${h}`);
      rows.forEach((r, y) => {
        if (r.length !== w) say(`${where}.${fn} row ${y}: ${r.length} wide, expected ${w}`);
        for (const ch of r) if (ch !== '.' && !(ch in sheet.palette)) say(`${where}.${fn} row ${y}: '${ch}' is not in the palette`);
      });
      if (usesWrong && !/wrong/.test(fn)) {
        const wrongLetters = Object.entries(sheet.palette).filter(([, c]) => RESERVED.test(c)).map(([l]) => l);
        if (rows.some(r => wrongLetters.some(l => r.includes(l)))) say(`${where}.${fn}: uses a reserved wrong_* color but its name doesn't contain 'wrong'`);
      }
    }
    for (const [anim, d] of Object.entries(sheet.durations || {})) {
      const n = Object.keys(sheet.frames).filter(f => f.startsWith(anim + '_') && /^\d+$/.test(f.slice(anim.length + 1))).length;
      if (!n) say(`${where}: durations.${anim} matches no animation frames`);
      if (Array.isArray(d) && d.length !== n) say(`${where}: durations.${anim} has ${d.length} entries for ${n} frames`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`art ok: ${Object.keys(COLORS).length} colors, ${sheets} sheets, ${frames} frames`);

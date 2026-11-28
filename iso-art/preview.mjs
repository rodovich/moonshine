// Render some frames of one sheet to a PNG, without building the atlas or touching the manifest
// (safe to run alongside other work). Frames sit side by side on a warm grey ground with their
// cast shadows, at 1× (out-1x.png) and 3× (out.png).
//   node iso-art/preview.mjs <sheet> <out.png> <frame> [<frame> …]
import { blank, blit, upscale } from './lib/post.mjs';
import { writePNG } from './lib/png.mjs';

const [sheetName, outPath, ...want] = process.argv.slice(2);
const sheet = (await import(`./sheets/${sheetName}.mjs`)).default;
const jobs = sheet.frames().filter((j) => want.some((w) => j.name === w || j.name.startsWith(`${w}`)));
const outs = jobs.flatMap((j) => j.render()).filter((r) => want.includes(r.name) || want.some((w) => r.name.startsWith(w)));
const W = Math.max(160, ...outs.map((r) => r.img.w + 40)), H = Math.max(200, ...outs.map((r) => r.img.h + 60));
const out = blank(W * outs.length, H);
for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 214; out.data[i + 1] = 206; out.data[i + 2] = 190; out.data[i + 3] = 255; }
outs.forEach((r, i) => {
  const ax = W / 2 + i * W, ay = H - 40;
  if (r.shadow) blit(out, r.shadow, ax, ay);
  blit(out, r.img, ax, ay);
});
writePNG(outPath.replace(/\.png$/, '-1x.png'), out);
writePNG(outPath, upscale(out, 3));
console.log(outs.map((r) => r.name).join(' '));

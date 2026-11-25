// Print the music lint report for every song (or one): node tests/audio/lint-music.mjs [id] [--all]
// Without --all, only warnings are listed; --all adds the informational notes.
import { lintSong } from '../../game/src/audio/lint.js';
import { SONGS } from '../../game/src/audio/music/index.js';

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.find((a) => !a.startsWith('--'));
let warnings = 0;
for (const [id, song] of Object.entries(SONGS)) {
  if (only && id !== only) continue;
  const { issues, stats } = lintSong(song);
  console.log(`== ${id}  ${Object.entries(stats).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  for (const i of issues) {
    if (i.level === 'warn') warnings++;
    if (all || i.level === 'warn') console.log(`  ${i.level.padEnd(4)} ${i.where}: ${i.msg}`);
  }
}
console.log(warnings ? `${warnings} warnings` : 'no warnings');
process.exitCode = warnings ? 1 : 0;

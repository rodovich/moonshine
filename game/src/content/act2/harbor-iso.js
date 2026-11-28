// The Harbor in the isometric view (map: harbor.js, 32 × 14): the quay under
// the headland, the harbor-front terrace, the lighthouse on its rock, Mott's
// ferry alongside, and the sea. Pieces from the town kit (../iso-kit.js) and
// the art task's harbor sheet (act2_harbor).
//
// Heights (px): the quay at 0; the sea at -40; the headland's rock rising
// behind the terrace to 240.

import { isoScene } from '../iso-kit.js';

const W = 32;
const H2 = 'act2_harbor';
const DOORS = { 6: 'locked', 12: 'office', 18: 'locked' };
const SEA = -40;

function build() {
  const S = isoScene();

  // ---- The quay (rows 4-8), and the lighthouse's doorstep (27-28, 3).
  S.floor(0, 4, W, 5, { kind: 'pave' });
  S.floor(27, 3, 2, 1, { kind: 'pave' });

  // ---- The headland behind (rows 0-3): bare rock, stepping up away from the quay.
  for (let y = 0; y <= 3; y++) for (let x = 0; x < W; x++) {
    if ((x >= 5 && x <= 22) || (x >= 26 && x <= 29)) continue; // the terrace and the lighthouse
    const z = 240 - y * 40;
    const crag = (f) => Array.from({ length: z / 40 }, (_, i) => [[f, `${f}_1`, `${f}_2`][(x * 7 + y * 13 + i * 5) % 3], 40]); // a crag variant by position
    S.column(x, y, 0, crag('cliff_s'), x === W - 1 || x === 4 || x === 25 ? crag('cliff_e') : [], ['rock_shelf', z], H2);
  }
  // The harbor-front terrace (x5-22), two storeys against the rock; doors at x6, x12 (the Harbor Office), x18.
  const front = Array.from({ length: 18 }, (_, i) => { const x = 5 + i; return x === 5 || x === 22 ? '#' : DOORS[x] ? 'D' : x % 3 === 0 ? 'w' : '#'; }).join('');
  S.house(5, 0, 18, 4, { front, upper: front.replace(/D/g, 'w'), plaster: 'sage', roof: 'flat' });
  // The lighthouse on its rock (26-29, 0-3), its door facing south onto (27-28, 3).
  S.prop(H2, 'lighthouse', 26, 0, 0, 4, 4);

  // ---- On the quay: the sign west to the Bilge, crates, nets, bollards.
  S.prop(H2, 'sign_bilge', 1, 4, 0, 3, 1);
  S.prop(H2, 'crates_pair', 7, 4, 0, 2, 1);
  S.prop(H2, 'nets', 20, 4, 0);
  S.prop(H2, 'bollard_rope', 8, 8, 0); S.prop(H2, 'bollard_rope', 18, 8, 0);
  S.prop(H2, 'bollard', 13, 8, 0);

  // ---- The quay edge (row 9) and the sea (rows 10-13); the culvert (1-2, 9) where the canal
  // runs out under the quay, and the Keyhole (30-31, 9) worn through the rock under the lighthouse.
  const faced = (x) => x === 1 || x === 2 || x === 30 || x === 31;
  for (let x = 0; x < W; x++) {
    S.column(x, 9, SEA, faced(x) ? [] : [['quay_s', 40]], [], ['pave_nw', 0]);
    S.prop('town', 'lip_x', x, 9, 0);
    for (let y = 10; y <= 13; y++) if (!(y === 10 && (x === 1 || x === 2))) S.add('town', y === 10 ? 'water_n' : 'water', x, y, SEA, 1, 1, 0);
  }
  S.add(H2, 'culvert', 1, 9, SEA, 2, 1, 0.1);
  S.add(H2, 'outflow', 1, 10, SEA, 2, 1, 0);
  S.add(H2, 'keyhole', 30, 9, SEA, 2, 1, 0.1);
  // Mott's ferry, the Persistence, alongside (bobbing).
  S.add(H2, 'persistence', 8, 9.1, SEA, 10, 3, 1);
  return S;
}

const base = build();
// A click on the boat goes to the ferry hotspot it covers.
const list = base.done().map((d) => (d.s === H2 && d.f === 'persistence' ? { ...d, pick: 'ferry' } : d));
// follows: the Harbor doesn't change in Act 2 (Act 5's risen Harbor falls back to the converter).
// hide: the ferry's SNES sprite (the scene draws the Persistence itself).
export const harborIso = { scene: () => list, floor: base.floorHeight(0), follows: [], hide: ['ferry_sprite'] };

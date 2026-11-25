// Small helpers shared by the opening's maps and scripts.

import { items2 } from '../../art/items.js';

export const openingItems = {
  pepper_mill: {
    name: 'Pepper Mill',
    icon: { sheet: items2, frame: 'pepper_mill' },
    description: 'Black. Tall. Dignified, if you squint.',
  },
  egg_timer: {
    name: 'Egg Timer',
    icon: { sheet: items2, frame: 'egg_timer' },
    description: "Ticks when it's wound. Dings when it's done. Very sure of itself.",
  },
  clothes_prop: {
    name: 'Clothes Prop',
    icon: { sheet: items2, frame: 'clothes_prop' },
    description: 'A long forked pole for holding up washing lines. Slightly damp. Sweaty Kid damp.',
  },
  bath_plug: {
    name: 'Bath Plug',
    icon: { sheet: items2, frame: 'bath_plug' },
    description: 'My plug. Brass, with a little chain to pull it out by.',
  },
  soap: {
    name: 'Soap',
    icon: { sheet: items2, frame: 'soap' },
    description: 'Lavender and pumice. For heels and soul, respectively.',
  },
  moon_chart: {
    name: 'Moon Chart',
    icon: { sheet: items2, frame: 'moon_chart' },
    description: 'Thirty-one ticks in the Gate, and one outside it.',
  },
  hat: {
    name: 'Hat',
    icon: { sheet: items2, frame: 'hat' },
    description: 'My daytime hat. Wide brim. It has seen things.',
  },
};

export const morning = (g) => !!g.flag('act1.moonrise');

// Give an item; the first time anything goes into the satchel, show the
// one-time hint about using items (it stays until the bag is opened).
export async function getItem(g, id) {
  await g.giveItem(id);
  if (!g.flag('hint.bag')) {
    g.setFlag('hint.bag');
    g.hint(
      g.usingTouch ? 'Tap the bag, pick something, then tap where it goes.' : 'X: bag. Pick something, then use it on someone or something.',
      Infinity,
      { untilBag: true },
    );
  }
}

// A saved counter: returns how many times `name` has been bumped before.
export function bump(g, name) {
  const n = g.flag(`n.${name}`) || 0;
  g.setFlag(`n.${name}`, n + 1);
  return n;
}

// The next of `lines` in turn (wrapping), counted by `name`.
export function cycle(g, name, lines) {
  return lines[bump(g, name) % lines.length];
}

// For an NPC whose idle is a fixed animation (a static sprite such as the
// Neighbor smoothing her sheets): switch to the walking sheet so she can turn
// to Cheryl, run the conversation, then go back to the idle if she's still here.
export function talking(sheet, fn) {
  return async (g, self, ...rest) => {
    const idle = self.sprite;
    const facing = self.facing;
    if (idle && idle.frame) {
      g.setSprite(self, { sheet });
      g.faceNpc(self, 'player');
    }
    try {
      return await fn(g, self, ...rest);
    } finally {
      if (idle && idle.frame && self.sprite && self.sprite.sheet === sheet && !self.sprite.frame && !self.moving) {
        g.setSprite(self, idle);
        self.facing = facing;
      }
    }
  };
}

// Cheryl's fallback when an item does nothing to an object (in turn).
export async function cherylDeclines(g) {
  await g.describe(cycle(g, 'decline', ['No.', "That's not where that goes.", "I don't think so, somehow.", "I'd only have to explain it later."]));
}

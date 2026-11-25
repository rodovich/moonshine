// Act 4's states of Act 2 part 2's maps: the Bilge going under (two flood
// stages, the piano in the canal, the Movers fishing for it), Mott sober at his
// shack on the Goat Path (the copper-throat thread), the sea-cave mouth open at
// low tide, and new lines at the Harbor and in the lamp room
// (docs/design/04-the-list.md).

import { act4Tiles } from './tiles.js';
import { overlayMap, act4, listStage, bump, cycle, getItem, cherylDeclines } from './common.js';
import { mott as mottArt } from '../../art/act4_sprites.js';
import { bilge_piano } from '../../art/act4_surface.js';
import { LOOKS } from '../act2/common.js';

const find = (map, id) => map.entities.find((e) => e.id === id);
const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

// A base character with a new first talk in Act 4, then their old repeats.
function firstTalk(base, lines) {
  return {
    ...base,
    id: `${base.id}_a4`,
    when: (g) => act4(g) && (!base.when || base.when(g)),
    interact: async (g, self, looks) => {
      if (bump(g, `a4.${base.id}`) === 0) return g.say(self, ...lines);
      return base.interact ? base.interact(g, self, looks) : g.say(self, ...lines.slice(-1));
    },
  };
}

async function surfaceAudio(g) {
  g.stopLoop('belfry_tick', 0);
  if (act4(g) && !g.flag('act4.risen')) g.startLoop('hull_far');
}

export function withAct4Part2(maps) {
  const out = { ...maps };

  // ---------------------------------------------------------------------------
  // The Bilge, going under.
  if (maps.bilge) {
    const bilge = maps.bilge;
    const flood = (T, x, y, stage) => {
      if (T.solid(x, y) && T.get('detail', x, y)) return; // stalls and posts stay as they are
      T.raw('ground', x, y, { tile: `bilge_flood:flood${stage}_${q(x, y)}`, step: 'step_splash' });
    };
    out.bilge = overlayMap(bilge, {
      when: act4,
      tileset: act4Tiles,
      hide: ['fishmonger', 'boatman', 'water_stairs'],
      tiles: (g, T) => {
        const stage = listStage(g);
        if (stage === 1) {
          for (let y = 4; y <= 6; y++) for (let x = 0; x <= 1; x++) flood(T, x, y, 1);
          for (const y of [4, 6]) T.set('detail', 2, y, 'bilge_flood:flood1_lap_w');
        } else {
          for (let y = 11; y <= 13; y++) for (let x = 0; x < 32; x++) flood(T, x, y, 2);
          for (let y = 4; y <= 6; y++) for (let x = 0; x <= 9; x++) flood(T, x, y, 2);
          for (const y of [4, 6]) T.set('detail', 10, y, 'bilge_flood:flood2_lap_w');
          T.set('detail', 6, 11, null); T.set('detail', 6, 12, null);
          // The Fishmonger's crate.
          T.set('detail', 4, 4, 'props:crate', true);
        }
      },
      triggers: [{
        x: 0, y: 4, w: 10, h: 3, stop: false,
        when: (g) => act4(g) && !g.flag('n.a4.quayFlood') && (listStage(g) === 2 || g.player.x <= 1),
        run: async (g) => {
          g.setFlag('n.a4.quayFlood', 1);
          await g.describe('Ankle-deep where the fish stalls used to be. The Bilge is going under, a little more every time I look.');
        },
      }],
      entities: [
        {
          ...find(bilge, 'fishmonger'), id: 'fishmonger_a4', when: act4,
          offset: [0, 0],
          interact: async (g, self) => {
            if (listStage(g) === 2) {
              if (bump(g, 'a4.fish2') === 0) return g.say(self, "I'm on a CRATE, Miss. A grown woman on a crate. This is where the sea has brought me.");
              return g.say(self, "If it gets any higher I'm going to the Crown, and I'm taking the fish.");
            }
            if (bump(g, 'a4.fish1') === 0) return g.say(self, "Miss! It's in my CELLAR now! My ice is FLOATING!", "My fish are escaping! They're DEAD and they're ESCAPING!");
            return g.say(self, "The Fountain stopped and the sea came for me. That's not a coincidence. That's PERSONAL.");
          },
        },
        {
          ...find(bilge, 'boatman'), id: 'boatman_a4', when: act4,
          interact: async (g, self) => {
            if (bump(g, 'a4.boatman') % 2 === 0) return g.say(self, "Mott's up at his shack, Miss. Sober. Gave me a fright.");
            return find(bilge, 'boatman').interact(g, self);
          },
        },
        {
          // Its look reaches up the bank to the quay, so it can be looked at from (6-7, 6).
          id: 'piano_canal', x: 6, y: 7, w: 2, h: 3, solid: false, shadow: false, when: act4,
          sprite: (g) => ({ sheet: bilge_piano, frame: listStage(g) === 2 ? 'piano_lid' : 'piano_halfsunk' }),
          interact: (g) => g.describe(listStage(g) === 2 ? "Just the lid now. It's going down with dignity." : 'The piano, half in the canal, lid up, like a sunbather.'),
        },
        {
          id: 'big_mover_a4', name: 'Big Mover', x: 6, y: 6, facing: 'down', sprite: LOOKS.big_mover, when: act4,
          interact: async (g, self) => {
            if (bump(g, 'a4.movers') === 0) {
              await g.say(self, 'Miss. It slid off the Fountain in the night and walked down to the canal. On its own. Again.');
              await g.say('Other Mover', 'Hnn.');
              return g.say(self, "He says it's trying to get to the sea. He says it's homesick.");
            }
            return g.say(self, "We'll have it out by Tuesday. Which Tuesday, I couldn't say.");
          },
          use: { '*': (g, self) => g.say(self, "Not now, Miss. We're fishing.") },
        },
        { id: 'other_mover_a4', name: 'Other Mover', x: 8, y: 6, facing: 'down', sprite: LOOKS.other_mover, when: act4, talk: 'Hnn.' },
        {
          id: 'water_stairs_a4', x: 22, y: 8, w: 4, solid: false, when: act4,
          look: "The water's higher up the Water Stairs than I've ever seen it. Two more steps gone under.",
        },
      ].map((o) => ({ use: { '*': cherylDeclines }, ...o })),
      onEnter: surfaceAudio,
    });
  }

  // ---------------------------------------------------------------------------
  // The Goat Path: Mott, sober, at his shack; the sea cave open at low tide.
  if (maps.goat_path) {
    const goat = maps.goat_path;
    const mottSits = { sheet: mottArt, frame: 'sit_down' };

    async function giveThroat(g, self) {
      await g.say(self, "What's this? ...Moons. Thirty-one years of moons, all in the Gate.", "And it creeps right. The last few. And last week's, out in the cold.");
      await g.say(self, "You see it too. Thirty-one years, written down. You're not drunk. You've never been drunk in your life.", "I've been drinking to forget I'm right. I can stop now.");
      // Into the shack for the coil, and back.
      g.setSprite(self, { sheet: mottArt });
      self.offset = [0, 0];
      await g.moveNpc(self, 'r', { ghost: true, speed: 18 }); // off his crates, to the door
      g.faceNpc(self, 'up');
      g.sfx('door_open');
      await g.moveNpc(self, 'u', { ghost: true, speed: 18 });
      g.hide(self);
      await g.wait(1.4);
      g.sfx('door_close');
      g.show(self);
      g.setSprite(self, { sheet: mottArt, frame: 'coil_down' });
      await g.moveNpc(self, 'd', { ghost: true, speed: 18 });
      g.setSprite(self, { sheet: mottArt });
      g.faceNpc(self, 'player');
      await g.say(self, "Here. Grandad's copper. Out of the sea cave. It never belonged in a still. You can tell, the way it hums.");
      g.setFlag('got.throat');
      await getItem(g, 'copper_throat');
      await g.say(self, 'Grandad said it came off "the greedy one." Never knew what that meant. Still don\'t.', "And take the jug. Square, so it don't roll. I've no more use for it.");
      await getItem(g, 'square_jug');
      await g.moveNpc(self, 'l', { ghost: true, speed: 18 }); // back onto his crates
      g.setSprite(self, mottSits);
      self.offset = [0, -8];
    }

    out.goat_path = overlayMap(goat, {
      when: act4,
      tileset: act4Tiles,
      hide: ['sea_cave'],
      tiles: (g, T) => {
        T.set('detail', 2, 16, 'props:crate', true); // Mott's crates, in the yard just below and left of his door (3, 15)
        T.block(1, 37, false); // the sea cave's mouth, open at low tide
      },
      exits: [{ x: 1, y: 37, to: 'sea_cave', at: [4, 6], facing: 'up', sfx: 'step_stone', when: act4 }],
      entities: [{
        id: 'mott_a4', name: 'Mott', x: 2, y: 16, facing: 'down', when: act4,
        sprite: mottSits, offset: [0, -8], turnToTalk: false,
        interact: async (g, self) => {
          if (g.flag('got.throat')) return g.say(self, cycle(g, 'a4.mottAfter', ["Whatever you're doing, Cheryl, do it before she tips any further.", "I'll stay off the moonshine. I'll want to remember this."]));
          if (bump(g, 'a4.mott') === 0) {
            return g.say(self,
              "Cheryl. I haven't had a drop since the doorsteps lit up. Didn't seem right, drinking, with the steps looking at me.",
              "The Bilge is going under. A hand to the left, and now a foot down. She's tipping, Cheryl. The whole island's tipping.",
              "And nobody'll listen. Because it's me. Because of the moonshine.",
              "If anyone else had seen it. Anyone. Written down, so they'd have to believe it.");
          }
          return g.say(self, cycle(g, 'a4.mottRepeat', [
            'If anyone had it written down. Just one other person.',
            'Tipping. A foot down on the Bilge side, and more every tide.',
            "Grandad's copper's in the still. Hums when the tide turns. Always has. Never knew why.",
          ]));
        },
        use: {
          moon_chart: (g, self) => (g.flag('got.throat') ? g.say(self, "I've seen it, Cheryl. I'll not forget it.") : giveThroat(g, self)),
          ship_plan: (g, self) => g.say(self, "A boat. That's a boat. ...That's US. I KNEW it. Don't tell anyone I knew it."),
          '*': (g, self) => g.say(self, "I've no use for that. I've no use for much, today."),
        },
      }, {
        id: 'cave_mouth_a4', x: 1, y: 37, solid: false, when: act4,
        look: "The sea cave. The tide's so far out I could walk in. I don't think the tide's ever been this far out.",
      }],
      onEnter: surfaceAudio,
    });
  }

  // ---------------------------------------------------------------------------
  // The Harbor: Mott's empty bollard, the ferry at a tilt.
  if (maps.harbor) {
    const harbor = maps.harbor;
    out.harbor = overlayMap(harbor, {
      when: act4,
      tileset: act4Tiles,
      hide: ['mott', 'harbor_office', 'ferry'],
      entities: [
        { id: 'bollard_a4', x: 13, y: 8, solid: false, when: act4, look: "Mott's bollard. No Mott, no jug. He'll be at his shack, up the Goat Path." },
        { id: 'harbor_office_a4', x: 12, y: 2, h: 2, solid: false, when: act4, look: 'A new note: GONE TO LOOK FOR THE LANDING. STILL.' },
        { id: 'ferry_a4', x: 10, y: 9, w: 6, h: 3, solid: false, when: act4, look: "The Persistence is tied up at a tilt. Even the ferry's leaning." },
      ].map((o) => ({ use: { '*': cherylDeclines }, ...o })),
      onEnter: surfaceAudio,
    });
  }

  // ---------------------------------------------------------------------------
  // The lamp room: the Keeper, and a lamp rattling in its frame.
  if (maps.lamp_room) {
    const room = maps.lamp_room;
    out.lamp_room = overlayMap(room, {
      when: act4,
      tileset: act4Tiles,
      hide: ['keeper'],
      entities: [{
        // Act 4's first talk, then her repeat (structure pass): the telescope she gave away in Act 2.
        ...find(room, 'keeper'), id: 'keeper_a4', when: act4,
        interact: (g, self) => (bump(g, 'a4.keeper') === 0
          ? g.say(self,
            "The lamp's rattling in its frame. Rattling! I've tightened every screw. It's the floor. The floor's not right.",
            "Don't tell me to look out the window. I know what you're going to say. Don't say it.")
          : g.say(self, "I gave my telescope away. I don't miss it. ...I keep looking at where it was.")),
      }],
      onEnter: surfaceAudio,
    });
  }
  return out;
}

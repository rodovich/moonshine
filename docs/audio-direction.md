# Audio direction

Moonshine should sound like a well-loved SNES adventure: warm, slightly soft "sampled" instruments, a little echo, and melodies you hum after you stop playing. Everything is synthesized at runtime with Web Audio ([decisions.md](decisions.md)); there are no audio files. The code is in `game/src/audio/` and its API is documented in [game/src/audio/README.md](../game/src/audio/README.md). Listen to everything on the dev page, `game/dev/audio.html`.

## Sonic identity

- **Warm and a little muffled.** Instruments are oscillators with hand-shaped harmonic spectra, soft envelopes, and lowpass filters, and the whole mix passes through a gentle 11 kHz lowpass. Nothing is bright or harsh. This stands in for the SNES's small, interpolated samples.
- **Echo, not reverb.** Each track has a stereo echo whose repeats darken as they fade, like the SNES echo unit. The surface uses short, light echo; deeper and stranger places get longer, wetter echo.
- **Few voices.** Music uses at most 6 monophonic channels, and up to 3 sound effects can play at once, so the game stays near the SNES's 8 voices. A new note on a channel cuts off the previous one. Chords are arpeggiated or split across channels, as composers did then.
- **Melody first.** Every track has a clear tune on one lead voice. Accompaniment ripples and supports; it never competes.

## Instrument palette

Defined in `game/src/audio/instruments.js`.

| Instrument | Sound | Used for |
|---|---|---|
| `flute` | breathy lead with delayed vibrato | main melodies on the surface |
| `ocarina` | hollow, rounder lead | quiet or mysterious melodies |
| `harp` | plucked, bright attack that mellows | rippling arpeggios (water, steps) |
| `marimba` | short wooden mallet | playful figures, light counterlines |
| `vibes` | metal mallet with shimmer | twinkles, the item jingle |
| `bell` | glassy, with an inharmonic partial | the underground's voice; the title |
| `accordion` | two detuned reeds | café warmth; harmony lines on the surface |
| `strings` | slow, soft pad | sustained guide tones |
| `choir` | soft "ooh" pad | the underground, big moments |
| `bass` | round fingered bass | walking bass on the surface |
| `bowbass` | sustained bowed bass | slow pieces |
| `wrongbell`, `wrongpad` | bells that sag flat; a pad that beats against itself | the Wrongness only |
| `kit` | soft kick, rim, brushy snare, shaker, hat, tambourine, tom, cymbal swell | light percussion |

## The three worlds

**The surface city** is sunlit, lived-in, and a little old-fashioned: major keys (the neighborhood is in F), flute, harp, accordion, round bass, and light hand percussion (shaker, rim, tambourine), with a gentle swing. Tunes are stepwise and singable, and the arrangement builds and thins as a loop goes round, so it doesn't wear out.

**The underground** (not composed yet) belongs to a different civilization, so it should sound related but foreign: bells, choir, and bowed bass; no hand percussion, only slow pulses; modes that sit outside the surface's major keys (the title's D-flat chord is the first taste); longer, wetter echo. Its melodies should use the same intervals as the surface motifs, rearranged, hinting that the two worlds share a history.

**The Wrongness** is something slipping out of tune. It reuses the surface's own material and corrupts it: notes sag flat as they ring, pads beat against themselves, and the home motif fails to land, sliding down chromatically against a tritone. It should be unsettling, never loud or a jump scare: residents don't notice it, so it lives at the edge of hearing.

## Leitmotifs

- **Home motif.** A rising A–C–F (third, then fourth, landing on the tonic), usually "and-a-ONE" into a held note. It opens the neighborhood theme and the title theme, and the item jingle is built on it. Use it for Cheryl's sense of home and for her goal.
- **The flat sixth.** The D-flat major chord in F (♭VI): the title turns to it twice, and its last phrase climbs D♭–E♭–F. It is the color of the hidden city. Save it on the surface for moments that brush against the underground.
- **The Wrongness slip.** The home motif's A–C–F, continued downward by half steps (F–E–E♭–D–D♭), over F in the bass with a B held against it. Pieces about the Wrongness should quote the slip, and any surface theme can be "infected" by bending its notes flat.

## Tracks

| id | Title | Key, tempo | Form | Length |
|---|---|---|---|---|
| `title` | Moonshine | F major, 72 bpm | 2-bar intro, 16-bar loop | 53.3 s loop |
| `neighborhood` | Stairs to the Water | F major, 100 bpm, light swing | 2-bar intro, loop A A2 B A3 (8 bars each) | 76.8 s loop |
| `wrongness` | Something Wrong | slips off F, 66 bpm | 2-bar one-shot cue | 7.3 s plus echo |

- **Stairs to the Water** builds across its loop: A is flute, harp, bass, and percussion; A2 adds strings; B is a lyrical bridge through the relative minor that ends on a little drum fill; A3 brings in an accordion singing in thirds under the flute, with tambourine.
- **Moonshine** opens on rippling harp and a bell, states the home motif slowly, and turns twice to D-flat before resolving upward.
- **Something Wrong** interrupts whatever is playing (`playCue('wrongness')`): the music dips out, the cue plays, and the music fades back in.

The game can also turn up a global Wrongness amount (`setWrongness(0..1)`) as the threat grows: notes in every track then drift slightly out of tune and some sag flat. At 0.1–0.2 it should only feel faintly off; 0.5 is clearly sick.

## Sound effects

Defined in `game/src/audio/sfx.js`.

| id | Description |
|---|---|
| `blip` | dialog text: short, bright, square-ish (one every other letter) |
| `blip_cheryl` | Cheryl's narration and inner voice: lower, rounder, a little uneven, like a thought |
| `step` | a soft step on stone, varied in pitch each time |
| `bump` | walking into something solid |
| `confirm` | interact / confirm: two quick rising notes |
| `cancel` | cancel / back: two falling notes |
| `menu_open`, `menu_close` | a quick harp run up or down with a breath of air |
| `item_get` | a fanfare on the home motif ending on the home chord; the music dips under it |
| `door` | a short wooden creak, then the latch and thump |
| `splash` | something going into water, with bubbles |
| `wrong_sting` | the home chord on bells, each note slipping flat at its own rate over a sagging drone; the music dips under it |

## Mixing levels

Measured with the dev page's level check (offline render at full volume, before the safety clipper):

- **Music:** peaks about −4 to −5 dBFS, RMS about −17 dBFS. The lead sits 6–8 dB (RMS) above the harp and pads.
- **UI sounds** (blips, steps, confirm, cancel, menus): peaks between −9 and −16 dBFS, so they read clearly over music without startling.
- **Jingles and stings** (item get, Wrongness sting): peaks about −4 dBFS, with the music ducked to 10–15% underneath so they never clash harmonically.
- **Default player volumes:** master 0.8, music 0.8, SFX 0.9 (sliders are squared, so they feel even). Settings persist in `localStorage` under `moonshine.audio`.
- A soft clipper (exactly linear below −3 dBFS) guards the output. It should almost never engage; if a new piece trips it, turn the piece down instead.

`node tests/audio/check-audio.mjs` fails if anything peaks above −1 dBFS or is nearly silent.

## Music data format

A song is a JS module under `game/src/audio/music/` that default-exports an object, and is registered in `music/index.js`:

```js
export default {
  id: 'neighborhood',          // same as its key in music/index.js
  title: 'Stairs to the Water',
  bpm: 100,
  stepsPerBeat: 4,             // default 4: one step is a sixteenth note
  beatsPerBar: 4,              // default 4
  swing: 0.14,                 // delay odd steps by this fraction of a step (0 = straight)
  gain: 0.85,                  // overall level of the song
  wrongness: 0,                // built-in detuning for this song (see setWrongness)
  echo: { delay: 0.3, feedback: 0.3, wet: 0.28, lowpass: 2600, spread: 0.023 },
  channels: [                  // at most 6; each plays one note at a time
    { id: 'lead', inst: 'flute', vol: 0.85, pan: 0.08, echo: 0.35, transpose: 0 },
    // ...
  ],
  patterns: {                  // each pattern gives every channel the same number of steps
    A: { lead: 'A4:2 C5 F5:3 E5:1 F5:4 A5 | ...', bass: '...' },
  },
  intro: ['I'],                // patterns played once
  loop: ['A', 'A2', 'B', 'A3'],// patterns repeated forever; null for a one-shot cue
};
```

Each channel's part is a string of whitespace-separated tokens:

| Token | Meaning |
|---|---|
| `C4`, `F#5`, `Bb2` | a note (scientific pitch: C4 is middle C) |
| `k`, `sn`, `sh` … | a drum, on a channel whose instrument is a kit |
| `.` | rest |
| `-` | hold: extend the previous note (or rest) |
| `:N` after any of the above | length in steps (`C5:4` is a quarter note). Lengths are sticky: a token without `:N` reuses the last length |
| `!` / `_` after a note or drum | accent / ghost (softer). `sh_:2` and `sh:2_` both work |
| `\|` | bar line. Optional, but the parser checks that each bar has the right number of steps, which catches most typing mistakes |
| `( ... )xN` | repeat the group N times; groups can nest |
| `v60` | set this channel's volume to 60% of its base level, from here on |
| `@harp` | switch this channel's instrument from here on (it stays switched, so set it at the start of each pattern that relies on it) |

Song modules may use small JS helpers to build these strings (for example, an `arp()` function for broken chords), as long as the result is easy to read.

Errors are specific: a bad token, a wrong bar length, or channels of unequal length throw an error naming the song, pattern, channel, and bar. `node --test tests/audio/` compiles every song.

## Process

- Add a song: write the module, register it in `music/index.js`, run `node --test tests/audio/` and `node tests/audio/check-audio.mjs`, then listen on the dev page.
- Keep loops 45–95 seconds, and write the loop seam so the last bar leads back into the first.
- Keep music to 6 channels.

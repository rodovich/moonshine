# Audio direction

Moonshine should sound like a well-loved SNES adventure: warm, slightly soft "sampled" instruments, a little echo, and melodies you hum after you stop playing. Everything is synthesized at runtime with Web Audio ([decisions.md](decisions.md)); there are no audio files. The code is in `game/src/audio/` and its API is documented in [game/src/audio/README.md](../game/src/audio/README.md). Listen to everything on the dev page, `game/dev/audio.html`, which also plays the opening's moonrise sequence in order.

The story and places come from [story-bible.md](story-bible.md) and [design/01-opening.md](design/01-opening.md) (its "Audio needed" list is what round 2 delivered).

## Sonic identity

- **Warm and a little muffled.** Instruments are oscillators with hand-shaped harmonic spectra, soft envelopes, and lowpass filters, and the whole mix passes through a gentle 11 kHz lowpass. Nothing is bright or harsh. This stands in for the SNES's small, interpolated samples.
- **Echo, not reverb.** Each track has a stereo echo whose repeats darken as they fade, like the SNES echo unit. Homey places use short, light echo; deeper and stranger places get longer, wetter echo.
- **Few voices.** Music uses at most 6 monophonic channels, and up to 3 sound effects can play at once, so the game stays near the SNES's 8 voices. (Ambient loops such as wind and the crowd are extra, but they are quiet beds.) A new note on a channel cuts off the previous one. Chords are arpeggiated or split across channels, as composers did then.
- **Melody first.** Every track has a clear tune on one lead voice that is the loudest voice in every section (checked; see below). Accompaniment ripples and supports; it never competes.

## Instrument palette

Defined in `game/src/audio/instruments.js`.

| Instrument | Sound | Used for |
|---|---|---|
| `accordion` | two detuned reeds | Cistern Court's lead: Cheryl's home |
| `flute` | breathy lead with delayed vibrato | the title; counter-melodies and descants |
| `ocarina` | hollow, rounder lead | quiet or uneasy melodies (Morning After) |
| `musicbox` | steel comb: bright tine, inharmonic partial, a click | the skipping rhyme (Moonrise) |
| `guitar` | warm nylon pluck | waltz accompaniment |
| `harp` | plucked, bright attack that mellows | rippling arpeggios (water, steps) |
| `piano` | upright, two slightly detuned strings | the piano in the Squeeze (and its fall) |
| `marimba` | short wooden mallet | playful figures |
| `vibes` | metal mallet with shimmer | the item jingle |
| `bell` | glassy, with an inharmonic partial | the underground's voice; the title |
| `strings` | slow, soft pad | sustained guide tones |
| `choir` | soft "ooh" pad | the underground, big moments |
| `bass` | round fingered bass | walking and waltz bass on the surface |
| `bowbass` | sustained bowed bass | slow pieces |
| `wrongbell`, `wrongpad` | bells that sag flat; a pad that beats against itself | the Wrongness only |
| `kit` | soft kick, rim, brushy snare, shaker, hat, tambourine, tom, cymbal swell, clock tick and tock | light percussion |

## The three worlds

**The surface city (Tessel)** is sunlit, lived-in, and a little old-fashioned: major keys, accordion, flute, guitar, harp, round bass, and light hand percussion (shaker, rim, tambourine). Tunes are stepwise and singable, and the arrangement changes as a loop goes round, so it doesn't wear out.

**The underground** (not composed yet) is the Founders' work, so it should sound related to the surface but foreign: bells, choir, and bowed bass; no hand percussion, only slow pulses; modes outside the surface's major keys (the title's D-flat chord is the first taste); longer, wetter echo. Its melodies should be built from the skipping rhyme's intervals, because the rhyme is the Founders' own manual.

**The Wrongness** is something slipping out of tune. It reuses the surface's own material and corrupts it: notes sag flat as they ring, pads beat against themselves, and the rhyme fails to land, sliding down by half steps against a tritone. It is unsettling, never a jump scare. The physical Wrongness sounds of the opening (the groan of the chain, the crack of the Tooth) are the one exception: those are meant to be enormous.

## Leitmotifs

- **Cheryl's home phrase** is Cistern Court's opening: a broken chord climbing sol–do–mi–sol (F–B♭–D–F in B♭), then sol–fa–mi falling back. Morning After plays it in G minor. Use it for Cheryl's home, her ritual, and her plug.
- **The skipping rhyme** is the game's central motif ([story-bible.md](story-bible.md), "The skipping rhyme"; the tune is `RHYME` in `music/moonrise.js`, and the title imports it). It is built from the home phrase, so Tessel's home tune turns out to be a fragment of the Founders' rhyme (requested by the story task):
  - *MOON-shine, MOON-shine, catch it in a cup* is the home phrase note for note, in F: C–F–A–C, then C–B♭–A, coming to rest on G.
  - *Ring the bell when the tide turns up* rearranges the same thirds and fourth: D–F–A, B♭–A–F, then G up a fourth to C on "up".
  - *Thin sister, Stout sister* climbs on F and C7; *Middle sister three*, the greedy one, turns to D-flat, the flat sixth.
  - *Wake them one by one and they'll drink up the sea* climbs through E-flat and C7 home to F (the same D♭–E♭–F climb that ends the title).

  It plays on a music box at the moonrise and is sung broadly in the title. It should return underground and at the ending. The item jingle is its first four notes.
- **The flat sixth.** The D-flat chord in F (♭VI): the title turns to it twice, and its last phrase climbs D♭–E♭–F. It is the color of the hidden city. Save it on the surface for moments that brush against the underground.
- **The Wrongness slip.** The rhyme's opening, C–F–A–C, with the third a half step low (A♭) and the top on B, a tritone above F; then "catch it in a cup" sliding down by half steps (B–B♭–A–A♭–G) over F in the bass with a B held against it. The music box running down at the moonrise is the same idea: the rhyme slowing and sagging flat.

## Tracks

| id | Title | Key, meter, tempo | Form | Length | Where |
|---|---|---|---|---|---|
| `title` | Moonshine | F major, 4/4, 72 bpm | 2-bar intro, 16-bar loop | 53.3 s loop | title screen |
| `cistern_court` | Cistern Court | B♭ major, 3/4, 88 bpm | 2-bar intro, A A2 B A3 (8 bars each) | 65.5 s loop | the opening at dusk; Cheryl's home theme |
| `moonrise` | Moonrise | F major, 4/4, 63 bpm | 8-bar loop | 30.5 s loop | the moonrise vista; runs down with `windDownMusic` |
| `morning_after` | Morning After | G minor, 3/4, 76 bpm | 16-bar loop | 37.9 s loop | the morning after Moonshine Night |
| `wrongness` | Something Wrong | slips off F, 66 bpm | 2-bar one-shot cue | 7.3 s plus echo | `playCue` when the Wrongness shows itself |
| `stairs` | Stairs to the Water | F major, 4/4, 100 bpm, light swing | 2-bar intro, A A2 B A3 | 76.8 s loop | not yet assigned: a surface theme for the wider city |

- **Cistern Court** is an unhurried waltz: an accordion over a nylon guitar's oom-pah-pah. Each time round it changes: A is guitar and accordion; A2 swaps the guitar for rippling harp; B hands the tune to the flute in G minor while the accordion holds long notes; A3 brings it all back with a soft flute descant.
- **Moonrise** is three music-box voices (tune, a broken-chord comb, low notes) with a long echo. At the moment the moon appears, the game calls `windDownMusic(ms)`: from the next note on, each step takes longer than the last and every note is flatter, until the box stops wherever it has got to and the last notes ring out. This is the design's "slows, drifts flat, and stops mid-phrase".
- **Morning After** is Cistern Court's tune in G minor on a lone ocarina, over a harp's pah-pah, a bowed bass, and a ticking clock. Its second half starts the rhyme again in E-flat and doesn't finish it. Its last note is F♯, so the loop comes back to F with a small lurch. It is very slightly out of tune (song wrongness 0.12).
- **Moonshine** (title) sings the whole rhyme (eight bars) on the flute, then answers with its own phrase, which turns to D-flat again and climbs D♭–E♭–F.
- **Something Wrong** is the rhyme collapsing (see the Wrongness slip).
- **Stairs to the Water** was the round 1 opening theme. The story moved the opening to a waltz, so this one waits for a place in the wider city.

The game can also turn up a global Wrongness amount (`setWrongness(0..1)`) as the threat grows: notes in every track then drift slightly out of tune and some sag flat. At 0.1–0.2 it should only feel faintly off; 0.5 is clearly sick. The story bible sets it by act: about 0.1 after Act 1, rising to 0.5 in Act 5, and 0 at the ending. A track's own `wrongness` (Morning After's 0.12, the cue's 0.5) is a floor: the track uses whichever is higher.

## Sound effects

Defined in `game/src/audio/sfx.js` (interface) and `game/src/audio/sfx-world.js` (everything else). Many are randomized a little on each play so repeats don't sound mechanical. Loops are started and stopped with `startLoop` / `stopLoop`.

| Group | ids |
|---|---|
| Interface | `blip` (dialog text), `blip_cheryl` (Cheryl's narration: lower, rounder, uneven), `cursor`, `confirm` (select), `cancel`, `menu_open`, `menu_close`, `item_get` (a fanfare; dips the music), `give` |
| Footsteps | `step_stone` (cobbles and paving, also `step`), `step_plaster` (the whitewashed roof), `step_tile` (terracotta floors indoors), `step_rug`, `step_stairs` (stone steps), `step_wood` (boards: piers, boats, later), `step_kid` (the Sweaty Kid's light feet) |
| Doors and movement | `door` (open and shut, for map exits), `door_open`, `door_close`, `bump` |
| Puzzle and characters (the opening) | `tap_squeak`, `water_pour` (loop), `tub_full`, `chess_tap`, `pepper_grind`, `sneeze` (the Old Man: ah… ah… CHOO), `timer_tick` (loop), `timer_ding`, `sheets_flap`, `kid_patter` (a run of the Kid's steps), `kid_hop`, `piano_flat` (one A, a little flat), `splash` |
| Ambience | `crowd` (loop: the festival murmur below; stop it dead with `stopLoop('crowd', 0)`), `wind` (loop), `swifts`, `dog_bark` (one dog, far off), `gull`, `clock_strike` (the Mayor's clock on the Crown, three strokes, fading), `well_breath` (the morning well's cold whoosh) |
| The Wrongness | `wrong_sting` (the home chord on bells slipping flat), `groan` (a chain under strain, 3 s; dips the music), `crack` (the Tooth shearing), `rattle` (chimney pots and timbers), `piano_tumble` (a chord crash, then thumps and jangles receding, 3.5 s), `drain` (glunk, gurgle, a hollow sound falling away, a far splash; 5 s in all), or its parts for timing to the tub's animation: `drain_glunk`, `drain_gurgle` (1.5 s), `drain_echo` (the fall, with the splash 2.5 s after it starts) |

The dev page's "moonrise sequence" button plays these in the design's order with suggested timings (see `MOONRISE` in `game/dev/audio.html`): fade Cistern Court and start the crowd and clock; 5 s later the music box; at the moon, stop the crowd dead, wind the music down over about 4.5 s, and bark the dog; after the cut, the groan with the rattle, the crack, the piano, the drain, then a gull and the wind.

## Mixing levels

Measured with the checks below (offline render at full volume, before the safety clipper):

- **Music:** peaks −2 to −6 dBFS, RMS −15 to −20 dBFS, and A-weighted loudness within about 2 dB across the looping tracks.
- **Balance within a track:** the melody is at least 3 dB louder (A-weighted, each voice alone) than every other voice in every section; in practice 4.5–13 dB.
- **Interface sounds:** peaks −9 to −17 dBFS, so they read over music without startling. Footsteps −13 to −18 (the rug and the Kid quieter).
- **Big moments** (item get, the Wrongness sting, the groan, the crack, the piano): peaks −3 to −6 dBFS, with the music ducked underneath where they would clash.
- **Ambience:** distant things are quiet (crowd, wind, gull, dog, swifts: peaks −20 to −28).
- **Default player volumes:** master 0.8, music 0.8, SFX 0.9 (sliders are squared, so they feel even). Settings persist in `localStorage` under `moonshine.audio`.
- A soft clipper (exactly linear below −3 dBFS) guards the output. It should almost never engage; if something trips it, turn that thing down instead.

## Checking the music

Nobody on the project can listen, so the checks stand in for ears. All three run in `node tests/audio/check-audio.mjs`, and the first in `node --test tests/audio/`.

1. **Music lint** (`game/src/audio/lint.js`; `node tests/audio/lint-music.mjs --all` prints it). Each pattern declares its chords (`harmony: 'Bb | Eb | Cm F7 |'`). The lint warns on:
   - melody notes a beat or longer (or half a beat on a strong beat) that are neither chord tones nor safe tensions (9ths, 6ths, 11ths on minor chords);
   - accompaniment notes of that length that aren't chord tones, and bass notes likewise, except stepwise approach notes off the downbeat;
   - two voices a semitone or a minor ninth apart for half a beat or more;
   - melodic leaps over an octave (and notes wide leaps and tritones);
   - a melody with fewer than 6 pitches, fewer than 3 note lengths, or fewer than 35% distinct bars.

   It also notes close voices below G3 (mud). A song can allow a specific warning with `lintAllow: [{ match, why }]`; every allowance states why.
2. **Balance:** each voice of each section is rendered alone and measured with A-weighting (so low notes don't count for more than the ear hears). The melody must lead by 3 dB.
3. **Spectrum:** each track's energy by band. Sub-bass (under 60 Hz) must stay below −12 dB of the total, low-mid (200–500 Hz) no more than 3 dB above mid (500–2000 Hz), and presence (2–6 kHz) above −35 dB.

Plus levels: nothing may peak above −1 dBFS or be nearly silent, and the moonrise must actually stop after winding down.

## Music data format

A song is a JS module under `game/src/audio/music/` that default-exports an object, and is registered in `music/index.js`:

```js
export default {
  id: 'cistern_court',         // same as its key in music/index.js
  title: 'Cistern Court',
  bpm: 88,
  stepsPerBeat: 4,             // default 4: one step is a sixteenth note
  beatsPerBar: 3,              // default 4
  swing: 0.06,                 // delay odd steps by this fraction of a step (0 = straight)
  gain: 1.2,                   // overall level of the song
  wrongness: 0,                // built-in detuning for this song (see setWrongness)
  echo: { delay: 0.34, feedback: 0.3, wet: 0.26, lowpass: 2400, spread: 0.023 },
  channels: [                  // at most 6; each plays one note at a time
    { id: 'lead', inst: 'accordion', vol: 0.85, pan: 0.05, echo: 0.3, transpose: 0 },
    { id: 'flute', inst: 'flute', vol: 0.6, role: 'counter' },  // roles: see below
    // ...
  ],
  patterns: {                  // each pattern gives every channel the same number of steps
    A: {
      harmony: 'Bb | Bb | Eb | Eb | Cm | F7 | Bb | F7 |',  // for the lint
      lead: 'F4:4 Bb4 D5 | F5:6 Eb5:2 D5:4 | ...',
      bass: '...',
    },
    B: { melody: 'flute', /* the flute has the tune in this section */ },
  },
  intro: ['I'],                // patterns played once
  loop: ['A', 'A2', 'B', 'A3'],// patterns repeated forever; null for a one-shot cue
  lintAllow: [{ match: 'A/bass bar 8 beat 4', why: 'a leading tone into the next section' }],
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

Harmony strings: chords separated by spaces split a bar evenly unless given `:steps` (`F:4 C:12`); `N` means no chord. Chord symbols are a root plus `m`, `7`, `maj7`, `m7`, `6`, `m6`, `9`, `m9`, `add9`, `dim`, `dim7`, `m7b5`, `aug`, `sus2`, `sus4`, or `7sus4`, with an optional `/bass`.

Channel roles (for the lint and balance checks): `melody`, `counter` (a secondary tune), `acc`, `bass`, `perc`. By default `lead` is the melody, `bass` is the bass, kits are percussion, and everything else is accompaniment.

Song modules may use small JS helpers to build these strings (for example, an `arp()` function for broken chords), as long as the result is easy to read.

## Process

- Add a song: write the module with its harmony, register it in `music/index.js`, run `node --test tests/audio/` and `node tests/audio/check-audio.mjs`, fix what they report, then listen on the dev page if you can.
- Write the loop seam so the last bar leads back into the first. Loops are 30–95 seconds (the home theme 60–90).
- Keep music to 6 channels.

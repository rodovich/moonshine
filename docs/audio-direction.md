# Audio direction

Moonshine should sound like a well-loved SNES adventure: warm, slightly soft "sampled" instruments, a little echo, and melodies you hum after you stop playing. Everything is synthesized at runtime with Web Audio ([decisions.md](decisions.md)); there are no audio files. The code is in `game/src/audio/` and its API is documented in [game/src/audio/README.md](../game/src/audio/README.md). Listen to everything on the dev page, `game/dev/audio.html`, which also plays the opening's moonrise sequence in order.

The story and places come from [story-bible.md](story-bible.md) and the slice designs in [design/](design/): the "Audio needed" lists of [01-opening.md](design/01-opening.md), [02-city.md](design/02-city.md), [03-downstairs.md](design/03-downstairs.md), and 04-the-list.md (Act 4) are all delivered.

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

**The underground** is the Founders' work, so it sounds related to the surface but foreign: moonglass (a glass harmonica), bells, choir, and bowed bass; no hand percussion, only a slow pulse like machinery far off; long, wet echo. Its key is **D-flat**, the flat sixth that surface music only glances at, in the **Lydian mode**: the fourth is raised (G natural). Its melodies are the skipping rhyme turned inside out, because the rhyme is the Founders' own manual. The Founders' version of the rhyme sings that raised fourth where the children sing a plain one (see **The Founders' voice** below). Downstairs sounds are harder and ring longer than on the surface: stone plates, bronze, glass, water.

**The Wrongness** is something slipping out of tune. It reuses the surface's own material and corrupts it: notes sag flat as they ring, pads beat against themselves, and the rhyme fails to land, sliding down by half steps against a tritone. It is unsettling, never a jump scare. The physical Wrongness sounds of the opening (the groan of the chain, the crack of the Tooth) are the one exception: those are meant to be enormous.

## Leitmotifs

- **Cheryl's home phrase** is Cistern Court's opening: a broken chord climbing sol–do–mi–sol (F–B♭–D–F in B♭), then sol–fa–mi falling back. Morning After plays it in G minor. Use it for Cheryl's home, her ritual, and her plug.
- **The skipping rhyme** is the game's central motif ([story-bible.md](story-bible.md), "The skipping rhyme"; the tune is `RHYME` in `music/moonrise.js`, and the title imports it). It is built from the home phrase, so Tessel's home tune turns out to be a fragment of the Founders' rhyme (requested by the story task):
  - *MOON-shine, MOON-shine, catch it in a cup* is the home phrase note for note, in F: C–F–A–C, then C–B♭–A, coming to rest on G.
  - *Ring the bell when the tide turns up* rearranges the same thirds and fourth: D–F–A, B♭–A–F, then G up a fourth to C on "up".
  - *Thin sister, Stout sister* climbs on F and C7; *Middle sister three*, the greedy one, turns to D-flat, the flat sixth.
  - *Wake them one by one and they'll drink up the sea* climbs through E-flat and C7 home to F (the same D♭–E♭–F climb that ends the title).

  It plays on a music box at the moonrise and is sung broadly in the title. It should return underground and at the ending. The item jingle is its first four notes.
- **The flat sixth.** The D-flat chord in F (♭VI): the title turns to it twice, and its last phrase climbs D♭–E♭–F. It is the color of the hidden city, and D-flat is the underground's home key. On the surface, save it for moments that brush against the underground: the Archive ends on it, unresolved, and the discovery sting climbs D♭–E♭–F.
- **The Founders' voice.** The rhyme moved to D-flat with its fourth raised (G natural for G-flat): "catch it in a" sings sol–*fa♯*–mi. `downstairs` plays the rhyme's opening upside down (A♭–F–D♭–A♭, falling) with that raised fourth; the `reveal` cue plays the rhyme's first couplet straight, in the Founders' voice, when Cheryl realizes the city is a boat.
- **The Wrongness slip.** The rhyme's opening, C–F–A–C, with the third a half step low (A♭) and the top on B, a tritone above F; then "catch it in a cup" sliding down by half steps (B–B♭–A–A♭–G) over F in the bass with a B held against it. The music box running down at the moonrise is the same idea: the rhyme slowing and sagging flat.

## Tracks

| id | Title | Key, meter, tempo | Form | Length | Where |
|---|---|---|---|---|---|
| `title` | Moonshine | F major, 4/4, 72 bpm | 2-bar intro, 16-bar loop | 53.3 s loop | title screen |
| `cistern_court` | Cistern Court | B♭ major, 3/4, 88 bpm | 2-bar intro, A A2 B A3 (8 bars each) | 65.5 s loop | the opening at dusk; Cheryl's home theme |
| `moonrise` | Moonrise | F major, 4/4, 63 bpm | 8-bar loop | 30.5 s loop | the moonrise vista; runs down with `windDownMusic` |
| `morning_after` | Morning After | G minor, 3/4, 76 bpm | 16-bar loop | 37.9 s loop | the morning after Moonshine Night |
| `wrongness` | Something Wrong | slips off F, 66 bpm | 2-bar one-shot cue | 7.3 s plus echo | `playCue` when the Wrongness shows itself |
| `neighborhood` | Stairs to the Water | F major, 4/4, 100 bpm, light swing | 2-bar intro, A A2 B A3 | 76.8 s loop | the upper town by day: Lamp Street, the Crown, the Hundred Steps, Fountain Square; muffled in the Shop |
| `harbor` | Low Tide | D minor, 6/8, 52 bpm (dotted quarters) | 1-bar intro, A B A2 | 55.4 s loop | the Bilge, the Harbor, the Goat Path |
| `archive` | Dust in Sunlight | F major, 4/4, 56 bpm | 12-bar loop ending on D-flat | 51.4 s loop | the Archive and the crypt |
| `discovery` | The Hundredth Step | D♭–E♭–F, 60 bpm | 2-bar one-shot cue | 8 s plus echo | `playCue` when the hundredth step opens (and other first glimpses of the Founders' work) |
| `downstairs` | Downstairs | D-flat Lydian, 4/4, 54 bpm | A B (8 bars each) | 71.1 s loop | the underground: the Step Gallery, the Lamp Halls, the Bunk Room, the Chart Room |
| `reveal` | We're a Boat | D-flat (Founders' voice), 64 bpm | 4-bar one-shot cue | 15 s plus echo | `playCue` after "Oh, we're a boat." in the Chart Room |
| `reveal_last` | We're a Boat (last phrase) | as `reveal`, softer | 2-bar one-shot | 7.5 s plus echo | under the dusk vista at the end of Act 3 |
| `pumps` | The Sisters Wake | D-flat pedal, 76 bpm | 8-bar scene loop | 25.3 s loop | Act 4: from the moment all three Sisters run until the burst (`stopMusic(0)`) |
| `climb` | The Climb | a heartbeat, 52 bpm | 1-bar scene loop | 4.6 s loop | Act 4: the emergency shaft; raise it with `bendMusic`, fade it out by row 7 |
| `neighborhood_thin` | Stairs to the Water (thin) | as `neighborhood`, 86 bpm, flute alone | A A2 B A3 | 89.3 s loop | Act 4's reveal in the dry Bilge, at Wrongness 0.5 |

- **Cistern Court** is an unhurried waltz: an accordion over a nylon guitar's oom-pah-pah. Each time round it changes: A is guitar and accordion; A2 swaps the guitar for rippling harp; B hands the tune to the flute in G minor while the accordion holds long notes; A3 brings it all back with a soft flute descant.
- **Moonrise** is three music-box voices (tune, a broken-chord comb, low notes) with a long echo. At the moment the moon appears, the game calls `windDownMusic(ms)`: from the next note on, each step takes longer than the last and every note is flatter, until the box stops wherever it has got to and the last notes ring out. This is the design's "slows, drifts flat, and stops mid-phrase".
- **Morning After** is Cistern Court's tune in G minor on a lone ocarina, over a harp's pah-pah, a bowed bass, and a ticking clock. Its second half starts the rhyme again in E-flat and doesn't finish it. Its last note is F♯, so the loop comes back to F with a small lurch. It is very slightly out of tune (song wrongness 0.12).
- **Moonshine** (title) sings the whole rhyme (eight bars) on the flute, then answers with its own phrase, which turns to D-flat again and climbs D♭–E♭–F.
- **Something Wrong** is the rhyme collapsing (see the Wrongness slip).
- **Stairs to the Water** was written for the opening before the story settled on a waltz; Act 2 gives it the upper town. In the Shop it plays through `muffleMusic(true)`, as if heard from outside.
- **Low Tide** is the upper town's world seen from the waterline: Cheryl's home phrase in D minor (A–D–F–A, G–F–E–D) on the accordion over a rocking 6/8 guitar, with water lapping in the percussion. The middle lifts into F major and leans on an A-major chord; the last time round, a flute answers like a gull.
- **Dust in Sunlight** is a single bell reading the rhyme's opening aloud to itself over slow harp. It ends on D-flat with the bell stopped on C, and the loop starts over without resolving.
- **The Hundredth Step** (discovery sting): bells and choir on D-flat, the bass climbing D♭–E♭–F to F major with A on top. Wonder, with a chill.
- **Downstairs**: moonglass sings the rhyme upside down over choir and bowed bass, with a slow two-beat pulse. It is the quietest looping track on purpose (about −21 dB A-weighted, against −18 to −20 for the surface) so the hull's creak can be heard. The loop ends on the raised G, glowing and unresolved.
- **We're a Boat** (reveal): the rhyme's first couplet on glass bells, doubled an octave down on moonglass, over a held D-flat chord.
- **The Sisters Wake** (pumps): the one place Downstairs has a beat. The three Sisters' thumps make the rhythm: the stout one on every beat, the thin one in a 3-3-2 roll, the middle one on the off-beats. Bowed bass holds D-flat. Two moonglass voices an octave apart climb the D-flat Lydian scale a step a bar, the lower fading in as the upper fades out, so the line seems to rise forever past the D-flat where it should rest (a Shepard-tone illusion). As the city rises, the game calls `bendMusic` to creep it sharp. The burst cuts it off.
- **The Climb**: nothing but a slow heartbeat under the shaft's sounds, raised in pitch as Cheryl climbs.
- **Stairs to the Water (thin)**: the upper town's tune on its flute alone, slower, with a long echo, every note sagging. Home, after you've broken it.

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
| The Wrongness | `wrong_sting` (the home chord on bells slipping flat), `groan` (a chain under strain, 3 s; dips the music), `crack` (the Tooth shearing), `rattle` (chimney pots and timbers), `piano_tumble` (a chord crash, then thumps and jangles receding, 3.5 s), `drain` (glunk, gurgle, a hollow sound falling away, a far splash; 5 s in all), or its parts for timing to the tub's animation: `drain_glunk`, `drain_gurgle` (1.5 s), `drain_echo` (the fall, ending in the tiny far splash 2.5 s after it starts; don't add `splash`, which is a close, loud one) |
| The wider city (Act 2, `sfx-city.js`) | `knock`, `shop_bell`, `stone_scrape` (crowbar on mortar; three variants at random, each at a slightly different pitch), `scrub` (soap on the piano's runners), `skip_rope`, `slab_lift`, `piano_slide` (soapy whoosh, long scrape, jangle, receding; 3.5 s), `trickle` (loop), `sink_gurgle` (water vanishing into the step), `step_splash` (the flooded Bilge), `door_hum` (loop: the Founders' Door, very quiet), `goat`, `boatman_sing` (a few wobbly, off-pitch notes of his shanty or the rhyme), `girls_chant` (the rhyme's opening, with the rope) |
| City ambience (loops) | `town` (the upper town by day: far voices, a shutter, a hammer, sparrows), `canal` (lapping, a boat knocking), `gulls`, `goats`, `clock_tick` (the Crown's clock, close up), `glow_shimmer` (the Crown at dusk with the moon-eyes lit) |
| Downstairs: moving about (Act 3, `sfx-under.js`) | `step_hullstone`, `step_rung`, `lever_pull` (seized grind, then release), `lid_open` (the ceiling lid scraping open), `shutters` (right after the lid: every light-pipe shutter under the doorsteps opening, a run of clunks going away up the hill for about 4 s; it tells the player they lit the doorsteps), `lid_pry`, `mirror_turn` (pivot and clunk), `light_beam` (daylight arriving), `beam_hum` (loop, while a beam is lit), `moonlock_open` (rising chime, then the hatch's stone grind), `hatch_open` (bronze), `disc_get` (taking the disc: the item jingle's shape on glass, in D-flat), `disc_glow`, `lamp_relight` (a soft "drink," then a shimmer), `chute_slide` (falling whoosh, two bumps, a thump), `ladder_drop` (chain rattle, then a crash), `tube_voice` (a shout down the speaking tube), `tube_murmur` (loop: the far-off crowd through the tube, under FAR-OFF VOICE lines), `bolt_draw`, `founders_door`, `rubbing` (charcoal on paper) |
| Downstairs: machines and water | `valve_turn` (a groaning wheel and its ratchet), `valve_jam`, `water_gush` (loop: the gushing pipe; stop it over about 2 s so the rush slows to a stop), `far_gurgle` (draining far off), `pump_run` (loop), `pump_cough` (the wrong order: ragged chugs, a hiss, a clunk), `chain_rattle`, `chain_haul` (loop), `tide_wheel` (loop) |
| Downstairs ambience (loops) | `hull` (a low drone and a slow, deep creak every 20 s or so), `drips`, `moonglass_hum` (faint, near moonglass) |
| Act 4: the belfry and the Fountain (`sfx-rise.js`) | `belfry_tick` (loop: the clock up close), `clock_rundown`, `lever_clank`, `clamp_lift`, `bell_stroke` and `bell_strokes` (the great bell, once or three times, each with a long bloom; in D-flat), `thrum_rise` and `thrum` (loop: the Tide Wheel felt from above), `hull_far` (loop: a faint creak every 40 s or so), `coins_rattle`, `ring_hatch` |
| Act 4: the Pump Hall and the rise | `valve_squeal`, `pump_cough` (two variants), `pump_stall`, `thump_thin`, `thump_stout`, `thump_middle`, `pump_thin` and `pump_stout` (loops, in time with the pumps cue), `shaft_hum` (loop), `grate_drain`, `hull_creak_long`, `valve_hiss` (loop), `ear_pop` (dips the whole mix), `groan_great`, `burst`, `spray` (loop), `roar` (loop), `water_spread` (loop), `hatch_bang`, `air_whistle` (loop); at the Tide Wheel, `slack_lap` and `channel_rush` (loops) with `tide_wheel` |
| Act 4: the climb, the cellar, the reveal | `gull_close`, `slab_scrape`, `slab_close`, `shouting` (loop: muffled through the floor), `bell_low` (one soft D-flat at the bronze door), `town_rush`, `crabs` (loop), `fish_flop`, `runoff` (loop: the last water running out of the dry Bilge) |

The dev page's "moonrise sequence" button plays these in the design's order with suggested timings (see `MOONRISE` in `game/dev/audio.html`): fade Cistern Court and start the crowd and clock; 5 s later the music box; at the moon, stop the crowd dead, wind the music down over about 4.5 s, and bark the dog; after the cut, the groan with the rattle, the crack, the piano, the drain, then a gull and the wind.

Suggested use in Acts 2 and 3 (the scripts decide):

- **The hundredth step:** `stone_scrape` three times, `slab_lift`, `well_breath`, then `playCue('discovery')`.
- **The lever:** `lever_pull`, `lid_open`, then `shutters`.
- **The valve** (turned with a key now; the same sounds fit): `valve_turn`, then `stopLoop('water_gush', 2000)` with `far_gurgle`, then `tube_voice` (with `tube_murmur` running under the FAR-OFF VOICE lines), then `valve_jam` when it won't go back.
- **The Chart Room:** after "Oh, we're a boat.", `playCue('reveal', { resume: false })`; at the dusk vista, `playCue('reveal_last', { resume: false })` with `glow_shimmer` running.
- **Downstairs maps:** `downstairs` music with the `hull` and `drips` loops; stop both on surfacing.

In Act 4 (04-the-list.md; the scripts decide):

- **The belfry:** `belfry_tick` (loop) until the lever (`lever_clank`), `clamp_lift`, then `stopLoop('belfry_tick', 0)` with `clock_rundown`. Ambrose rings: `bell_strokes`, then `thrum_rise` and the `thrum` loop (fade it out a few minutes later on the surface).
- **The surface:** `hull_far` (loop) for the faint creak every 40 s or so; `setWrongness(0.35)` for the act and 0.5 from the reveal.
- **Waking the Sisters:** `valve_squeal`, `pump_cough` twice, then the Sister's loop (`pump_thin`, `pump_stout`) or, for a single beat, `thump_*`. A wrong order: `pump_stall` and stop the loops. The third Sister: stop the `pump_*` loops and `playMusic('pumps', { fadeMs: 0 })` (the cue carries all three thumps), with `shaft_hum` and `grate_drain`.
- **The rise:** `hull_creak_long` (step 3); `valve_hiss` loop at the stuck valve; `hull_creak_long` again and `bendMusic(60, 6000)` (step 9); `ear_pop` (step 10; it dips the whole mix by itself); `groan_great`, then `burst` (the main pipe splitting: crack, torn-metal shriek, hissing spray) with `stopMusic(0)`, the `spray`, `roar`, and `water_spread` loops, `hatch_bang`, and the `air_whistle` loop (step 11).
- **The climb:** `playMusic('climb', { fadeMs: 500 })` and `bendMusic(300, 20000)`; `step_rung` per rung; `setLoopVolume('roar', 0.4, 3000)` at row 22, `0.1` at row 14, `stopLoop('roar', 3000)` and `stopMusic(3000)` by row 7 with `drips` and `gull_close`; `slab_scrape` at the top.
- **The ice cellar:** `slab_close`, `drips`, and the `shouting` loop.
- **The reveal:** stop everything but `wind`, and give the dry Bilge no `canal` lapping at all: its absence is the first thing the ear should notice. Add the faint `runoff` loop near the east end, where the last water runs out (raise it with `setLoopVolume` as Cheryl nears it, if wanted); `gull`; at the door `bell_low`; then `playMusic('neighborhood_thin')`, `town_rush` with the `crowd` loop, `crabs` (loop), and `fish_flop`.

## Mixing levels

Measured with the checks below (offline render at full volume, before the safety clipper):

- **Music:** peaks −2 to −6 dBFS, RMS −15 to −20 dBFS, and A-weighted loudness within about 2 dB across the looping tracks.
- **Balance within a track:** the melody is at least 3 dB louder (A-weighted, each voice alone) than every other voice in every section; in practice 4.5–13 dB.
- **Interface sounds:** peaks −9 to −17 dBFS, so they read over music without startling. Footsteps −13 to −18 (the rug and the Kid quieter).
- **Big moments** (item get, the Wrongness sting, the groan, the crack, the piano): peaks −3 to −6 dBFS, with the music ducked underneath where they would clash.
- **Ambience:** distant things are quiet (crowd, wind, gulls, dog, swifts, goats, canal: peaks −20 to −31). Hums are near the edge of hearing (the Founders' Door, beams, moonglass: RMS −36 to −48).
- **Underground music** sits 1–3 dB below the surface tracks (A-weighted), so the hull creak and drips come through.
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
  scene: false,                // true for a loop that underscores one scripted moment: it may be
                               // short, and the spectrum checks skip it (a heartbeat is all bass)
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

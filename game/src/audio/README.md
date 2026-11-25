# Audio

Synthesized music and sound effects. Creative direction, the full list of tracks and sounds, and the music data format are in [docs/audio-direction.md](../../../docs/audio-direction.md). Try everything at `game/dev/audio.html`.

## API

The engine calls these through its bridge, `src/engine/sound.js`, which also forgives unknown ids. The module itself is `src/audio/index.js`:

| Call | What it does |
|---|---|
| `initAudio()` | Creates and resumes the audio context. Call it from the first user input event (keydown, pointerdown); browsers block audio before that. Safe to call repeatedly. Returns a promise. |
| `playMusic(id, { fadeMs = 800 })` | Crossfades to a music track. Asking for the track already playing does nothing. Called before `initAudio()`, it remembers the request and starts when audio is ready, so you can request the title music at load. |
| `stopMusic(fadeMs = 800)` | Fades the music out. |
| `windDownMusic(ms = 4000)` | The current music runs down like a music box: it slows, sags flat, and stops wherever it has got to, with its last notes left to ring. For the moonrise. |
| `playCue(id, { resume = true })` | Interrupts with a one-shot cue (`'wrongness'`): the music dips out, the cue plays, and the music fades back (or stays stopped with `resume: false`). |
| `sfx(id, { pitch, volume })` | Plays a sound effect. `pitch` is in semitones. Does nothing before `initAudio()`. |
| `startLoop(id, { fadeMs = 300 })` | Starts a looping sound (`crowd`, `wind`, `water_pour`, `timer_tick`). Starting one that's already running does nothing. |
| `stopLoop(id, fadeMs = 300)`, `stopAllLoops(fadeMs)` | Stops it; `0` is a dead stop. Loops keep going across map changes until stopped. |
| `setVolume(kind, v)`, `getVolume(kind)` | `kind` is `'master'`, `'music'`, or `'sfx'`; `v` is 0..1. Saved to `localStorage`. |
| `setMuted(bool)`, `isMuted()` | Mute everything. Saved to `localStorage`. |
| `setWrongness(amount)` | 0..1: how far the Wrongness has crept into the music (notes drift out of tune). |
| `currentMusic()` | Id of the playing (or requested) track, or `null`. |
| `MUSIC_IDS`, `SFX_IDS`, `LOOP_IDS` | All ids. |

**Music:** `title`, `cistern_court` (Cheryl's home theme; the opening at dusk), `moonrise` (the music box at the vista), `morning_after`, `wrongness` (a cue: use `playCue`), `stairs` (not yet assigned).

**Sound effects** (grouped and described in docs/audio-direction.md):
- interface: `blip`, `blip_cheryl`, `cursor`, `confirm`, `cancel`, `menu_open`, `menu_close`, `item_get`, `give`
- footsteps: `step` (= `step_stone`), `step_plaster`, `step_tile`, `step_rug`, `step_stairs`, `step_wood`, `step_kid`
- doors and movement: `door`, `door_open`, `door_close`, `bump`
- the opening's puzzles and people: `tap_squeak`, `tub_full`, `chess_tap`, `pepper_grind`, `sneeze`, `timer_ding`, `sheets_flap`, `kid_patter`, `kid_hop`, `piano_flat`, `splash`
- ambience: `swifts`, `dog_bark`, `gull`, `clock_strike`, `well_breath`
- the Wrongness: `wrong_sting`, `groan`, `crack`, `rattle`, `piano_tumble`, `drain`

**Loops:** `crowd`, `wind`, `water_pour`, `timer_tick`.

Suggested use:

- Text: one `blip` (or `blip_cheryl`) every two or three letters as text types out. They cut each other off, so more often is fine too.
- Footsteps: one per step (about every 250–300 ms walking), chosen by the tile underfoot: cobbles `step_stone`, the roof `step_plaster`, the flat's floor `step_tile`, the rug `step_rug`, any stair `step_stairs`.
- `item_get`, `wrong_sting`, `groan`, and `crack` dip the music by themselves.
- The moonrise: see the "moonrise sequence" on the dev page for an order and timings that match docs/design/01-opening.md.
- The audio context is suspended while the tab is hidden and resumed when it's visible again.
- Unknown ids throw here (the engine's bridge catches them), so typos show up immediately.

## Files

| File | Contents |
|---|---|
| `index.js` | public API, master mix, live scheduling clock, loops |
| `sequencer.js` | music notation parser, compiler, and timing (pure; tested in Node) |
| `player.js` | plays one compiled song: channels, fades, ducking, winding down |
| `synth.js` | voices: waveforms, envelopes, filters, one-shot layers, continuous beds, echo |
| `instruments.js` | the instrument palette and drum kit |
| `sfx.js`, `sfx-world.js` | sound effects: interface; footsteps, puzzles, ambience, the Wrongness |
| `music/` | songs, one module each, registered in `music/index.js` |
| `lint.js` | music lint: notes against declared chords, clashes, leaps, monotony (pure) |
| `offline.js` | offline rendering, levels, spectrum, and voice balance for tools and tests |

## Tests

- `node --test tests/audio/` — notation parsing, loop timing, harmony parsing, that every song compiles, uses real instruments, and passes the lint, and that every sound in the opening's design exists.
- `node tests/audio/lint-music.mjs [id] [--all]` — the lint report.
- `node tests/audio/check-audio.mjs [--screenshot out.png]` — loads the dev page in Chromium with Playwright, exercises the live API (music, crossfade, cue, wind-down, every effect and loop), renders everything offline, and fails on page errors, clipping, silence, a melody that isn't the loudest voice, a muddy or dull spectrum, or lint warnings. Pass `--playwright path/to/playwright/index.mjs` if Playwright isn't installed in the repo.

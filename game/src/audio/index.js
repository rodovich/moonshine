// Audio boundary. The engine calls only these four functions; the audio task
// replaces this stub with the real Web Audio synth. Unknown ids must be
// ignored quietly (content may name music before it exists).
//
//   unlockAudio()           called on the player's first key press or tap
//                           (browsers only allow audio after a user gesture)
//   playMusic(id)           start looping track `id`; no-op if already playing
//                           it; crossfading from the current track is up to you
//   stopMusic()             fade out / stop the current track
//   sfx(id)                 fire-and-forget sound effect
//
// Sound effect ids the engine itself uses (content may use any others):
//   'text'        one blip of the typewriter (NPC dialog), every few letters
//   'text_cheryl' same, for Cheryl's descriptions and thoughts
//   'cursor'      menu cursor moves
//   'select'      menu choice confirmed / inventory opens
//   'cancel'      menu closed / choice cancelled
//   'bump'        walking into a wall
//   'door'        map transition through an exit
//   'item'        an item was received (giveItem)
//   'step'        not used yet (reserved for footsteps)

let current = null;

export function unlockAudio() {}

export function playMusic(id) {
  current = id;
}

export function stopMusic() {
  current = null;
}

export function sfx(_id) {}

// For debugging and tests.
export function currentMusic() {
  return current;
}

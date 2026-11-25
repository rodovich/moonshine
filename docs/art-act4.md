# Art index: Act 4

Where to find the art for the "Art needed" list in [design/04-the-list.md](design/04-the-list.md) (on design/story-bible). References are `sheet:frame`; animated frames are listed by base name.

## Sprites and icons

Modules: `act4_sprites.js` (new), plus new frames in `act2_npcs.js` and `cheryl.js` (existing frames unchanged). Walks use the engine's names (`<dir>_0` stands, `_1`/`_2` step). On the dev page: `/dev/art.html?only=scene:act4_people`.

| Design | Frame(s) |
| --- | --- |
| The Clockmaker: standing in a doorway | `clockmaker:down_0` (walks `<dir>_0..2`) |
| The Clockmaker: running | `clockmaker:run_left_0/1`, `run_right_0/1`, `run_down_0/1` (play as a separate animation, or swap in with `setSprite`) |
| The Clockmaker: crouching over the sundial with his loupe | `clockmaker:crouch_right_0/1` (facing east; `crouch_left_*` facing west) |
| The Clockmaker arguing back | `clockmaker:argue_left_0/1`, `argue_right_0/1` |
| The Mayor arguing | `mayor:argue_left_0/1`, `argue_right_0/1` (new in `act2_npcs.js`) |
| Man on Bridge, looking down | `clockmaker` sheet with palette `bridge`: `look_down_0/1` (idle), `down_0` (no loupe in this swap) |
| Ambrose: standing; climbing the stairs | `ambrose:down_0..2`, `up_0..2` (new) |
| Ambrose: pulling the bell rope | `ambrose:ring_up_0` (hands high), `ring_up_1` (hauling down), `ring_up_2` (lifted on the upswing); seen from behind, with the rope in the frame above his hands |
| Ambrose: holding out the ledger | `ambrose:ledger_down` |
| Mott: sitting sober on the crates | `mott:sit_down_0/1`. His seat is about 8 px up, so draw him with `offset [0, -8]` on the crates |
| Mott: walking with the coil | `mott:coil_<dir>_0..2`; without it `mott:<dir>_0..2` |
| Movers on the mud, looking up | `mover:lookup_down` (`@big`, `@other`; new) |
| Crabs | `critters:crab_walk_0/1` (sideways), `crab_idle_0/1` (claws up) |
| A flopping fish | `critters:fish_flop_0/1` |
| The Kid running on mud | his run (`sweaty_kid:<dir>_1..4`) with `critters:mud_splash_0/1` at his feet |
| Cheryl: climbing a ladder | `cheryl:climb_up_0/1` |
| Cheryl: heaving on a valve | `cheryl:wheel_up_0/1` (hands on the rim, one high, one low, then swapped) |
| Cheryl: shoving a slab overhead | `cheryl:shove_up_0/1` |
| The teacup (Cheryl's flat) | `act4_props:teacup` (objects layer, on a table) |
| Copper coil and square jug icons | `items_act4:copper_coil`, `items_act4:square_jug` |

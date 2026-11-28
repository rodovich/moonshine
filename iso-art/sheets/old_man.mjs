// The Old Man at chess: thinking (chin on hand) and reaching for a piece,
// turning the pepper mill, sneezing, and talking. Seated, facing east.
import { frame, POST } from '../lib/jobs.mjs';
import { oldManSeated } from '../models/npcs.mjs';
import { facing } from '../models/figure.mjs';
import { union, move } from '../lib/sdf.mjs';

// The Old Man sits facing east (right) at the chess table; his stool is part of
// the court, so the sprite is just him, anchored where the stool stands.
const f = (name, pose, n) => frame(name, () => oldManSeated(pose, n), { post: POST.figure, shadow: true });

export default {
  name: 'old_man_seated',
  frames: () => [
    f('think_right_0', 'think'), f('think_right_1', 'reach'),
    f('mill_right_0', 'mill', 0), f('mill_right_1', 'mill', 1),
    f('sneeze_right_0', 'sneeze', 0), f('sneeze_right_1', 'sneeze', 1),
    f('talk_right_0', 'talk', 0), f('talk_right_1', 'talk', 1),
  ],
  anims: {
    think_right: { frames: ['think_right_0', 'think_right_1'], ms: [2600, 900] },
    mill_right: { frames: ['mill_right_0', 'mill_right_1'], ms: 250 },
    sneeze_right: { frames: ['sneeze_right_0', 'sneeze_right_1'], ms: [700, 400] },
    talk_right: { frames: ['talk_right_0', 'talk_right_1'], ms: 180 },
  },
};
void facing; void union; void move;

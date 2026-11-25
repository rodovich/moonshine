// The end of Act 2 (until Act 3 is built): Cheryl climbs down the hundredth
// step, the screen goes black, and a card reads MOONSHINE over "End of Act 2.
// Downstairs continues soon." Then the title screen.

import { drawText, drawTextCentered, measure } from '../../engine/text.js';

function endCard() {
  let title = null;
  return (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    if (!title) {
      title = document.createElement('canvas');
      title.width = measure('Moonshine') + 2;
      title.height = 11;
      drawText(title.getContext('2d'), 'Moonshine', 0, 0, { color: 'ui_select', shadow: 'ui_cheryl_box' });
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(title, Math.round(128 - title.width), 72, title.width * 2, title.height * 2);
    drawTextCentered(ctx, 'End of Act 2.', 128, 118, { color: 'ui_text' });
    drawTextCentered(ctx, 'Downstairs continues soon.', 128, 132, { color: 'ui_text' });
  };
}

export async function endOfAct(g) {
  g.stopMusic(1500);
  await g.fade('out', 1.5);
  // Saved standing beside the open step, so Continue doesn't drop her on the exit.
  await g.tween('player', { offset: [0, 0], seconds: 0, clipBelow: false });
  g.place('player', 10, 18, 'down');
  g.setFlag('act2.done');
  await g.showPicture(endCard(), { fade: 0 });
  await g.fade('in', 1);
  await g.wait(4);
  await g.fade('out', 1);
  await g.toTitle();
}

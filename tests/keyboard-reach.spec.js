// Every interactable thing must be reachable by keyboard: see
// tests/check-keyboard.mjs (also runnable on its own). This test runs the
// same check in every story state it knows and lists anything a player
// couldn't reach with the arrow keys and Z. It fails only with
// KEYBOARD_STRICT=1 for now, until the content tasks have fixed their maps;
// then it becomes strict for everyone.
import { test, expect } from '@playwright/test';
import { boot } from './helpers.js';
import { checkKeyboard } from './check-keyboard.mjs';

test('keyboard reachability: every interactable in every map and story state', async ({ page }) => {
  test.setTimeout(180000);
  await boot(page, '?map=cistern_court&x=3&y=6');
  const failures = await checkKeyboard(page);
  const lines = failures.map((f) => `${f.state} / ${f.map} / ${f.id}${f.at ? ` (${f.at})` : ''}: ${f.why}`);
  test.info().annotations.push({ type: 'keyboard-unreachable', description: `${lines.length}` });
  if (lines.length) console.log(`keyboard-unreachable:\n${lines.join('\n')}`);
  if (process.env.KEYBOARD_STRICT) expect(lines, 'interactables a keyboard player cannot reach').toEqual([]);
});

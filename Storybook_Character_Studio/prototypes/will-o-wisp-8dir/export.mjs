import { exportMonster } from '../shared/monster-export.mjs';
import { buildWillOWispSheet } from './character.mjs';

await exportMonster({
  id: 'will_o_wisp', name: '鬼火', role: 'WILL-O-WISP', build: buildWillOWispSheet,
  references: { a: 'assets/nonhumanoids/will_o_wisp_idle_a_8dir.png', b: 'assets/nonhumanoids/will_o_wisp_idle_b_8dir.png' },
  summary: 'Layered violet-to-orange flame · pale core · angry face · pose B flares and throws embers',
  // Flying: the game lifts it by yOffset. Variants: 瘴気の鬼火 (tint 0xb08ad0, scale .9), 炉喰らいの大鬼火 (tint 0xff6a3a, scale 2.6).
  runtime: { scale: .85, tint: 0xffffff, yOffset: .4, sharedBy: ['taint_wisp', 'great_will_o_wisp'] },
});

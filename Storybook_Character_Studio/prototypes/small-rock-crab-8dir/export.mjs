import { exportMonster } from '../shared/monster-export.mjs';
import { buildCrabSheet } from './character.mjs';

await exportMonster({
  id: 'small_rock_crab', studioFolder: 'small-rock-crab-8dir', name: '小岩ガニ', role: 'SMALL ROCK CRAB',
  build: buildCrabSheet,
  references: { a: 'small-rock-crab-4dir-v2.png', b: 'small-rock-crab-4dir-v2.png' },
  summary: 'Quarry crab / A: resting / B: raised pincers',
  runtime: { scale: 1, tint: 0xffffff, yOffset: 0 },
});

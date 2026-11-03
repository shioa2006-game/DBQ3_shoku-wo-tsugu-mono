import { exportMonster } from '../shared/monster-export.mjs';
import { buildGoatSheet } from './character.mjs';

await exportMonster({
  id: 'rockhorn_goat', studioFolder: 'rockhorn-goat-8dir', name: '岩角ヤギ', role: 'ROCKHORN GOAT',
  build: buildGoatSheet,
  references: { a: 'rockhorn-goat-4dir-v1.png', b: 'rockhorn-goat-4dir-v1.png' },
  summary: 'One four-view design reference / A: standing / B: head lowered and hooves braced',
  runtime: { scale: 1, tint: 0xffffff, yOffset: 0 },
});

import { exportMonster } from '../shared/monster-export.mjs';
import { buildVolcanoLizardSheet } from './character.mjs';

await exportMonster({
  id: 'volcano_lizard', name: '火山トカゲ', role: 'VOLCANO LIZARD', build: buildVolcanoLizardSheet,
  references: { a: 'assets/nonhumanoids/volcano_lizard_idle_a_8dir.png', b: 'assets/nonhumanoids/volcano_lizard_idle_b_8dir.png' },
  summary: 'Charcoal scales with glowing cracks · tail curling over the back · splayed clawed legs · pose B pushes up',
  runtime: { scale: .95, tint: 0xffffff, yOffset: 0 },
});

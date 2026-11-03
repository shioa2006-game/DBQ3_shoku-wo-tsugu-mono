import { exportMonster } from '../shared/monster-export.mjs';
import { buildArmoredScorpionSheet } from './character.mjs';

await exportMonster({
  id: 'armored_scorpion', name: '鉄甲サソリ', role: 'ARMORED SCORPION', build: buildArmoredScorpionSheet,
  references: { a: 'nonhumanoids/armored_scorpion_idle_a_8dir.png', b: 'nonhumanoids/armored_scorpion_idle_b_8dir.png' },
  summary: 'Iron-dark plates with red seams · heavy pincers · segmented tail and stinger · pose B rears the pincers up',
  runtime: { scale: 1.05, tint: 0xffffff, yOffset: 0 },
});

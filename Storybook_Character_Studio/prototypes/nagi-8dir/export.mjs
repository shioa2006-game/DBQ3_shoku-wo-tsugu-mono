import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildNagiSheet } from './character.mjs';
import { NAGI_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'nagi', name: 'ナギ', role: 'SHRINE MAIDEN', build: buildNagiSheet,
  reference: 'humanoids/shrine_keeper_body_8dir.png',
  summary: 'Long black hair with straight bangs · white robe with red under-collar · red hakama (redesigned as a shrine maiden)',
  rigColors: { sleeve: 0xf2ecdc, hand: 0xeec39a, pants: 0xa03024, boot: 0x3a2f26, headBack: 0x2b2b33, bodyBack: 0xd8d2c2 },
  rigTuning: NAGI_RIG_PROFILE,
  version: 2,
});

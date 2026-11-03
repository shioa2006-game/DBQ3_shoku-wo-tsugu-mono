import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildRokuSheet } from './character.mjs';
import { ROKU_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'roku', name: 'ロク', role: 'MINER', build: buildRokuSheet,
  reference: 'assets/humanoids/miner_body_8dir.png',
  summary: 'Spiky black hair · stubble and chin beard · black stand collar · leather vest with rust piping',
  rigColors: { sleeve: 0x5c5a52, hand: 0xd0a074, pants: 0x4f4436, boot: 0x332b20, headBack: 0x44403a, bodyBack: 0x4a483f },
  rigTuning: ROKU_RIG_PROFILE,
});

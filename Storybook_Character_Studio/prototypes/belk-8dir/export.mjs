import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildBelkSheet } from './character.mjs';
import { BELK_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'belk', name: 'ベルク', role: 'BLACKSMITH', build: buildBelkSheet,
  reference: 'humanoids/blacksmith_body_8dir.png',
  summary: 'Tousled brown hair · short full beard · burgundy stand collar · leather jerkin · iron buckle',
  rigColors: { sleeve: 0x6b3a26, hand: 0xc98f66, pants: 0x4a4440, boot: 0x2e2a26, headBack: 0x3a332e, bodyBack: 0x54301f },
  rigTuning: BELK_RIG_PROFILE,
  version: 2,
});

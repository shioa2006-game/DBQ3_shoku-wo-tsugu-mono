import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildYomogiSheet } from './character.mjs';
import { YOMOGI_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'yomogi', name: 'ヨモギ', role: 'HERBALIST', build: buildYomogiSheet,
  reference: 'assets/humanoids/herbalist_body_8dir.png',
  summary: 'Silver hair in a low bun · green leaf headscarf · round spectacles · cream vest over a green shirt',
  rigColors: { sleeve: 0x6a7a4a, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x5a6a42, bodyBack: 0xcfc4a4 },
  rigTuning: YOMOGI_RIG_PROFILE,
});

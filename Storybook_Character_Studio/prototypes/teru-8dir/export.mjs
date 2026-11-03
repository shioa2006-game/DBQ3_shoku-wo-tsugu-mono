import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildTeruSheet } from './character.mjs';
import { TERU_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'teru', name: 'テル', role: 'KILN WORKER', build: buildTeruSheet,
  reference: 'assets/humanoids/volcano_villager_body_8dir.png',
  summary: 'Choppy brown bob · rust headband · freckles and soot · olive work clothes (new design; reference is the shared townsperson sheet)',
  rigColors: { sleeve: 0x6b6b3b, hand: 0xeec39a, pants: 0x4f4436, boot: 0x332b20, headBack: 0x3c2618, bodyBack: 0x565626 },
  rigTuning: TERU_RIG_PROFILE,
});

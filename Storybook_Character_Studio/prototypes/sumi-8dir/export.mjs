import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildSumiSheet } from './character.mjs';
import { SUMI_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'sumi', name: 'スミ', role: 'TOWNSWOMAN', build: buildSumiSheet,
  reference: 'assets/humanoids/volcano_villager_body_8dir.png',
  summary: 'Greying hair in a top bun with a comb · slate-blue kimono · indigo sash · work apron (new design; reference is the shared townsperson sheet)',
  rigColors: { sleeve: 0x4b5c6e, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x3c2e26, bodyBack: 0x3c4a58 },
  rigTuning: SUMI_RIG_PROFILE,
});

import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildKayaSheet } from './character.mjs';
import { KAYA_RIG_PROFILE } from './rig-profile.mjs';

await exportHumanoid({
  id: 'kaya', name: 'カヤ', role: 'TOWNSWOMAN', build: buildKayaSheet,
  reference: 'humanoids/volcano_villager_body_8dir.png',
  summary: 'Centre-parted brown hair with a low bun · mustard short coat · blue kimono · sash bow',
  rigColors: { sleeve: 0x4d6d98, hand: 0xeec39a, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x3e2618, bodyBack: 0xa7782a },
  rigTuning: KAYA_RIG_PROFILE,
});

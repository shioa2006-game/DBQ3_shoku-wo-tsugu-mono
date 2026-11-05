import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { buildHero2Sheet } from './character.mjs';
import { HERO2_RIG_PROFILE } from './rig-profile.mjs';

// 主人公の新デザイン案。本編へは書き出さない（採用が決まったら game-targets.mjs と本編の読込先を切り替える）。
await exportHumanoid({
  id: 'hero2', name: '主人公（新デザイン案）', role: 'HERO REDESIGN', build: buildHero2Sheet, studioOnly: true,
  reference: 'hero-redesign-4dir-v1.png',
  summary: 'Fluffy golden hair · blue eyes · cream capelet · navy tunic · belt pouch · hardcover book carried on a small backpack',
  rigColors: { sleeve: 0x2f4b95, hand: 0xf8d0a6, pants: 0x4a3226, boot: 0x8a5630, headBack: 0xd9a020, bodyBack: 0x6e4526 },
  rigTuning: HERO2_RIG_PROFILE,
});

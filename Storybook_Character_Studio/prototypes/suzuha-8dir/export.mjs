import { buildKayaSheet } from '../kaya-8dir/character.mjs';
import { writeFile } from 'node:fs/promises';
import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { studioBoards } from '../shared/studio-reference-boards.mjs';
import { buildSuzuhaSheet } from './character.mjs';
import { SUZUHA_RIG_PROFILE, SUZUHA_RIG_COLORS } from './rig-profile.mjs';
await exportHumanoid({
  id: 'suzuha', name: 'スズハ', role: '元水汲み役・神殿の世話役候補', build: buildSuzuhaSheet,
  reference: 'suzuha-8dir-v2.png', keepDrawnX: true, version: 2,
  summary: '栗色の髪とこめかみの白髪、低いお団子と黄土色のリボン。くすんだ紫の作業着、生成りの前掛け、青灰色の腰布と左腰の手ぬぐい。',
  rigColors: SUZUHA_RIG_COLORS, rigTuning: SUZUHA_RIG_PROFILE,
  boards: data => studioBoards({ version: 2, eyeReference: { name: 'カヤ', build: buildKayaSheet }, name: 'スズハ', referenceScale: .274, build: buildSuzuhaSheet }, data),
});
await writeFile(new URL('./output/suzuha-detail.svg', import.meta.url), buildSuzuhaSheet({ cellSize: 512 }));

import { buildRokuSheet } from '../roku-8dir/character.mjs';
import { writeFile } from 'node:fs/promises';
import { exportHumanoid } from '../shared/humanoid-export.mjs';
import { studioBoards } from '../shared/studio-reference-boards.mjs';
import { buildGanzouSheet } from './character.mjs';
import { GANZOU_RIG_PROFILE, GANZOU_RIG_COLORS } from './rig-profile.mjs';
await exportHumanoid({
  id: 'ganzou', name: 'ガンゾウ', role: '石切り職人', build: buildGanzouSheet,
  reference: 'ganzou-8dir-v2.png', studioOnly: true, keepDrawnX: true, version: 2,
  summary: '短い銀髪、茶色の鉢巻き、太い灰色の眉と口ひげ。灰色の作業着と革の前掛け、左腰の石工用工具。',
  rigColors: GANZOU_RIG_COLORS, rigTuning: GANZOU_RIG_PROFILE,
  boards: data => studioBoards({ version: 2, eyeReference: { name: 'ロク', build: buildRokuSheet }, name: 'ガンゾウ', build: buildGanzouSheet }, data),
});
await writeFile(new URL('./output/ganzou-detail.svg', import.meta.url), buildGanzouSheet({ cellSize: 512 }));

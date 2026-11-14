import { exportMonster } from '../shared/monster-export.mjs';
import { buildFlightSheet, buildGroundSheet, buildHeavyGroundSheet } from './character.mjs';

for (const [mode,build,reference,summary] of [
  ['flight',buildFlightSheet,'gargoyle-flight-4dir-v1.png','A: wings raised / B: downstroke'],
  ['ground',buildGroundSheet,'gargoyle-landed-v2.png','Folded wings / A and B: alternate steps'],
]) {
  await exportMonster({
    id: 'gargoyle_'+mode, name: 'ガーゴイル', role: mode.toUpperCase(), studioFolder:'gargoyle-8dir',
    build, references:{a:reference,b:reference}, summary, reportPrefix: mode+'-',
    runtime:{scale:1,tint:0xffffff,yOffset:mode==='flight'?.4:0},
  });
}

await exportMonster({
  id:'gargoyle_heavy_ground', name:'岩砕きのガーゴイル', role:'静止造形・試作01', studioFolder:'gargoyle-8dir',
  build:buildHeavyGroundSheet,
  references:{a:'gargoyle-landed-v2.png',b:'gargoyle-landed-v2.png'},
  summary:'肩・胸・前腕を厚くした地上静止姿勢。A/Bは同一。飛行・攻撃は未制作。', reportPrefix:'heavy-ground-',
  runtime:{scale:1,tint:0xffffff,yOffset:0},
});

import { exportMonster } from '../shared/monster-export.mjs';
import { buildFlightSheet, buildGroundSheet, buildHeavyGroundSheet, buildHeavyFlightSheet, buildHeavyAttackSheet } from './character.mjs';

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
  summary:'地上の静止姿勢。A/Bは同一。体は1.3倍、頭部は通常型と同じ表示サイズ。', reportPrefix:'heavy-ground-',
  runtime:{scale:1.3,tint:0xffffff,yOffset:0},
});

for(const [mode,build,reference,summary] of [
  ['flight',buildHeavyFlightSheet,'gargoyle-flight-4dir-v1.png','A：翼を上げる / B：翼を打ち下ろす。足を後ろへ引いた飛行姿勢。'],
  ['attack',buildHeavyAttackSheet,'gargoyle-landed-v2.png','A：両腕を振りかぶる / B：前へ踏ん張って振り下ろす。壁破壊の攻撃姿勢。'],
]) {
  await exportMonster({
    id:'gargoyle_heavy_'+mode,name:'岩砕きのガーゴイル',role:mode==='flight'?'飛行':'壁砕き',studioFolder:'gargoyle-8dir',
    build,references:{a:reference,b:reference},summary,reportPrefix:'heavy-'+mode+'-',
    runtime:{scale:1.3,tint:0xffffff,yOffset:mode==='flight'?.4:0,
      ...(mode==='attack'?{interval:null,frameDurations:{a:.75,b:.35}}:{})},
  });
}

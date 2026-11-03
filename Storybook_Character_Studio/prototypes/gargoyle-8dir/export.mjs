import { exportMonster } from '../shared/monster-export.mjs';
import { buildFlightSheet, buildGroundSheet } from './character.mjs';

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

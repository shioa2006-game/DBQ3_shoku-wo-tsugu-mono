import { exportDragon } from '../shared/dragon-export.mjs';
import { buildVarugaHeadSheet, buildVarugaBodySheet, buildVarugaOpenHeadSheet } from './character.mjs';
import { VARUGA_PROFILE } from './rig-profile.mjs';
import { MOTIONS } from './motion.mjs';

await exportDragon({
  id: 'varuga', name: '三頭魔竜ヴァルガ', role: 'THREE-HEADED DRAGON', studioFolder: 'varuga-8dir',
  sheets: {
    head: { build: buildVarugaHeadSheet, reference: 'dragons/grom_head_8dir.png' },
    body: { build: buildVarugaBodySheet, reference: 'dragons/grom_body_8dir.png' },
    head_open: { build: buildVarugaOpenHeadSheet, reference: 'dragons/grom_head_8dir.png' },
  },
  summary: 'Grom-derived study / red copper scales, gold plates, silver horns / provisional palette',
  runtime: { ...VARUGA_PROFILE, class: 'VarugaRig extends DragonRig', rig: '../rig.js', config: '../rig-profile.mjs', motions: MOTIONS, paletteStatus: 'provisional' },
});

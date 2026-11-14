import { exportDragon } from '../shared/dragon-export.mjs';
import { buildVarugaHeadSheet, buildVarugaBodySheet } from './character.mjs';
import { VARUGA_PROFILE } from './rig-profile.mjs';

await exportDragon({
  id: 'varuga', name: '三頭魔竜ヴァルガ', role: 'THREE-HEADED DRAGON', studioFolder: 'varuga-8dir',
  sheets: {
    head: { build: buildVarugaHeadSheet, reference: 'dragons/grom_head_8dir.png' },
    body: { build: buildVarugaBodySheet, reference: 'dragons/grom_body_8dir.png' },
  },
  summary: 'Grom-derived study / violet scales, antique gold plates, ivory horns / provisional palette',
  runtime: { ...VARUGA_PROFILE, class: 'VarugaRig extends DragonRig', rig: '../rig.js', neckSegments: 18, config: '../rig-profile.mjs', paletteStatus: 'provisional' },
});

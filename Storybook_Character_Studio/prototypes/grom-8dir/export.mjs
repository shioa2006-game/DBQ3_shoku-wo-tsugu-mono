import { exportDragon } from '../shared/dragon-export.mjs';
import { buildGromHeadSheet, buildGromBodySheet } from './character.mjs';

await exportDragon({
  id: 'grom', name: '瘴泉竜グロム', role: 'TWO-HEADED DRAGON', sheets: {
    head: { build: buildGromHeadSheet, reference: 'dragons/grom_head_8dir.png' },
    body: { build: buildGromBodySheet, reference: 'dragons/grom_body_8dir.png' },
  },
  summary: 'Navy scales · tan jaw and belly plates · grey horns and back spikes · amber eyes (neck, wings and tail are 3D in the game)',
  runtime: { headScale: 1.5, bodyScale: 1.6, heads: 2, config: 'src/entities/dragon-configs.js GROM_CONFIG' },
});

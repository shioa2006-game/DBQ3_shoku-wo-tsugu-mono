import * as THREE from 'three';
import { DragonRig } from '../../games/ch4-5/src/entities/dragon.js';
import { VARUGA_CONFIG } from './rig-profile.mjs';

// 長い中央の首にも隙間が出ないよう、首の分割数だけをStudio側で増やす。
// 頭・首・翼・尾の配置と動きは既存DragonRigの処理を使う。
export class VarugaRig extends DragonRig {
  constructor(config = VARUGA_CONFIG) {
    super(config);
    for (const head of this.heads) {
      const material = head.neck[0].material;
      for (const segment of head.neck) {
        this.group.remove(segment);
        segment.geometry.dispose();
      }
      head.neck = Array.from({ length: 18 }, (_, i) => {
        const radius = (.24 - (i / 17) * .09) * config.headScale;
        const segment = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), material);
        this.group.add(segment);
        return segment;
      });
    }
  }
}

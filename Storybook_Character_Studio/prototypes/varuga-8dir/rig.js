import * as THREE from 'three';
import { DragonRig } from '../../games/ch4-5/src/entities/dragon.js';
import { VARUGA_CONFIG } from './rig-profile.mjs';

// グロムの動きを継承し、ヴァルガの立ち上がった三本の首と赤銅の質感を追加。
export class VarugaRig extends DragonRig {
  constructor(config = VARUGA_CONFIG) {
    super(config);
    const originalMaterial = this.heads[0].neck[0].material;
    const metal = new THREE.MeshPhongMaterial({ color: config.neckColor, ...config.metal });
    for (const segment of this.tail) segment.material = metal;
    const wingBones = new THREE.MeshPhongMaterial({ color: config.wings.boneColor, ...config.metal });
    const oldBones = new Set();
    for (const wing of this.wings) wing.mesh.traverse(mesh => {
      if (mesh.isMesh && mesh.material.side !== THREE.DoubleSide) {
        oldBones.add(mesh.material); mesh.material = wingBones;
      }
    });
    oldBones.forEach(material => material.dispose());
    for (const head of this.heads) {
      for (const segment of head.neck) {
        this.group.remove(segment);
        segment.geometry.dispose();
      }
      head.neck = Array.from({ length: config.neckSegments }, (_, i) => {
        const radius = (.24 - (i / (config.neckSegments - 1)) * .12) * config.headScale;
        const segment = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), metal);
        this.group.add(segment);
        return segment;
      });
    }
    originalMaterial.dispose();
  }

  update(dt, origin, cameraYaw, moving) {
    super.update(dt, origin, cameraYaw, moving);
    const { fx, fz, rx, rz } = this.basis();
    const c = this.config;
    const away = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    for (let i = 0; i < this.heads.length; i++) {
      const head = this.heads[i], mount = c.heads[i];
      const base = new THREE.Vector3(origin.x + rx * mount.side * .15,
        this.body.group.position.y + .92 * c.bodyScale, origin.z + rz * mount.side * .15);
      // 頭はカメラへ向いた平面。後頭部への横ずれだけを画像面に投影し、
      // 奥行きは首先の半径ぶん確保する（固定の .1 では球面が頭を突き抜ける）。
      const back = new THREE.Vector3(-fx, 0, -fz);
      back.addScaledVector(away, -back.dot(away));
      const tipRadius = head.neck.at(-1).geometry.parameters.radius;
      const end = head.sprite.group.position.clone().addScaledVector(back, .22 * c.headScale);
      end.y += .20 * c.headScale;
      end.addScaledVector(away, tipRadius + .06);
      const lower = base.clone().add(new THREE.Vector3(rx * mount.side * .12, .85, rz * mount.side * .12));
      const upper = end.clone().add(new THREE.Vector3(0, -.75, 0));
      const curve = new THREE.CubicBezierCurve3(base, lower, upper, end);
      head.neck.forEach((segment, j) => {
        const t = j / (head.neck.length - 1);
        segment.position.copy(curve.getPoint(t));
        // 接続付近の太い節も画像の裏へ収める。下側から滑らかに補正する。
        const blend = THREE.MathUtils.smoothstep(t, .45, .65);
        const depth = segment.position.clone().sub(head.sprite.group.position).dot(away);
        const clearance = segment.geometry.parameters.radius + .06;
        segment.position.addScaledVector(away, Math.max(0, clearance - depth) * blend);
      });
    }
  }
}

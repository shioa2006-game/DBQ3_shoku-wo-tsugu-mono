import * as THREE from 'three';
import { DragonRig } from '../../games/ch4-5/src/entities/dragon.js';
import { VARUGA_CONFIG } from './rig-profile.mjs';
import { MOTIONS, sampleMotion } from './motion.mjs';

// グロムの動きを継承し、ヴァルガの立ち上がった三本の首と赤銅の質感を追加。
export class VarugaRig extends DragonRig {
  constructor(config = VARUGA_CONFIG) {
    super(config);
    this.motion = 'flight'; this.motionTime = 0;
    this.poseState = sampleMotion(this.motion, 0);
    this.openHeadTexture = new THREE.TextureLoader().load(config.openHeadUrl);
    this.openHeadTexture.colorSpace = THREE.SRGBColorSpace;
    this.openHeadTexture.minFilter = THREE.LinearFilter;
    this.openHeadTexture.magFilter = THREE.LinearFilter;
    this.openHeadTexture.generateMipmaps = false;
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
      head.openTexture = this.openHeadTexture.clone();
      head.flame.particles.forEach(p => { p.sprite.material.blending = THREE.NormalBlending; });
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

  setMotion(mode) {
    if (!MOTIONS[mode]) throw new Error(`Unknown motion: ${mode}`);
    this.motion = mode; this.motionTime = 0; this.poseState = sampleMotion(mode, 0);
  }

  headWorldPos(i, origin) {
    const target = super.headWorldPos(i, origin);
    const pose = this.poseState;
    if (!pose) return target;
    const { fx, fz, rx, rz } = this.basis();
    const mount = this.config.heads[i], action = pose.heads[i];
    const forward = action.forward - (i === 1 ? 0 : .3) * pose.grounded, lateral = -mount.side * .18 * pose.grounded;
    target.x += fx * forward + rx * lateral;
    target.z += fz * forward + rz * lateral;
    target.y += ((i === 1 ? 4.65 : 4.1) - mount.up) * pose.grounded - action.down - pose.compression;
    return target;
  }

  update(dt, origin, cameraYaw, moving) {
    this.motionTime += dt;
    this.poseState = sampleMotion(this.motion, this.motionTime);
    const pose = this.poseState, ground = pose.grounded;
    const c = this.config;
    const bodyHeight = c.bodyScale * (1 - .06 * ground - pose.compression);
    // origin は従来同様、浮遊時の胴の基準。床は hover 分だけ下。
    const floorY = origin.y - c.hover;
    const bob = Math.sin((this.time + dt) * 1.4) * .22;
    const bodyY = THREE.MathUtils.lerp(origin.y + bob, floorY - .032 * bodyHeight, ground);
    const adjustedOrigin = origin.clone(); adjustedOrigin.y = bodyY - bob;
    super.update(dt, adjustedOrigin, cameraYaw, moving);
    this.body.mesh.scale.y = bodyHeight; this.body.mesh.position.y = bodyHeight / 2;
    const { fx, fz, rx, rz } = this.basis();
    for (const wing of this.wings) {
      const dx = rx * wing.side * .3 - fx * .954, dz = rz * wing.side * .3 - fz * .954;
      const foldedYaw = Math.atan2(-dz, dx);
      const delta = Math.atan2(Math.sin(foldedYaw - wing.pivot.rotation.y), Math.cos(foldedYaw - wing.pivot.rotation.y));
      wing.pivot.rotation.y += delta * ground;
      wing.pivot.position.y = bodyY + .75 * bodyHeight;
      wing.pivot.position.x -= fx * .18 * ground; wing.pivot.position.z -= fz * .18 * ground;
      wing.flapGroup.rotation.z = THREE.MathUtils.lerp(wing.flapGroup.rotation.z, -.08, ground);
      wing.mesh.rotation.x = Math.PI / 4 * wing.side * (1 - ground);
      wing.mesh.scale.set(1 - .4 * ground, 1 - .65 * ground, 1);
    }
    for (const segment of this.tail) {
      const minimum = floorY + segment.geometry.parameters.radius + .025;
      segment.position.y = THREE.MathUtils.lerp(segment.position.y, Math.max(minimum, segment.position.y + .35), ground);
    }
    const away = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    for (let i = 0; i < this.heads.length; i++) {
      const head = this.heads[i], mount = c.heads[i];
      const base = new THREE.Vector3(origin.x + rx * mount.side * .15,
        this.body.group.position.y + .92 * bodyHeight, origin.z + rz * mount.side * .15);
      head.openTexture.offset.copy(head.sprite.texA.offset);
      head.openTexture.repeat.copy(head.sprite.texA.repeat);
      // 画像がロードされてから差し替える。UV・倍率・頭の位置は同じ。
      if (this.openHeadTexture.image && head.openTexture.image !== this.openHeadTexture.image) {
        head.openTexture.image = this.openHeadTexture.image; head.openTexture.needsUpdate = true;
      }
      head.sprite.material.map = pose.heads[i].mouth && head.openTexture.image ? head.openTexture : head.sprite.texA;
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
      this.drawFlame(head, pose.heads[i], i, fx, fz, rx, rz);
    }
  }

  drawFlame(head, action, index, fx, fz, rx, rz) {
    const flame = head.flame, scale = this.config.headScale;
    const mouth = head.sprite.group.position.clone().add(new THREE.Vector3(fx * .4 * scale, .17 * scale, fz * .4 * scale));
    const active = !head.dead && action.flame;
    flame.glow.visible = !!active; flame.light.visible = !!active;
    flame.glow.position.copy(mouth); flame.light.position.copy(mouth);
    flame.glow.scale.setScalar(active === 'fire' ? .3 : .22 + .06 * Math.sin(this.motionTime * 12));
    flame.glow.material.opacity = .6;
    flame.light.intensity = active === 'fire' ? 3 : 1;
    // 既存の粒子プールを、時刻から再現できる軌道で描く。停止・コマ送りでも形が変わらない。
    flame.particles.forEach((particle, j) => {
      const seed = Math.sin(j * 17.31 + index * 4.17) * .5 + .5;
      const life = .46 + seed * .18;
      const elapsed = action.fireTime - j * .012;
      particle.sprite.visible = active === 'fire' && elapsed >= 0;
      if (!particle.sprite.visible) return;
      const u = (elapsed % life) / life, distance = u * (3.3 + seed * 1.1);
      const spread = Math.sin(j * 5.13) * u * .45;
      particle.sprite.position.copy(mouth).add(new THREE.Vector3(
        fx * distance + rx * spread, -(this.motion === 'air_flame' ? .45 : .18) * distance + u * u * .2 + Math.cos(j * 4.1) * u * .18,
        fz * distance + rz * spread));
      particle.sprite.scale.setScalar(.18 + u * .8);
      particle.sprite.material.color.setHex(u < .22 ? 0xfff2b3 : u < .65 ? 0xff9a28 : 0xe74714);
      particle.sprite.material.opacity = (1 - u) * .7;
    });
  }
}

import * as THREE from "three";
import { B } from "./blocks.js";
import { WORLD } from "./world.js";
import { cellKey } from "../core/utils.js";

// Prop blocks are rendered as individual little meshes. Builders return a group
// whose origin sits at the cell's min corner ground center (x+0.5, y, z+0.5).

const MAT = {
  wood: new THREE.MeshToonMaterial({ color: 0x8a5a2c }),
  woodDark: new THREE.MeshToonMaterial({ color: 0x5f3d1c }),
  plank: new THREE.MeshToonMaterial({ color: 0xc99c5f }),
  straw: new THREE.MeshToonMaterial({ color: 0xc2a557 }),
  strawDark: new THREE.MeshToonMaterial({ color: 0x96793a }),
  stone: new THREE.MeshToonMaterial({ color: 0x8b9196 }),
  basalt: new THREE.MeshToonMaterial({ color: 0x4a4a50 }),
  steel: new THREE.MeshToonMaterial({ color: 0xaeb6bb }),
  iron: new THREE.MeshToonMaterial({ color: 0x5d6166 }),
  red: new THREE.MeshToonMaterial({ color: 0xc23b2a }),
  white: new THREE.MeshToonMaterial({ color: 0xf2ecdc }),
  green: new THREE.MeshToonMaterial({ color: 0x4c9440 }),
  greenDark: new THREE.MeshToonMaterial({ color: 0x356b2b }),
  gold: new THREE.MeshToonMaterial({ color: 0xd9b545 }),
  copper: new THREE.MeshToonMaterial({ color: 0xc97b3f }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  ember: new THREE.MeshBasicMaterial({ color: 0xff7a3d }),
  wisp: new THREE.MeshBasicMaterial({ color: 0x9fd8ff }),
  glow: new THREE.MeshBasicMaterial({ color: 0x9fd8ff }),
  cloth: new THREE.MeshToonMaterial({ color: 0x2f5db0, side: THREE.DoubleSide }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cylinder(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

function cone(r, h, mat, x = 0, y = 0, z = 0, seg = 6) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

const BUILDERS = {
  [B.FENCE](world, x, y, z) {
    const g = new THREE.Group();
    g.add(box(0.14, 0.95, 0.14, MAT.wood, 0, 0.475, 0));
    const link = (dx, dz) => {
      const nid = world.get(x + dx, y, z + dz);
      if (nid === B.FENCE || nid === B.DOOR) {
        g.add(box(dx !== 0 ? 0.5 : 0.09, 0.09, dz !== 0 ? 0.5 : 0.09, MAT.woodDark, dx * 0.25, 0.72, dz * 0.25));
        g.add(box(dx !== 0 ? 0.5 : 0.09, 0.09, dz !== 0 ? 0.5 : 0.09, MAT.woodDark, dx * 0.25, 0.38, dz * 0.25));
      }
    };
    link(1, 0); link(-1, 0); link(0, 1); link(0, -1);
    return g;
  },
  [B.HELM]() {
    // 舵輪: 台座柱＋8本スポークの輪＋銅のハブ（第3章で直した船の舵）。
    const g = new THREE.Group();
    g.add(box(0.16, 0.55, 0.16, MAT.woodDark, 0, 0.275, 0));
    const wheel = new THREE.Group();
    wheel.position.set(0, 0.74, 0);
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 18), MAT.wood));
    for (let i = 0; i < 4; i += 1) {
      const spoke = box(0.05, 0.78, 0.05, MAT.plank, 0, 0, 0);
      spoke.rotation.z = (i * Math.PI) / 4;
      wheel.add(spoke);
    }
    const hub = cylinder(0.08, 0.08, 0.1, MAT.copper, 0, 0, 0);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    g.add(wheel);
    return g;
  },
  [B.SPIKES]() {
    const g = new THREE.Group();
    g.add(box(0.9, 0.06, 0.9, MAT.woodDark, 0, 0.03, 0));
    for (const [dx, dz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0]]) {
      g.add(cone(0.09, 0.34, MAT.steel, dx, 0.23, dz));
    }
    return g;
  },
  [B.TORCH]() {
    const g = new THREE.Group();
    g.add(box(0.09, 0.62, 0.09, MAT.wood, 0, 0.31, 0));
    const flame = cone(0.12, 0.24, MAT.flame, 0, 0.72, 0);
    flame.name = "flame";
    g.add(flame);
    g.userData.torch = true;
    return g;
  },
  [B.MINE_LAMP]() {
    // 坑道灯: 鬼火のかけらを封じた青白い吊り灯。
    const g = new THREE.Group();
    g.add(box(0.1, 0.72, 0.1, MAT.woodDark, 0, 0.36, 0));
    g.add(box(0.34, 0.06, 0.1, MAT.woodDark, 0.12, 0.72, 0));
    const cage = box(0.2, 0.26, 0.2, MAT.iron, 0.26, 0.56, 0);
    g.add(cage);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), MAT.wisp);
    flame.position.set(0.26, 0.56, 0);
    flame.name = "flame";
    g.add(flame);
    g.userData.torch = true;
    return g;
  },
  [B.DOOR]() {
    const g = new THREE.Group();
    const frame = new THREE.Group();
    frame.add(box(0.1, 1.9, 0.12, MAT.woodDark, -0.45, 0.95, 0));
    frame.add(box(0.1, 1.9, 0.12, MAT.woodDark, 0.45, 0.95, 0));
    frame.add(box(1.0, 0.1, 0.12, MAT.woodDark, 0, 1.9, 0));
    const hinge = new THREE.Group();
    hinge.position.set(-0.4, 0, 0);
    const panel = box(0.8, 1.8, 0.08, MAT.plank, 0.4, 0.9, 0);
    panel.add(box(0.1, 0.1, 0.12, MAT.woodDark, 0.28, 0.05, 0));
    hinge.add(panel);
    hinge.name = "hinge";
    g.add(frame, hinge);
    g.userData.door = true;
    return g;
  },
  [B.WORKBENCH]() {
    const g = new THREE.Group();
    g.add(box(0.95, 0.12, 0.75, MAT.plank, 0, 0.62, 0));
    for (const [dx, dz] of [[-0.38, -0.28], [0.38, -0.28], [-0.38, 0.28], [0.38, 0.28]]) {
      g.add(box(0.1, 0.62, 0.1, MAT.woodDark, dx, 0.31, dz));
    }
    g.add(box(0.28, 0.1, 0.2, MAT.steel, -0.2, 0.73, 0.1));
    g.add(cylinder(0.04, 0.04, 0.3, MAT.wood, 0.15, 0.72, -0.12).rotateZ(Math.PI / 2.4));
    return g;
  },
  [B.CHEST]() {
    const g = new THREE.Group();
    g.add(box(0.88, 0.52, 0.72, MAT.wood, 0, 0.26, 0));
    g.add(box(0.94, 0.14, 0.78, MAT.plank, 0, 0.59, 0));
    g.add(box(0.08, 0.68, 0.8, MAT.woodDark, -0.32, 0.34, 0));
    g.add(box(0.08, 0.68, 0.8, MAT.woodDark, 0.32, 0.34, 0));
    g.add(box(0.18, 0.16, 0.08, MAT.gold, 0, 0.44, -0.4));
    return g;
  },
  [B.BED]() {
    const g = new THREE.Group();
    g.add(box(0.92, 0.18, 0.6, MAT.straw, 0, 0.14, 0));
    g.add(box(0.92, 0.08, 0.6, MAT.strawDark, 0, 0.04, 0));
    g.add(box(0.26, 0.12, 0.4, MAT.white, -0.28, 0.28, 0));
    return g;
  },
  [B.CROP1]() {
    const g = new THREE.Group();
    for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2]]) {
      g.add(box(0.05, 0.28, 0.05, MAT.green, dx, 0.14, dz));
    }
    g.userData.sway = true;
    return g;
  },
  [B.CROP2]() {
    const g = new THREE.Group();
    for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2], [0, 0]]) {
      g.add(box(0.06, 0.55, 0.06, MAT.greenDark, dx, 0.27, dz));
      g.add(box(0.14, 0.1, 0.14, MAT.green, dx, 0.58, dz));
    }
    g.userData.sway = true;
    return g;
  },
  [B.CROP3]() {
    const g = new THREE.Group();
    // 火山穀物: 赤金色の穂が重く垂れる。
    for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2], [0, 0]]) {
      g.add(box(0.06, 0.7, 0.06, MAT.straw, dx, 0.35, dz));
      const head = box(0.12, 0.22, 0.12, MAT.copper, dx + 0.06, 0.74, dz);
      head.rotation.z = -0.5;
      g.add(head);
    }
    g.userData.sway = true;
    return g;
  },
  [B.ALTAR]() {
    const g = new THREE.Group();
    g.add(box(0.95, 0.3, 0.95, MAT.stone, 0, 0.15, 0));
    g.add(box(0.7, 0.3, 0.7, MAT.stone, 0, 0.45, 0));
    g.add(box(0.5, 0.12, 0.5, MAT.white, 0, 0.66, 0));
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), MAT.glow);
    orb.position.y = 0.92;
    orb.name = "orb";
    g.add(orb);
    return g;
  },
  [B.TORII]() {
    const g = new THREE.Group();
    g.add(cylinder(0.09, 0.11, 1.9, MAT.red, -0.55, 0.95, 0));
    g.add(cylinder(0.09, 0.11, 1.9, MAT.red, 0.55, 0.95, 0));
    const top = box(1.7, 0.14, 0.18, MAT.red, 0, 1.95, 0);
    top.rotation.z = 0;
    g.add(top);
    g.add(box(1.4, 0.1, 0.14, MAT.red, 0, 1.62, 0));
    g.add(box(1.76, 0.08, 0.2, MAT.woodDark, 0, 2.05, 0));
    return g;
  },
  [B.BANNER]() {
    const g = new THREE.Group();
    g.add(cylinder(0.05, 0.06, 2.2, MAT.woodDark, 0, 1.1, 0));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), MAT.gold).translateY(2.24));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 6, 1), MAT.cloth);
    flag.position.set(0.48, 1.85, 0);
    flag.name = "flag";
    g.add(flag);
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), MAT.gold);
    emblem.position.set(0.48, 1.85, 0.012);
    emblem.name = "emblem";
    g.add(emblem);
    g.userData.banner = true;
    return g;
  },
  [B.BUSH]() {
    const g = new THREE.Group();
    for (const [dx, dz, s] of [[-0.15, -0.1, 1], [0.18, 0.05, 0.8], [0, 0.16, 0.9]]) {
      g.add(cone(0.16 * s, 0.42 * s, MAT.straw, dx, 0.21 * s, dz, 5));
    }
    return g;
  },
  [B.KAMADO]() {
    const g = new THREE.Group();
    // 石積みの竈: 胴体 + 焚き口 + 羽釜 + ゆらめく炎。
    g.add(box(0.9, 0.55, 0.8, MAT.stone, 0, 0.275, 0));
    g.add(box(0.96, 0.1, 0.86, MAT.stone, 0, 0.6, 0));
    g.add(box(0.34, 0.26, 0.06, MAT.woodDark, 0, 0.16, -0.39)); // 焚き口
    const flame = cone(0.1, 0.18, MAT.flame, 0, 0.2, -0.34);
    flame.name = "flame";
    g.add(flame);
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), MAT.steel);
    pot.scale.y = 0.62;
    pot.position.y = 0.74;
    g.add(pot);
    g.add(cylinder(0.34, 0.34, 0.05, MAT.woodDark, 0, 0.9, 0, 12)); // 木ぶた
    g.add(cylinder(0.05, 0.05, 0.1, MAT.woodDark, 0, 0.97, 0));
    g.userData.torch = true; // 竈の火も夜の明かりとして扱う
    return g;
  },
  [B.IRON_POT]() {
    // 鉄鍋: 石の炉台に据えた大きな鉄の鍋。第4章の共同鍛造の成果で、
    // 第5章でも粥と薬草の煎じ湯に使う固有設備。
    const g = new THREE.Group();
    g.add(box(0.8, 0.4, 0.72, MAT.basalt, 0, 0.2, 0));
    g.add(box(0.3, 0.2, 0.06, MAT.woodDark, 0, 0.12, -0.36)); // 焚き口
    const flame = cone(0.1, 0.16, MAT.flame, 0, 0.16, -0.3);
    flame.name = "flame";
    g.add(flame);
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), MAT.iron);
    pot.scale.y = 0.66;
    pot.position.y = 0.6;
    g.add(pot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 16), MAT.iron);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.78;
    g.add(rim);
    // 湯気。
    const steam = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), MAT.white);
    steam.position.set(0.06, 0.98, 0);
    steam.name = "orb";
    g.add(steam);
    g.userData.torch = true;
    return g;
  },
  [B.KILN]() {
    // 炭焼き窯: 石積みのドームと焚き口。鉱夫と鍛冶をつなぐ設備。
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.basalt);
    dome.position.y = 0.18;
    g.add(dome);
    g.add(box(0.9, 0.2, 0.9, MAT.stone, 0, 0.1, 0));
    g.add(box(0.3, 0.28, 0.1, MAT.woodDark, 0, 0.24, -0.44)); // 焚き口
    const flame = cone(0.09, 0.16, MAT.ember, 0, 0.24, -0.4);
    flame.name = "flame";
    g.add(flame);
    g.add(cylinder(0.09, 0.11, 0.3, MAT.stone, 0, 0.74, 0.1)); // 煙突
    g.userData.torch = true;
    return g;
  },
  [B.FORGE]() {
    // 炉: 本章の心臓部。石積みの炉体、火床、ふいご。
    const g = new THREE.Group();
    g.add(box(0.95, 0.5, 0.85, MAT.basalt, 0, 0.25, 0));
    g.add(box(0.85, 0.14, 0.75, MAT.stone, 0, 0.57, 0));
    const bed = box(0.5, 0.08, 0.4, MAT.iron, 0, 0.66, 0);
    g.add(bed);
    const flame = cone(0.16, 0.3, MAT.ember, 0, 0.82, 0);
    flame.name = "flame";
    g.add(flame);
    // 背の煙突。
    g.add(box(0.3, 0.9, 0.3, MAT.basalt, 0, 0.9, 0.32));
    // ふいご。
    g.add(box(0.34, 0.16, 0.5, MAT.wood, -0.48, 0.3, 0.1));
    g.add(cylinder(0.04, 0.04, 0.3, MAT.woodDark, -0.4, 0.3, -0.24).rotateX(Math.PI / 2));
    g.userData.torch = true;
    return g;
  },
  [B.ANVIL]() {
    // 金床: ベルクが冷えたまま座り続けた場所。
    const g = new THREE.Group();
    g.add(box(0.5, 0.22, 0.42, MAT.basalt, 0, 0.11, 0));
    g.add(box(0.26, 0.2, 0.3, MAT.iron, 0, 0.32, 0));
    const top = box(0.62, 0.14, 0.3, MAT.iron, 0, 0.49, 0);
    g.add(top);
    const horn = cone(0.1, 0.24, MAT.iron, 0.38, 0.49, 0);
    horn.rotation.z = -Math.PI / 2;
    g.add(horn);
    return g;
  },
  [B.TROUGH]() {
    // 水桶: 焼き入れ用。
    const g = new THREE.Group();
    g.add(box(0.8, 0.4, 0.55, MAT.wood, 0, 0.2, 0));
    g.add(box(0.66, 0.06, 0.42, new THREE.MeshBasicMaterial({ color: 0x3f7fd0 }), 0, 0.36, 0));
    for (const dx of [-0.36, 0.36]) g.add(box(0.06, 0.46, 0.58, MAT.woodDark, dx, 0.23, 0));
    return g;
  },
  [B.TABLE]() {
    const g = new THREE.Group();
    // ちゃぶ台と湯のみ。食事シーンの集合場所。
    g.add(cylinder(0.46, 0.46, 0.07, MAT.plank, 0, 0.32, 0, 14));
    for (const [dx, dz] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) {
      g.add(box(0.08, 0.3, 0.08, MAT.woodDark, dx, 0.15, dz));
    }
    g.add(cylinder(0.05, 0.04, 0.07, MAT.white, 0.15, 0.39, 0.1, 8));
    g.add(cylinder(0.05, 0.04, 0.07, MAT.white, -0.18, 0.39, -0.08, 8));
    return g;
  },
  [B.MUSHROOM]() {
    const g = new THREE.Group();
    for (const [dx, dz, s] of [[-0.16, -0.08, 1], [0.18, 0.12, 0.7], [0.02, 0.2, 0.55]]) {
      g.add(cylinder(0.05 * s, 0.07 * s, 0.22 * s, MAT.white, dx, 0.11 * s, dz, 8));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14 * s, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.red);
      cap.position.set(dx, 0.2 * s, dz);
      g.add(cap);
    }
    return g;
  },
  [B.TAINT_STONE]() {
    // 穢れ石: グロムが打ち込んだ黒紫の結晶。瘴気の発生源。
    const g = new THREE.Group();
    const taint = new THREE.MeshToonMaterial({ color: 0x4a2a5a });
    const glow = new THREE.MeshBasicMaterial({ color: 0x9a5ad0 });
    const spike = (r, h, x, z, tilt) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), taint);
      m.position.set(x, h / 2, z);
      m.rotation.z = tilt;
      return m;
    };
    g.add(spike(0.26, 1.1, 0, 0, 0.08));
    g.add(spike(0.16, 0.7, 0.3, 0.2, -0.4));
    g.add(spike(0.14, 0.6, -0.28, -0.15, 0.45));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), glow);
    core.position.y = 0.55;
    core.name = "flame"; // ゆらめき更新に相乗り
    g.add(core);
    g.userData.torch = true; // 夜、不気味に光る
    return g;
  },
  [B.INCENSE_PLANT]() {
    // 清めの香草: 白い小花の株。摘むと清めの香草が採れる。
    const g = new THREE.Group();
    for (const [dx, dz, s] of [[-0.14, -0.08, 1], [0.16, 0.1, 0.85], [0, 0.18, 0.7]]) {
      g.add(box(0.05, 0.3 * s, 0.05, MAT.greenDark, dx, 0.15 * s, dz));
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 8), MAT.white);
      bloom.position.set(dx, 0.33 * s, dz);
      g.add(bloom);
    }
    g.userData.sway = true;
    return g;
  },
  [B.PRAYER_PILLAR]() {
    // 祈り柱: 浄化のしるしに立て直す、しめ縄を巻いた石柱。
    const g = new THREE.Group();
    g.add(box(0.5, 0.2, 0.5, MAT.stone, 0, 0.1, 0));
    g.add(cylinder(0.14, 0.17, 1.5, MAT.stone, 0, 0.95, 0, 8));
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 6, 12), MAT.straw);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 1.25;
    g.add(rope);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), MAT.glow);
    orb.position.y = 1.78;
    g.add(orb);
    return g;
  },
  [B.FISH_SPOT]() {
    const g = new THREE.Group();
    const tileMat = new THREE.MeshBasicMaterial({
      color: 0x4a8cdd,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const tile = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.04, 1.04), tileMat);
    tile.position.y = 0.02;
    g.add(tile);

    // 水面の波紋と背びれ。sway で揺らす。
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.58, depthWrite: false });
    for (const r of [0.18, 0.32]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.04, 20), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.045;
      g.add(ring);
    }
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), MAT.steel);
    fin.position.y = 0.14;
    fin.rotation.z = 0.35;
    g.add(fin);
    g.userData.sway = true;
    return g;
  },
};

const MAX_TORCH_LIGHTS = 8;

export class PropRenderer {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.props = new Map(); // cellKey -> group
    this.time = 0;
    this.lightPool = [];
    for (let i = 0; i < MAX_TORCH_LIGHTS; i += 1) {
      const light = new THREE.PointLight(0xffa54f, 0, 7, 1.6);
      light.visible = false;
      scene.add(light);
      this.lightPool.push(light);
    }
    this.lightTimer = 0;

    world.onChange((x, y, z, id, prev) => {
      this.syncCell(x, y, z);
      // Fences/doors connect visually to neighbours.
      if ([id, prev].some((v) => v === B.FENCE || v === B.DOOR)) {
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (this.world.get(x + dx, y, z + dz) === B.FENCE) this.syncCell(x + dx, y, z + dz);
        }
      }
    });
    this.buildAll();
  }

  buildAll() {
    for (let z = 0; z < WORLD.D; z += 1) {
      for (let x = 0; x < WORLD.W; x += 1) {
        for (let y = 0; y < WORLD.H; y += 1) {
          if (BUILDERS[this.world.get(x, y, z)]) this.syncCell(x, y, z);
        }
      }
    }
  }

  // Full rebuild after bulk world edits (e.g. loading a save).
  rebuildAll() {
    for (const prop of this.props.values()) this.group.remove(prop);
    this.props.clear();
    this.buildAll();
  }

  syncCell(x, y, z) {
    const key = cellKey(x, y, z);
    const existing = this.props.get(key);
    if (existing) {
      this.group.remove(existing);
      this.props.delete(key);
    }
    const id = this.world.get(x, y, z);
    const builder = BUILDERS[id];
    if (!builder) return;
    const prop = builder(this.world, x, y, z);
    prop.position.set(x + 0.5, y, z + 0.5);
    prop.userData.cell = { x, y, z };
    prop.userData.blockId = id;
    this.group.add(prop);
    this.props.set(key, prop);
  }

  update(dt, playerPos, isNight) {
    this.time += dt;
    for (const prop of this.props.values()) {
      if (prop.userData.door) {
        const hinge = prop.getObjectByName("hinge");
        const d = Math.hypot(prop.position.x - playerPos.x, prop.position.z - playerPos.z);
        const target = d < 1.6 ? -Math.PI / 2.2 : 0;
        hinge.rotation.y += (target - hinge.rotation.y) * Math.min(1, dt * 8);
      }
      if (prop.userData.banner) {
        const flag = prop.getObjectByName("flag");
        const positions = flag.geometry.attributes.position;
        for (let i = 0; i < positions.count; i += 1) {
          const x = positions.getX(i);
          positions.setZ(i, Math.sin(this.time * 4 + x * 3.5) * 0.06 * (x + 0.45));
        }
        positions.needsUpdate = true;
      }
      if (prop.userData.sway) {
        prop.rotation.z = Math.sin(this.time * 1.8 + prop.position.x) * 0.05;
      }
      if (prop.userData.torch) {
        const flame = prop.getObjectByName("flame");
        if (flame) {
          const s = 1 + Math.sin(this.time * 9 + prop.position.x * 7) * 0.18;
          flame.scale.set(s, 1.15 - s * 0.15, s);
        }
      }
    }

    // Reassign the point-light pool to the torches nearest the player (throttled).
    this.lightTimer -= dt;
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.5;
      const torches = [];
      for (const prop of this.props.values()) {
        if (!prop.userData.torch) continue;
        const d = prop.position.distanceToSquared(playerPos);
        torches.push([d, prop]);
      }
      torches.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < this.lightPool.length; i += 1) {
        const light = this.lightPool[i];
        if (i < torches.length) {
          const prop = torches[i][1];
          light.position.set(prop.position.x, prop.position.y + 0.8, prop.position.z);
          light.visible = true;
          light.intensity = isNight ? 14 : 5;
        } else {
          light.visible = false;
        }
      }
    }
  }
}

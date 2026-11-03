import * as THREE from "three";
import { B, drawTileIcon } from "./blocks.js";
import { createPropModels } from "./prop-models.js";
import { WORLD } from "./world.js";
import { cellKey } from "../core/utils.js";

// Prop blocks are rendered as individual little meshes. Builders return a group
// whose origin sits at the cell's min corner ground center (x+0.5, y, z+0.5).

const MAT = {
  wood: new THREE.MeshToonMaterial({ color: 0x8a5a2c }),
  woodDark: new THREE.MeshToonMaterial({ color: 0x5f3d1c }),
  straw: new THREE.MeshToonMaterial({ color: 0xc2a557 }),
  stone: new THREE.MeshToonMaterial({ color: 0x8b9196 }),
  basalt: new THREE.MeshToonMaterial({ color: 0x4a4a50 }),
  steel: new THREE.MeshToonMaterial({ color: 0xaeb6bb }),
  iron: new THREE.MeshToonMaterial({ color: 0x5d6166 }),
  white: new THREE.MeshToonMaterial({ color: 0xf2ecdc }),
  greenDark: new THREE.MeshToonMaterial({ color: 0x356b2b }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  ember: new THREE.MeshBasicMaterial({ color: 0xff7a3d }),
  wisp: new THREE.MeshBasicMaterial({ color: 0x9fd8ff }),
  glow: new THREE.MeshBasicMaterial({ color: 0x9fd8ff }),
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

// 作り直した設置物は Storybook_Character_Studio/prototypes/props-3d/ の原本から
// 書き出した prop-models.js で作る（輪郭線つき・ブロック模様を貼った基本形状）。
// 原本にまだ無い設置物は、上の BUILDERS のまま。
const propTiles = new Map();
function propTile(name) {
  if (!propTiles.has(name)) {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    drawTileIcon(canvas.getContext("2d"), name, 0, 0, 16);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    propTiles.set(name, texture);
  }
  return propTiles.get(name);
}
const PROP_MODELS = createPropModels(THREE, { tile: propTile, spikes: "iron", grain: "volcano" });
// 柵は隣の柵・扉へ横木を渡すので、隣のマスを ctx.connects で教える。
for (const [name, build] of Object.entries(PROP_MODELS)) {
  if (B[name] === undefined) continue;
  BUILDERS[B[name]] = (world, x, y, z) => build({
    connects: (dx, dz) => {
      const id = world.get(x + dx, y, z + dz);
      return id === B.FENCE || id === B.DOOR;
    },
  });
}
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

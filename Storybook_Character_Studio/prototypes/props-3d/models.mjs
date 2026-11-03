// 設置物の3Dモデルの作画原本。基本形状（箱・円柱・円錐・球）を組み、
// 手持ち道具（ゲームの rig.js）と同じトゥーン陰影と黒い輪郭線を付ける。
// 木・石・わらの面にはブロックの16px模様を、1マス=1枚の密度で貼る。
//
// このファイルは依存なし。THREE はゲームから渡す（Studioのテストでも同じ）。
// 書き出し: Studio で `npm.cmd run export:props -- --preview-game`（確認ページと両ゲームの src/world/prop-models.js）。
//
// 約束（ゲームの PropRenderer が使うので守る）:
// - 原点はマスの底面の中央。大きさは基本1マス（PROP_LIMITS の例外を除く）。
// - 設置物は回転しない。カメラは +x・+z 側の斜め上から45°刻みで回るので、
//   どの向きからも見られる形にし、顔や焚き口などの正面は +z に向ける。
// - 名前の付いた部品と userData の目印（PROP_REQUIREMENTS）を残す。
// - 作る関数は ctx を受け取る。ctx.connects(dx, dz) は、隣のマスが柵か扉なら true
//   （柵の横木をつなぐのに使う）。ゲームの PropRenderer は隣が変わると作り直す。

export const PROP_MODEL_VERSION = 3;

// 作り直した設置物。ブロック名（ゲームの B のキー）で引く。
export const PROP_MODEL_NAMES = Object.freeze([
  'SCARECROW', 'TORCH', 'BED', 'TORII', 'DOOR', 'WORKBENCH', 'ALTAR', 'SPIKES', // 試作01
  'FENCE', 'CHEST', 'KAMADO', 'TABLE', 'HELM', 'BANNER', 'CROP1', 'CROP2', 'CROP3', 'BUSH', 'MUSHROOM', // 試作02
  'MINE_LAMP', 'KILN', 'FORGE', 'ANVIL', 'TROUGH', 'IRON_POT', 'TAINT_STONE', 'INCENSE_PLANT', 'PRAYER_PILLAR', // 試作03（第4～5章だけ）
]);

// ゲームの PropRenderer.update が使う部品と目印。
export const PROP_REQUIREMENTS = Object.freeze({
  TORCH: { names: ['flame'], userData: ['torch'] },
  DOOR: { names: ['hinge'], userData: ['door'] },
  ALTAR: { names: ['orb'], userData: [] },
  KAMADO: { names: ['flame'], userData: ['torch'] },
  BANNER: { names: ['flag', 'emblem'], userData: ['banner'] },
  CROP1: { names: [], userData: ['sway'] },
  CROP2: { names: [], userData: ['sway'] },
  CROP3: { names: [], userData: ['sway'] },
  MINE_LAMP: { names: ['flame'], userData: ['torch'] },
  KILN: { names: ['flame'], userData: ['torch'] },
  FORGE: { names: ['flame'], userData: ['torch'] },
  IRON_POT: { names: ['flame'], userData: ['torch'] },
  TAINT_STONE: { names: ['flame'], userData: ['torch'] },
  INCENSE_PLANT: { names: [], userData: ['sway'] },
  PRAYER_PILLAR: { names: ['orb'], userData: [] },
});

// 大きさの上限（輪郭線を含む）。xz は中心からの半幅、y は高さ。既定は1マス。
export const PROP_LIMITS = Object.freeze({
  default: { xz: 0.5, y: 1.0 },
  SCARECROW: { xz: 0.5, y: 1.7 }, // 傾けた菅笠の外接箱を含む（本編の今の形は約1.58）
  DOOR: { xz: 0.5, y: 2.0 },
  TORII: { xz: 0.97, y: 2.2 },
  ALTAR: { xz: 0.5, y: 1.1 },
  BANNER: { xz: 0.97, y: 2.4 }, // 旗は柱の横へ張り出す（本編の今の形と同じ）
  FORGE: { xz: 0.5, y: 1.3 }, // 背の煙突（本編の今の形は約1.35）
  TAINT_STONE: { xz: 0.5, y: 1.2 }, // 結晶（本編の今の形は約1.1）
  PRAYER_PILLAR: { xz: 0.5, y: 2.0 }, // 石柱と光る玉（本編の今の形は約1.88）
});

const OUTLINE_COLOR = 0x1a1410;
const LINE = 0.018; // 輪郭線の太さ（ワールド単位）

export function createPropModels(THREE, { tile = () => null, spikes = 'stone', grain = 'rice' } = {}) {
  // --- 材質（設置物どうしで共有） ---------------------------------------------------
  const toon = (color) => new THREE.MeshToonMaterial({ color });
  const glow = (color) => new THREE.MeshBasicMaterial({ color });
  const C = {
    wood: toon(0x8a5a2c), woodDark: toon(0x5f3d1c), plank: toon(0xc99c5f),
    straw: toon(0xc2a557), strawDark: toon(0x96793a), strawLight: toon(0xe6cd7e),
    stone: toon(0x8b9196), stoneDark: toon(0x70767b), steel: toon(0xaeb6bb), iron: toon(0x5d6166),
    red: toon(0xc23b2a), redDark: toon(0x8c2a1e), black: toon(0x2a2a2e),
    white: toon(0xf2ecdc), cloth: toon(0xe9e1cc), indigo: toon(0x3a62a8), indigoDark: toon(0x26447a),
    gold: toon(0xd9b545), copper: toon(0xc97b3f), jelly: toon(0x6f62ee), ink: toon(0x2a221c),
    green: toon(0x4c9440), greenDark: toon(0x356b2b), greenLight: toon(0x7cc158), tea: toon(0x8aa64a),
    banner: new THREE.MeshToonMaterial({ color: 0x2f5db0, side: THREE.DoubleSide }),
    basalt: toon(0x4a4a50), charcoal: toon(0x2a2422), leather: toon(0x7a5232), water: toon(0x3f7fd0), waterLight: toon(0x8cc4f2),
    stew: toon(0x8a5a30), ironInside: new THREE.MeshToonMaterial({ color: 0x3d4147, side: THREE.DoubleSide }),
    taint: toon(0x4a2a5a), taintLight: toon(0x6a3a7e), taintGlow: glow(0xb06ae8),
    ember: glow(0xff7a3d),
    wispRim: new THREE.MeshBasicMaterial({ color: 0x8a4ac0, transparent: true, opacity: 0.7, depthWrite: false }),
    steam: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }),
    flame: new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.82, depthWrite: false }),
    flameCore: glow(0xffe27a), orb: glow(0x9fd8ff), orbCore: glow(0xe8f7ff),
  };
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });

  // ブロックの模様を貼った材質。模様が無い環境（テスト）では単色の材質を使う。
  const textured = new Map();
  const tex = (name, fallback) => {
    if (!textured.has(name)) {
      const map = tile(name);
      textured.set(name, map ? new THREE.MeshToonMaterial({ color: 0xffffff, map }) : fallback);
    }
    return textured.get(name);
  };
  const T = {
    plank: () => tex('plank', C.plank),
    log: () => tex('log_side', C.wood),
    stone: () => tex('stone', C.stone),
    thatch: () => tex('thatch', C.straw),
    basalt: () => tex('basalt', C.basalt),
  };

  // --- 形状（同じ寸法は使い回す） -------------------------------------------------
  const geometries = new Map();
  const cached = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  // 箱。UVを面の大きさに合わせ、模様が1マス=1枚の密度になるようにする。
  const boxGeo = (w, h, d) => cached(`box:${w},${h},${d}`, () => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x -x +y -y +z -z
    for (let i = 0; i < uv.count; i += 1) {
      const [fu, fv] = faces[Math.floor(i / 4)];
      uv.setXY(i, uv.getX(i) * fu, uv.getY(i) * fv);
    }
    return g;
  });
  const cylGeo = (rt, rb, h, seg = 10) => cached(`cyl:${rt},${rb},${h},${seg}`, () => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    const uv = g.attributes.uv;
    const around = Math.PI * (rt + rb);
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * around, uv.getY(i) * h);
    return g;
  });
  const coneGeo = (r, h, seg = 8) => cached(`cone:${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
  const sphereGeo = (r, ws = 12, hs = 10) => cached(`sphere:${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
  const torusGeo = (r, t) => cached(`torus:${r},${t}`, () => new THREE.TorusGeometry(r, t, 6, 16));
  // きのこの傘など、上半分だけの球。
  const capGeo = (r) => cached(`cap:${r}`, () => new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));

  // 部品を置く。outline: 黒い輪郭線（裏面を少し大きく描く）を付けるか。
  function part(geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, outline = true, name } = {}) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    if (name) mesh.name = name;
    if (outline) {
      geometry.computeBoundingBox();
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const hull = new THREE.Mesh(geometry, outlineMaterial);
      hull.scale.set(...['x', 'y', 'z'].map((k) => (size[k] + 2 * LINE) / Math.max(size[k], 1e-3)));
      hull.renderOrder = -1;
      hull.userData.outline = true;
      mesh.add(hull);
    }
    return mesh;
  }
  const box = (w, h, d, mat, o) => part(boxGeo(w, h, d), mat, o);
  const cyl = (rt, rb, h, mat, o, seg) => part(cylGeo(rt, rb, h, seg), mat, o);
  const cone = (r, h, mat, o, seg) => part(coneGeo(r, h, seg), mat, o);
  const sphere = (r, mat, o) => part(sphereGeo(r), mat, o);
  const group = (...children) => {
    const g = new THREE.Group();
    for (const c of children.flat(Infinity)) g.add(c); // 部品の配列は入れ子でもよい
    return g;
  };

  // 炎（たいまつ等で共用）。しずく形の橙の外炎を少し透かし、中の黄色い芯を見せる。
  // ゲームが名前 "flame" の大きさを揺らすので、炎はひとまとまりの Group にする。
  function flame(y, scale = 1) {
    const s = scale;
    const outer = sphere(0.085 * s, C.flame, { outline: false });
    outer.scale.y = 1.2;
    const inner = sphere(0.05 * s, C.flameCore, { y: -0.012 * s, outline: false });
    inner.scale.y = 1.25;
    const f = group(
      outer,
      cone(0.07 * s, 0.17 * s, C.flame, { y: 0.11 * s, outline: false }, 8),
      inner,
      cone(0.038 * s, 0.1 * s, C.flameCore, { y: 0.065 * s, outline: false }, 6),
    );
    f.position.y = y;
    f.name = 'flame';
    return f;
  }

  // --- 各設置物 --------------------------------------------------------------------
  const MODELS = {
    // たいまつ: 地面に挿した木の柄、わらを巻いた火口、縛り縄、2色の炎。根元に小石。
    TORCH() {
      const g = group(
        cyl(0.036, 0.046, 0.62, T.log(), { y: 0.31 }),
        cyl(0.088, 0.07, 0.16, C.straw, { y: 0.66 }),
        cyl(0.091, 0.091, 0.028, C.woodDark, { y: 0.61, outline: false }),
        cyl(0.091, 0.091, 0.028, C.woodDark, { y: 0.705, outline: false }),
        flame(0.8),
        [[-0.09, 0.05], [0.08, 0.07], [0.02, -0.09]].map(([x, z], i) => box(0.07 + i * 0.01, 0.05, 0.06, C.stone, { x, y: 0.025, z, ry: i })),
      );
      g.userData.torch = true;
      return g;
    },

    // わらのベッド: 低い木の枠、わらの敷き布団、くくり枕、藍の掛け布。
    BED() {
      const legs = [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]].map(([x, z]) => box(0.08, 0.1, 0.08, C.woodDark, { x, y: 0.05, z }));
      const tufts = [[-0.1, 0.27], [0.2, 0.27], [0.36, -0.27], [0.02, -0.27]].map(([x, z], i) => cone(0.03, 0.08, C.strawLight, { x, y: 0.22, z, rx: z > 0 ? 1.2 : -1.2, rz: i * 0.4, outline: false }, 5));
      return group(
        legs,
        box(0.94, 0.08, 0.06, T.plank(), { y: 0.13, z: 0.28 }),
        box(0.94, 0.08, 0.06, T.plank(), { y: 0.13, z: -0.28 }),
        box(0.06, 0.32, 0.6, T.plank(), { x: -0.44, y: 0.2 }),
        box(0.86, 0.14, 0.52, T.thatch(), { y: 0.21 }),
        box(0.78, 0.05, 0.46, C.straw, { x: 0.02, y: 0.3 }),
        tufts,
        cyl(0.07, 0.07, 0.34, C.white, { x: -0.3, y: 0.38, rx: Math.PI / 2 }),
        box(0.44, 0.05, 0.54, C.indigo, { x: 0.17, y: 0.33 }),
        box(0.06, 0.06, 0.55, C.indigoDark, { x: -0.04, y: 0.345, outline: false }),
      );
    },

    // 鳥居: 反った笠木、島木、額束と額、貫、2本の柱と亀腹（根元の台）。
    TORII() {
      const pillars = [-0.55, 0.55].flatMap((x) => [
        cyl(0.085, 0.1, 1.9, C.red, { x, y: 0.95 }),
        cyl(0.13, 0.15, 0.12, C.black, { x, y: 0.06 }),
      ]);
      const kasagiEnds = [-1, 1].map((s) => box(0.34, 0.1, 0.2, C.black, { x: s * 0.76, y: 1.995, rz: s * 0.2 }));
      return group(
        pillars,
        box(1.44, 0.1, 0.12, C.red, { y: 1.55 }),
        box(0.12, 0.2, 0.09, C.red, { y: 1.7 }),
        box(0.24, 0.16, 0.05, C.black, { y: 1.69, z: 0.07 }),
        box(0.16, 0.09, 0.052, C.gold, { y: 1.69, z: 0.072, outline: false }),
        box(1.5, 0.1, 0.16, C.red, { y: 1.85 }),
        box(1.22, 0.1, 0.2, C.black, { y: 1.95 }),
        kasagiEnds,
      );
    },

    // 木の扉: 枠の中に縦板4枚、表と裏に横桟、黒い蝶番と鉄の取っ手。蝶番側 x=-0.4 で開く。
    DOOR() {
      const frame = group(
        box(0.1, 1.9, 0.12, T.log(), { x: -0.43, y: 0.95 }),
        box(0.1, 1.9, 0.12, T.log(), { x: 0.43, y: 0.95 }),
        box(0.96, 0.1, 0.14, C.woodDark, { y: 1.9 }),
      );
      const panel = group(
        [0, 1, 2, 3].map((i) => box(0.195, 1.78, 0.07, i % 2 ? C.plank : T.plank(), { x: 0.1 + i * 0.2, y: 0.9 })),
        [0.35, 1.45].flatMap((y) => [-1, 1].map((s) => box(0.74, 0.1, 0.025, C.woodDark, { x: 0.4, y, z: s * 0.045 }))),
        [0.35, 1.45].map((y) => box(0.12, 0.06, 0.09, C.black, { x: 0.05, y, outline: false })),
        part(torusGeo(0.045, 0.012), C.iron, { x: 0.68, y: 0.95, z: 0.06, outline: false }),
      );
      const hinge = group(panel);
      hinge.position.set(-0.4, 0, 0);
      panel.position.x = -0.0;
      hinge.name = 'hinge';
      const g = group(frame, hinge);
      g.userData.door = true;
      return g;
    },

    // 作業台: 厚い天板、丸太の脚、下段の棚。天板に金づち・のこぎり・曲尺・木切れ。
    WORKBENCH() {
      const legs = [[-0.39, -0.28], [0.39, -0.28], [-0.39, 0.28], [0.39, 0.28]].map(([x, z]) => box(0.1, 0.58, 0.1, T.log(), { x, y: 0.29, z }));
      const hammer = group(
        cyl(0.018, 0.018, 0.28, C.wood, { rz: Math.PI / 2 }),
        cyl(0.045, 0.045, 0.12, C.plank, { x: -0.15, rx: Math.PI / 2 }),
      );
      hammer.position.set(-0.18, 0.69, 0.12);
      hammer.rotation.y = 0.5;
      const saw = group(
        box(0.34, 0.012, 0.09, C.steel, {}),
        box(0.1, 0.03, 0.05, C.wood, { x: 0.21 }),
      );
      saw.position.set(0.16, 0.66, -0.12);
      saw.rotation.y = -0.35;
      return group(
        legs,
        box(0.96, 0.1, 0.74, T.plank(), { y: 0.6 }),
        box(0.82, 0.04, 0.6, T.plank(), { y: 0.18 }),
        hammer,
        saw,
        box(0.22, 0.008, 0.03, C.steel, { x: 0.22, y: 0.654, z: 0.2, outline: false }),
        box(0.03, 0.008, 0.14, C.steel, { x: 0.315, y: 0.654, z: 0.145, outline: false }),
        box(0.14, 0.07, 0.08, T.log(), { x: -0.3, y: 0.685, z: -0.18, ry: 0.3 }),
      );
    },

    // 職業の祭壇: 3段の石の台、白い布と金の飾り、金の台座に青く光る玉。正面は +z。
    ALTAR() {
      const orb = group(
        sphere(0.14, C.orb, { outline: false }),
        sphere(0.06, C.orbCore, { x: -0.04, y: 0.04, z: 0.06, outline: false }),
      );
      orb.position.y = 0.86;
      orb.name = 'orb';
      return group(
        box(0.96, 0.18, 0.96, T.stone(), { y: 0.09 }),
        box(0.8, 0.26, 0.8, T.stone(), { y: 0.31 }),
        box(0.84, 0.04, 0.84, C.stoneDark, { y: 0.45, outline: false }),
        box(0.66, 0.1, 0.66, T.stone(), { y: 0.5 }),
        box(0.68, 0.025, 0.68, C.white, { y: 0.565 }),
        box(0.3, 0.16, 0.02, C.white, { y: 0.48, z: 0.34 }),
        box(0.3, 0.025, 0.022, C.gold, { y: 0.41, z: 0.341, outline: false }),
        cyl(0.08, 0.12, 0.1, C.gold, { y: 0.63 }),
        part(torusGeo(0.11, 0.022), C.gold, { y: 0.71, rx: Math.PI / 2 }),
        orb,
      );
    },

    // とげ罠: 木の枠に3×3のとげ。第1～3章は石（スライムゼリーで固める）、第4～5章は鉄。
    SPIKES() {
      const metal = spikes === 'iron' ? C.iron : C.stone;
      const spikeParts = [];
      for (const [i, x] of [-0.28, 0, 0.28].entries()) {
        for (const [j, z] of [-0.28, 0, 0.28].entries()) {
          const h = 0.26 + ((i + j) % 2 ? 0 : 0.08);
          spikeParts.push(cone(0.07, h, metal, { x, y: 0.07 + h / 2, z }, 6));
          if (spikes !== 'iron') spikeParts.push(sphere(0.045, C.jelly, { x: x + 0.03, y: 0.08, z: z + 0.03, outline: false }));
        }
      }
      return group(
        box(0.92, 0.07, 0.92, T.plank(), { y: 0.035 }),
        [-1, 1].map((s) => box(0.94, 0.05, 0.06, C.woodDark, { y: 0.06, z: s * 0.44, outline: false })),
        spikeParts,
      );
    },

    // かかし: 一本足の柱と横木、藍の着物と袖、わらの帯・手・すそ、へのへのもへじの顔、菅笠。
    SCARECROW() {
      return group(
        cyl(0.04, 0.045, 1.36, T.log(), { y: 0.68 }),
        cyl(0.03, 0.03, 0.86, C.wood, { y: 1.08, rz: Math.PI / 2 }),
        box(0.34, 0.38, 0.16, C.indigo, { y: 0.97 }),
        box(0.12, 0.2, 0.02, C.white, { x: -0.04, y: 1.07, z: 0.082, rz: 0.35, outline: false }),
        box(0.12, 0.2, 0.02, C.white, { x: 0.04, y: 1.07, z: 0.083, rz: -0.35, outline: false }),
        box(0.36, 0.06, 0.17, C.straw, { y: 0.86 }),
        box(0.07, 0.07, 0.02, C.red, { x: 0.09, y: 0.96, z: 0.082, outline: false }),
        [-1, 1].map((s) => box(0.24, 0.16, 0.16, C.indigoDark, { x: s * 0.29, y: 1.04 })),
        [-1, 1].map((s) => cone(0.05, 0.13, C.straw, { x: s * 0.405, y: 1.05, rz: -s * Math.PI / 2 }, 6)),
        [-0.1, 0, 0.1].map((x, i) => cone(0.045, 0.13, C.straw, { x, y: 0.735, z: (i - 1) * 0.02, rx: Math.PI }, 6)),
        sphere(0.15, C.cloth, { y: 1.29 }),
        [-0.05, 0.05].map((x) => box(0.04, 0.014, 0.01, C.ink, { x, y: 1.32, z: 0.147, outline: false })),
        box(0.07, 0.014, 0.01, C.ink, { y: 1.245, z: 0.143, outline: false }),
        // 菅笠は後ろへ傾け、斜め上のカメラからも顔が見えるようにする。
        cone(0.3, 0.13, C.straw, { y: 1.47, z: -0.03, rx: -0.42 }, 12),
        cyl(0.15, 0.15, 0.03, C.strawDark, { y: 1.41, z: -0.03, rx: -0.42, outline: false }, 12),
      );
    },

    // --- 試作02 ------------------------------------------------------------------------
    // 柵: 丸太の杭に角の笠、隣の柵・扉へ板の横木を2本渡す。
    FENCE(ctx = {}) {
      const connects = ctx.connects ?? (() => false);
      const g = group(
        box(0.14, 0.86, 0.14, T.log(), { y: 0.43 }),
        cone(0.11, 0.1, C.woodDark, { y: 0.91, ry: Math.PI / 4 }, 4),
      );
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!connects(dx, dz)) continue;
        for (const y of [0.34, 0.68]) {
          g.add(box(dx ? 0.43 : 0.07, 0.1, dz ? 0.43 : 0.07, T.plank(), { x: dx * 0.285, y, z: dz * 0.285 }));
        }
      }
      return g;
    },

    // 収納箱: 板材の箱と段のついたふた、四方を巻く鉄の帯、正面（+z）の金の留め具。
    CHEST() {
      return group(
        box(0.86, 0.46, 0.66, T.plank(), { y: 0.23 }),
        box(0.9, 0.12, 0.7, C.wood, { y: 0.52 }),
        box(0.84, 0.06, 0.64, T.plank(), { y: 0.61 }),
        [-0.3, 0.3].map((x) => box(0.07, 0.62, 0.72, C.iron, { x, y: 0.32 })),
        box(0.15, 0.13, 0.04, C.gold, { y: 0.47, z: 0.365 }),
        box(0.03, 0.05, 0.01, C.black, { y: 0.455, z: 0.388, outline: false }),
      );
    },

    // かまど: 石積みの竈。焚き口は正面（+z）で、中に薪と炎。上に羽釜と木のふた。
    KAMADO() {
      const g = group(
        box(0.9, 0.56, 0.5, T.stone(), { y: 0.28, z: -0.15 }),
        [-1, 1].map((s) => box(0.28, 0.56, 0.3, T.stone(), { x: s * 0.31, y: 0.28, z: 0.25 })),
        box(0.34, 0.22, 0.3, T.stone(), { y: 0.45, z: 0.25 }),
        box(0.34, 0.03, 0.3, C.black, { y: 0.015, z: 0.25, outline: false }),
        box(0.96, 0.08, 0.86, C.stoneDark, { y: 0.6 }),
        [-0.06, 0.07].map((x, i) => cyl(0.035, 0.035, 0.3, T.log(), { x, y: 0.06 + i * 0.03, z: 0.22, rx: Math.PI / 2, ry: i ? 0.3 : -0.2, outline: false })),
        flame(0.17, 0.75),
        sphere(0.3, C.iron, { y: 0.76 }),
        part(torusGeo(0.3, 0.035), C.black, { y: 0.74, rx: Math.PI / 2 }),
        cyl(0.24, 0.26, 0.05, T.plank(), { y: 0.88 }),
        cyl(0.04, 0.05, 0.05, C.woodDark, { y: 0.93 }),
      );
      g.children.find((c) => c.geometry?.type === 'SphereGeometry').scale.y = 0.6;
      g.getObjectByName('flame').position.z = 0.25;
      g.userData.torch = true; // かまどの火も夜の明かりとして扱う
      return g;
    },

    // ちゃぶ台: 丸い板の天板と短い脚。湯のみ2つと急須。
    TABLE() {
      const legs = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z]) => box(0.06, 0.24, 0.06, C.woodDark, { x, y: 0.12, z }));
      const cups = [[0.17, 0.12], [-0.15, -0.13]].flatMap(([x, z]) => [
        cyl(0.045, 0.038, 0.07, C.cloth, { x, y: 0.365, z }, 10),
        cyl(0.038, 0.038, 0.004, C.tea, { x, y: 0.398, z, outline: false }, 10),
      ]);
      const pot = sphere(0.07, C.woodDark, { x: -0.04, y: 0.39, z: 0.14 });
      pot.scale.y = 0.85;
      return group(
        legs,
        cyl(0.4, 0.4, 0.04, C.woodDark, { y: 0.26, outline: false }, 16),
        cyl(0.44, 0.44, 0.06, T.plank(), { y: 0.3 }, 16),
        cups,
        pot,
        cone(0.018, 0.08, C.woodDark, { x: 0.04, y: 0.4, z: 0.14, rz: -1.1, outline: false }, 6),
        cyl(0.02, 0.02, 0.03, C.black, { x: -0.04, y: 0.46, z: 0.14, outline: false }, 6),
      );
    },

    // 舵輪: 台座と柱に、木の輪・8本のスポークと取っ手・銅のハブ。輪は正面（+z）を向く。
    HELM() {
      const wheel = group(
        part(torusGeo(0.24, 0.032), C.wood, {}),
        part(torusGeo(0.09, 0.018), C.plank, { outline: false }),
        [0, 1, 2, 3].map((i) => box(0.032, 0.6, 0.032, C.plank, { rz: (i * Math.PI) / 4 })),
        Array.from({ length: 8 }, (_, i) => sphere(0.026, C.woodDark, { x: Math.cos((i * Math.PI) / 4) * 0.3, y: Math.sin((i * Math.PI) / 4) * 0.3, outline: false })),
        cyl(0.055, 0.055, 0.08, C.copper, { rx: Math.PI / 2 }),
      );
      wheel.position.set(0, 0.64, 0.04);
      return group(
        box(0.4, 0.08, 0.3, C.woodDark, { y: 0.04 }),
        box(0.14, 0.56, 0.14, T.log(), { y: 0.36 }),
        wheel,
      );
    },

    // 職業の旗: 石の台座、柱と金の頭、旗竿の金の横棒、青い旗と金の紋。
    // 旗はゲームが頂点を波打たせるので、置くたびに別の形状を作る（使い回さない）。
    BANNER() {
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 6, 1), C.banner);
      flag.position.set(0.48, 1.85, 0);
      flag.name = 'flag';
      const emblem = new THREE.Mesh(cached('emblem', () => new THREE.CircleGeometry(0.14, 16)), C.gold);
      emblem.position.set(0.48, 1.85, 0.03);
      emblem.name = 'emblem';
      const back = new THREE.Mesh(emblem.geometry, C.gold);
      back.position.set(0.48, 1.85, -0.03);
      back.rotation.y = Math.PI;
      const g = group(
        box(0.36, 0.12, 0.36, T.stone(), { y: 0.06 }),
        box(0.24, 0.06, 0.24, C.stoneDark, { y: 0.15 }),
        cyl(0.045, 0.055, 2.1, C.woodDark, { y: 1.2 }),
        sphere(0.07, C.gold, { y: 2.29 }),
        cyl(0.018, 0.018, 0.95, C.gold, { x: 0.47, y: 2.16, rz: Math.PI / 2, outline: false }),
        flag, emblem, back,
      );
      g.userData.banner = true;
      return g;
    },

    // 稲（なえ・育つ・実った）。4～5株を植え、葉は細い板を外へ反らせる。
    // 第4～5章の火山穀物は grain: 'volcano' で穂を赤金色にする。
    CROP1() {
      return crop([[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2], [0, 0]], 5, 0.26, C.green, C.greenLight, null, 0.045);
    },
    CROP2() {
      return crop([[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2], [0, 0]], 7, 0.5, C.greenDark, C.green, null, 0.055);
    },
    CROP3() {
      return crop([[-0.22, -0.22], [0.22, -0.2], [-0.2, 0.22], [0.2, 0.2], [0, 0]], 6, 0.6, C.straw, null, grain === 'volcano' ? C.copper : C.gold, 0.05);
    },

    // わら草: 細い葉の束が外へ広がり、穂が2本。刈るとわらが取れる草。
    BUSH() {
      const blades = Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.2, h = 0.28 + (i % 4) * 0.06;
        const r = i % 2 ? 0.1 : 0.05;
        return cone(0.04, h, [C.straw, C.strawLight, C.strawDark][i % 3], { x: Math.cos(a) * r, y: h / 2, z: Math.sin(a) * r, rx: Math.sin(a) * 0.42, rz: -Math.cos(a) * 0.42, outline: false }, 4);
      });
      return group(
        blades,
        sphere(0.035, C.strawDark, { x: 0.12, y: 0.4, z: 0.05, outline: false }),
        sphere(0.035, C.strawDark, { x: -0.1, y: 0.36, z: -0.08, outline: false }),
      );
    },

    // きのこ: 白い軸に、白い斑点のある赤い傘。大小3本。
    MUSHROOM() {
      return group([[-0.16, -0.08, 1], [0.18, 0.12, 0.72], [0.02, 0.2, 0.56]].flatMap(([x, z, s]) => [
        cyl(0.045 * s, 0.065 * s, 0.22 * s, C.white, { x, y: 0.11 * s, z }, 8),
        part(capGeo(0.15 * s), C.red, { x, y: 0.2 * s, z }),
        [[0.4, 0.5], [2.4, 0.7], [4.3, 0.45]].map(([a, t]) => sphere(0.022 * s, C.white, {
          x: x + Math.cos(a) * Math.sin(t) * 0.15 * s, y: 0.2 * s + Math.cos(t) * 0.15 * s, z: z + Math.sin(a) * Math.sin(t) * 0.15 * s, outline: false,
        })),
      ]));
    },

    // --- 試作03（第4～5章だけの設置物） ---------------------------------------------
    // 坑道灯: 木の柱と腕木から鉄のかごを吊るし、中で鬼火のかけらが燃える。
    // 鬼火は本編の敵と同じ紫の縁と橙の芯にした（ゲームの灯りの色も橙）。
    MINE_LAMP() {
      const wisp = group(
        sphere(0.07, C.wispRim, { outline: false }),
        sphere(0.042, C.flameCore, { y: -0.005, outline: false }),
        cone(0.035, 0.08, C.ember, { y: 0.06, outline: false }, 6),
      );
      wisp.children[0].scale.y = 1.3;
      wisp.position.set(0.15, 0.55, 0);
      wisp.name = 'flame';
      const bars = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => box(0.022, 0.24, 0.022, C.iron, { x: 0.15 + sx * 0.08, y: 0.55, z: sz * 0.08, outline: false }));
      const g = group(
        box(0.1, 0.9, 0.1, T.log(), { x: -0.2, y: 0.45 }),
        box(0.44, 0.07, 0.08, C.woodDark, { x: -0.01, y: 0.86 }),
        box(0.05, 0.22, 0.05, C.woodDark, { x: -0.1, y: 0.75, rz: -0.75 }),
        box(0.015, 0.1, 0.015, C.iron, { x: 0.15, y: 0.77, outline: false }),
        cone(0.13, 0.08, C.iron, { x: 0.15, y: 0.71, ry: Math.PI / 4 }, 4),
        box(0.2, 0.025, 0.2, C.iron, { x: 0.15, y: 0.665, outline: false }),
        box(0.2, 0.03, 0.2, C.iron, { x: 0.15, y: 0.43 }),
        bars,
        wisp,
        [[-0.3, 0.1], [-0.12, -0.12]].map(([x, z], i) => box(0.09, 0.05, 0.08, C.basalt, { x, y: 0.025, z, ry: i })),
      );
      g.userData.torch = true;
      return g;
    },

    // 炭焼き窯: 石の土台に玄武岩のドーム、正面（+z）の焚き口に燃えさし、後ろに煙突。脇に薪と炭。
    KILN() {
      const dome = part(capGeo(0.45), T.basalt(), { y: 0.16 });
      dome.scale.y = 0.95;
      const ember = flame(0.25, 0.55);
      ember.position.z = 0.44;
      const g = group(
        box(0.92, 0.16, 0.92, T.stone(), { y: 0.08 }),
        dome,
        box(0.32, 0.26, 0.14, T.basalt(), { y: 0.29, z: 0.35 }),
        box(0.18, 0.15, 0.02, C.black, { y: 0.25, z: 0.421, outline: false }),
        ember,
        cyl(0.07, 0.09, 0.36, T.stone(), { x: -0.16, y: 0.62, z: -0.14 }),
        [0, 1].map((i) => cyl(0.04, 0.04, 0.3, T.log(), { x: -0.33 + i * 0.09, y: 0.2, z: 0.3, rx: Math.PI / 2, outline: false })),
        [[0.3, 0.36], [0.36, 0.3], [0.33, 0.4]].map(([x, z], i) => box(0.07, 0.05, 0.07, C.charcoal, { x, y: 0.185 + (i === 2 ? 0.04 : 0), z, ry: i, outline: false })),
      );
      g.userData.torch = true;
      return g;
    },

    // 炉: 玄武岩の炉体と石の天板、鉄の火床に炭と炎、背の煙突。左（-x）にふいご。
    FORGE() {
      const bellows = group(
        box(0.22, 0.03, 0.34, T.plank(), { y: 0.2, rz: 0.12 }),
        box(0.22, 0.03, 0.34, T.plank(), { y: 0.06 }),
        box(0.18, 0.12, 0.3, C.leather, { y: 0.13, outline: false }),
        cyl(0.025, 0.025, 0.16, C.iron, { x: 0.15, y: 0.1, rz: Math.PI / 2 }),
      );
      bellows.position.set(-0.36, 0, 0.12);
      const g = group(
        box(0.7, 0.52, 0.8, T.basalt(), { x: 0.1, y: 0.26 }),
        box(0.74, 0.08, 0.84, T.stone(), { x: 0.1, y: 0.56 }),
        box(0.46, 0.06, 0.4, C.iron, { x: 0.1, y: 0.63 }),
        [[0, 0], [0.12, 0.08], [-0.1, 0.1], [0.08, -0.1]].map(([x, z], i) => box(0.08, 0.05, 0.08, i % 2 ? C.charcoal : C.ember, { x: 0.1 + x, y: 0.68, z, ry: i, outline: false })),
        flame(0.76, 0.9),
        box(0.3, 0.6, 0.26, T.basalt(), { x: 0.1, y: 0.9, z: -0.27 }),
        box(0.36, 0.06, 0.32, C.basalt, { x: 0.1, y: 1.22, z: -0.27 }),
        bellows,
      );
      g.getObjectByName('flame').position.x = 0.1;
      g.userData.torch = true;
      return g;
    },

    // 金床: 丸太の台に、角と打面のある鉄の金床。打面に金づち。
    ANVIL() {
      const hammer = group(
        cyl(0.015, 0.015, 0.26, C.wood, { rz: Math.PI / 2, outline: false }),
        box(0.05, 0.1, 0.05, C.iron, { x: -0.13 }),
      );
      hammer.position.set(-0.02, 0.575, 0.06);
      hammer.rotation.y = 0.5;
      return group(
        cyl(0.2, 0.22, 0.3, T.log(), { y: 0.15 }),
        box(0.18, 0.12, 0.14, C.iron, { y: 0.36 }),
        box(0.5, 0.12, 0.22, C.iron, { y: 0.48 }),
        box(0.5, 0.015, 0.22, C.steel, { y: 0.548, outline: false }),
        cone(0.07, 0.2, C.iron, { x: 0.35, y: 0.48, rz: -Math.PI / 2 }, 8),
        box(0.08, 0.08, 0.16, C.iron, { x: -0.29, y: 0.5 }),
        hammer,
      );
    },

    // 水桶: 焼き入れ用の水を張った板の桶。角の柱と鉄の帯、縁に柄杓。
    TROUGH() {
      const posts = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => box(0.07, 0.44, 0.07, C.woodDark, { x: sx * 0.38, y: 0.22, z: sz * 0.25 }));
      return group(
        box(0.76, 0.06, 0.5, T.plank(), { y: 0.03 }),
        [-1, 1].map((s) => box(0.76, 0.4, 0.04, T.plank(), { y: 0.22, z: s * 0.25 })),
        [-1, 1].map((s) => box(0.04, 0.4, 0.46, T.plank(), { x: s * 0.38, y: 0.22 })),
        posts,
        [0.12, 0.34].flatMap((y) => [-1, 1].map((s) => box(0.8, 0.035, 0.012, C.iron, { y, z: s * 0.276, outline: false }))),
        box(0.72, 0.02, 0.46, C.water, { y: 0.36, outline: false }),
        [[-0.15, 0.06], [0.12, -0.1]].map(([x, z]) => box(0.12, 0.022, 0.03, C.waterLight, { x, y: 0.362, z, outline: false })),
        cyl(0.05, 0.04, 0.05, C.wood, { x: 0.22, y: 0.45, z: 0.08 }),
        cyl(0.012, 0.012, 0.32, C.wood, { x: 0.06, y: 0.46, z: 0.08, rz: Math.PI / 2 - 0.15, outline: false }),
      );
    },

    // 鉄鍋: 玄武岩の炉台に据えた大きな鉄の鍋。中に煮物、左右に取っ手、湯気。焚き口は正面（+z）。
    IRON_POT() {
      const bowl = part(capGeo(0.34), C.ironInside, { y: 0.71, rx: Math.PI, outline: false });
      bowl.scale.y = 0.85;
      const fire = flame(0.13, 0.6);
      fire.position.z = 0.4;
      const steam = group(
        sphere(0.06, C.steam, { x: -0.06, y: 0, outline: false }),
        sphere(0.045, C.steam, { x: 0.06, y: 0.08, outline: false }),
        sphere(0.035, C.steam, { x: -0.02, y: 0.15, outline: false }),
      );
      steam.position.y = 0.8;
      steam.name = 'orb';
      const g = group(
        box(0.82, 0.4, 0.74, T.basalt(), { y: 0.2 }),
        box(0.3, 0.17, 0.02, C.black, { y: 0.13, z: 0.371, outline: false }),
        fire,
        bowl,
        cyl(0.31, 0.31, 0.02, C.stew, { y: 0.66, outline: false }, 16),
        part(torusGeo(0.335, 0.035), C.iron, { y: 0.71, rx: Math.PI / 2 }),
        [-1, 1].map((s) => part(torusGeo(0.05, 0.015), C.iron, { x: s * 0.37, y: 0.68, ry: Math.PI / 2, outline: false })),
        steam,
      );
      g.userData.torch = true;
      return g;
    },

    // 穢れ石: グロムが打ち込んだ黒紫の結晶の群れ。根元の割れ目が紫に光る。
    TAINT_STONE() {
      const core = group(
        sphere(0.1, C.taintGlow, { outline: false }),
        sphere(0.05, C.orbCore, { x: 0.02, y: 0.02, z: 0.05, outline: false }),
      );
      core.position.set(0.02, 0.17, 0.16);
      core.name = 'flame';
      const g = group(
        [[-0.25, 0.1], [0.2, 0.22], [0.26, -0.2], [-0.1, -0.28]].map(([x, z], i) => box(0.12, 0.06, 0.1, C.basalt, { x, y: 0.03, z, ry: i * 0.7 })),
        cone(0.2, 0.95, C.taint, { y: 0.5, rz: 0.06, rx: -0.05 }, 5),
        cone(0.13, 0.58, C.taintLight, { x: 0.22, y: 0.33, z: 0.12, rz: -0.42 }, 5),
        cone(0.12, 0.52, C.taint, { x: -0.22, y: 0.3, z: -0.08, rz: 0.45 }, 5),
        cone(0.09, 0.38, C.taintLight, { x: 0.04, y: 0.22, z: -0.24, rx: -0.4 }, 5),
        [[0.04, 0.5, 0.15], [-0.05, 0.75, 0.1]].map(([x, y, z]) => box(0.025, 0.12, 0.012, C.taintGlow, { x, y, z, rz: 0.3, outline: false })),
        core,
      );
      g.userData.torch = true; // 夜、不気味に光る（本編と同じ）
      return g;
    },

    // 清めの香草: 細い葉の株に、白い小花の房が3つ。風に揺れる。
    INCENSE_PLANT() {
      const leaves = Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2, h = 0.16 + (i % 3) * 0.04;
        return cone(0.035, h, i % 2 ? C.green : C.greenDark, { x: Math.cos(a) * 0.07, y: h / 2, z: Math.sin(a) * 0.07, rx: Math.sin(a) * 0.5, rz: -Math.cos(a) * 0.5, outline: false }, 4);
      });
      const blooms = [[-0.12, -0.06, 0.42], [0.13, 0.06, 0.36], [0, 0.15, 0.3]].flatMap(([x, z, h]) => [
        box(0.015, h, 0.015, C.greenDark, { x, y: h / 2, z, outline: false }),
        [[0, 0.05, 0], [0.05, 0.025, 0.015], [-0.045, 0.02, 0.035], [0.015, 0.025, -0.05]].map(([dx, dy, dz]) => sphere(0.045, C.white, { x: x + dx, y: h + dy, z: z + dz })),
        sphere(0.02, C.gold, { x, y: h + 0.1, z, outline: false }),
      ]);
      const g = group(leaves, blooms);
      g.userData.sway = true;
      return g;
    },

    // 祈り柱: 石の台座に立つ石柱。しめ縄と紙垂を巻き、頭に光る玉。
    PRAYER_PILLAR() {
      const orb = group(
        sphere(0.1, C.orb, { outline: false }),
        sphere(0.045, C.orbCore, { x: -0.03, y: 0.03, z: 0.04, outline: false }),
      );
      orb.position.y = 1.78;
      orb.name = 'orb';
      const shide = [0, 2.1, 4.2].flatMap((a) => [0, 1, 2].map((k) => box(0.045, 0.06, 0.008, C.white, {
        x: Math.sin(a) * 0.2 + (k % 2 ? 0.015 : -0.015) * Math.cos(a), y: 1.22 - k * 0.055, z: Math.cos(a) * 0.2 - (k % 2 ? 0.015 : -0.015) * Math.sin(a), ry: a, outline: false,
      })));
      return group(
        box(0.5, 0.16, 0.5, T.stone(), { y: 0.08 }),
        box(0.38, 0.08, 0.38, C.stoneDark, { y: 0.2 }),
        cyl(0.13, 0.16, 1.4, T.stone(), { y: 0.94 }),
        part(torusGeo(0.17, 0.045), C.straw, { y: 1.3, rx: Math.PI / 2 }),
        shide,
        cyl(0.17, 0.15, 0.05, C.stoneDark, { y: 1.665 }),
        orb,
      );
    },
  };

  // 稲の株。spots: 株の位置、blades: 1株の葉の数、h: 高さ、tip: 葉先の色、head: 穂の色、w: 葉の幅。
  // 遠くのカメラからも見えるよう、葉は太めにして外へ反らせる。穂は1株に2本、反対向きに垂らす。
  function crop(spots, blades, h, leaf, tip, head, w) {
    const g = group(spots.flatMap(([x, z], k) => {
      const parts = [];
      for (let i = 0; i < blades; i += 1) {
        const a = (i / blades) * Math.PI * 2 + k;
        const hh = h * (0.82 + 0.18 * ((i * 7 + k) % 3) / 2);
        parts.push(box(w, hh, 0.02, leaf, { x: x + Math.cos(a) * 0.035, y: hh / 2, z: z + Math.sin(a) * 0.035, ry: -a, rz: 0.3 * Math.cos(a), rx: -0.3 * Math.sin(a), outline: false }));
        if (tip) parts.push(box(w * 0.9, 0.07, 0.022, tip, { x: x + Math.cos(a) * 0.09, y: hh - 0.01, z: z + Math.sin(a) * 0.09, ry: -a, rz: 0.3 * Math.cos(a), rx: -0.3 * Math.sin(a), outline: false }));
      }
      if (head) {
        for (const side of [1, -1]) {
          for (const [d, dy] of [[0.0, 0.04], [0.035, 0.03], [0.065, 0.0], [0.09, -0.04], [0.105, -0.09]]) {
            parts.push(sphere(0.034, head, { x: x + side * d, y: h + dy, z: z + side * 0.02, outline: false }));
          }
        }
      }
      return parts;
    }));
    g.userData.sway = true;
    return g;
  }

  return MODELS;
}

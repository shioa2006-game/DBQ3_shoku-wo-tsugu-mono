// 生成ファイル。直接編集しない。
// 原本: Storybook_Character_Studio/prototypes/props-3d/models.mjs
// 更新: Storybook_Character_Studio で npm.cmd run export:props
// 設置物の3Dモデルの作画原本。基本形状（箱・円柱・円錐・球）を組み、
// 手持ち道具（ゲームの rig.js）と同じトゥーン陰影と黒い輪郭線を付ける。
// 木・石・わらの面にはブロックの16px模様を、1マス=1枚の密度で貼る。
//
// このファイルは依存なし。THREE はゲームから渡す（Studioのテストでも同じ）。
// 書き出し: Studio で `npm.cmd run export:props`（確認ページ用の写しを作る）。
//
// 約束（ゲームの PropRenderer が使うので守る）:
// - 原点はマスの底面の中央。大きさは基本1マス（PROP_LIMITS の例外を除く）。
// - 設置物は回転しない。カメラは +x・+z 側の斜め上から45°刻みで回るので、
//   どの向きからも見られる形にし、顔や焚き口などの正面は +z に向ける。
// - 名前の付いた部品と userData の目印（PROP_REQUIREMENTS）を残す。

export const PROP_MODEL_VERSION = 1;

// 作り直した設置物。ブロック名（ゲームの B のキー）で引く。
export const PROP_MODEL_NAMES = Object.freeze(['SCARECROW', 'TORCH', 'BED', 'TORII', 'DOOR', 'WORKBENCH', 'ALTAR', 'SPIKES']);

// ゲームの PropRenderer.update が使う部品と目印。
export const PROP_REQUIREMENTS = Object.freeze({
  TORCH: { names: ['flame'], userData: ['torch'] },
  DOOR: { names: ['hinge'], userData: ['door'] },
  ALTAR: { names: ['orb'], userData: [] },
});

// 大きさの上限（輪郭線を含む）。xz は中心からの半幅、y は高さ。既定は1マス。
export const PROP_LIMITS = Object.freeze({
  default: { xz: 0.5, y: 1.0 },
  SCARECROW: { xz: 0.5, y: 1.7 }, // 傾けた菅笠の外接箱を含む（本編の今の形は約1.58）
  DOOR: { xz: 0.5, y: 2.0 },
  TORII: { xz: 0.97, y: 2.2 },
  ALTAR: { xz: 0.5, y: 1.1 },
});

const OUTLINE_COLOR = 0x1a1410;
const LINE = 0.018; // 輪郭線の太さ（ワールド単位）

export function createPropModels(THREE, { tile = () => null, spikes = 'stone' } = {}) {
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
    for (const c of children.flat()) g.add(c);
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
  };

  return MODELS;
}

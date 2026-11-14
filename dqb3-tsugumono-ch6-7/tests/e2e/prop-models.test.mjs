// 設置物の3Dは、すべて src/world/prop-models.js（Storybook_Character_Studio/prototypes/props-3d/ から書き出したもの）で作る。
// - この編の設置物のブロックは、ひとつ残らず本物の PropRenderer で組み上がる（黒い輪郭線・ブロック模様つき）
// - PropRenderer が動かす部品（扉と門の蝶番・炎・旗・作物のゆれ・大型対空ボウガンの砲座）が残っている
// - 柵は隣の柵・門へ横木を渡す。魚のかげの下にも水面が続く。扉と門は人が近づくと開く
// - コンソールエラーが出ない

import { B, BLOCK_DEFS } from "../../src/world/blocks.js";
import { PROP_MODEL_NAMES } from "../../src/world/prop-models.js";
import { WORLD } from "../../src/world/world.js";
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

// この編で使う設置物（Studio の一覧のうち、この編のブロックにあるもの）。
const RENEWED = PROP_MODEL_NAMES.filter((n) => B[n] !== undefined);
// 設置物として描くブロック（blocks.js の prop: true）。
const PROP_BLOCKS = Object.keys(B).filter((n) => BLOCK_DEFS[B[n]]?.prop);
// PropRenderer.update が使う部品の名前と、userData の目印。
const REQUIRED = {
  TORCH: { name: "flame", flag: "torch" }, DOOR: { name: "hinge", flag: "door" },
  KAMADO: { name: "flame", flag: "torch" }, BANNER: { name: "flag", flag: "banner" },
  CROP1: { flag: "sway" }, CROP2: { flag: "sway" }, CROP3: { flag: "sway" },
  KILN: { name: "flame", flag: "torch" }, FORGE: { name: "flame", flag: "torch" },
  FISH_SPOT: { flag: "sway" },
  // 第6～7章の設置物。
  LANTERN: { name: "flame", flag: "torch" }, FLAME_BOWL: { name: "flame", flag: "torch" },
  GATE: { name: "hinge", flag: "door" }, GREAT_BALLISTA: { name: "turret", flag: "ballista" },
  WEDGE_MARK: { name: "orb" },
};
// 細い草や水面の影、光る印は、わざと輪郭線なしで描く。
const NO_OUTLINE = new Set(["CROP1", "CROP2", "CROP3", "BUSH", "FISH_SPOT", "WEDGE_MARK"]);
// 木・石の面にブロックの模様を貼る設置物（前の編からのものと、この編のものから代表を選ぶ）。
const TEXTURED = ["FENCE", "DOOR", "WORKBENCH", "CHEST", "KAMADO", "FLAME_BOWL", "SELECT_PILLAR0", "GATE", "CROSSBOW_S", "GREAT_BALLISTA"];
// ダーマ再興編の設置物は36種。昔の描き方へ戻る設置物があってはいけない。
const EXPECTED = 36;

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const report = await page.evaluate(({ renewed, ids, dims }) => {
    const g = window.__game;
    const y = 24; // 南の海の上の空（地形・船から離れた場所）
    const out = {};
    const bannerPos = g.bannerEntity.pos.clone();
    renewed.forEach((name, i) => {
      const x = 2 + (i % 30) * 2, z = 110 + Math.floor(i / 30) * 2;
      g.world.set(x, y, z, ids[name]);
      const prop = g.props.props.get(`${x},${y},${z}`);
      let meshes = 0, outlines = 0, textured = 0;
      prop?.traverse((o) => {
        if (!o.isMesh) return;
        meshes += 1;
        if (o.userData.outline) outlines += 1;
        if (o.material?.map) textured += 1;
      });
      out[name] = {
        built: !!prop,
        meshes,
        outlines,
        textured,
        names: ["flame", "hinge", "orb", "flag", "emblem", "turret"].filter((n) => prop?.getObjectByName(n)),
        flags: Object.keys(prop?.userData ?? {}),
      };
      g.world.set(x, y, z, 0);
      out[name].removed = !g.props.props.has(`${x},${y},${z}`);
    });
    g.bannerEntity.pos.copy(bannerPos); // 旗を置いて戻したので、旗の位置の記録も戻す
    // 柵は、隣に柵が置かれると横木が増える（PropRenderer が作り直す）。門へも渡す。
    const meshCount = (p) => { let n = 0; p.traverse((o) => o.isMesh && !o.userData.outline && (n += 1)); return n; };
    g.world.set(4, y, 116, ids.FENCE);
    const alone = meshCount(g.props.props.get(`4,${y},116`));
    g.world.set(5, y, 116, ids.FENCE);
    out.fenceRails = meshCount(g.props.props.get(`4,${y},116`)) - alone;
    g.world.set(5, y, 116, ids.GATE);
    out.gateRails = meshCount(g.props.props.get(`4,${y},116`)) - alone;
    g.world.set(5, y, 116, 0);
    out.railsRemoved = meshCount(g.props.props.get(`4,${y},116`)) - alone;
    g.world.set(4, y, 116, 0);
    // 魚のかげの下にも水面が続く（砂の底が見える穴にならない）。
    let fish = null;
    for (let fy = 0; fy < dims.H && !fish; fy += 1) for (let fz = 0; fz < dims.D && !fish; fz += 1) for (let fx = 0; fx < dims.W && !fish; fx += 1) {
      if (g.world.get(fx, fy, fz) === ids.FISH_SPOT) fish = [fx, fy, fz];
    }
    out.fishSpot = fish;
    if (fish) {
      const [fx, fy, fz] = fish;
      let under = 0;
      for (const entry of g.chunks.meshes.values()) {
        const pos = entry.water?.geometry.attributes.position;
        if (!pos) continue;
        for (let i = 0; i < pos.count; i += 1) {
          const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
          if (vx >= fx && vx <= fx + 1 && vz >= fz && vz <= fz + 1 && Math.abs(vy - (fy - 0.12)) < 0.01) under += 1;
        }
      }
      out.waterUnderFish = under;
    }
    // 扉と門は、近くのプレイヤーへ向かって蝶番で開く。離れた場所の門は閉じたまま。
    const px = g.player.pos.x, pz = g.player.pos.z;
    const dx = Math.floor(px) + 1, dz = Math.floor(pz), dy = 24;
    const opens = (id, x, z) => {
      g.world.set(x, dy, z, id);
      const prop = g.props.props.get(`${x},${dy},${z}`);
      for (let i = 0; i < 30; i += 1) g.props.update(0.05, g.player.pos, false);
      const angle = prop.getObjectByName("hinge").rotation.y;
      g.world.set(x, dy, z, 0);
      return angle;
    };
    out.doorOpened = opens(ids.DOOR, dx, dz) < -1;
    out.gateOpened = opens(ids.GATE, dx, dz) < -1;
    out.farGateClosed = Math.abs(opens(ids.GATE, dx + 6, dz)) < 0.01;
    return out;
  }, { renewed: RENEWED, ids: B, dims: WORLD });

  expect(RENEWED.length === EXPECTED, `この編の設置物がすべてそろっている (${RENEWED.length}種)`);
  const missing = PROP_BLOCKS.filter((n) => !RENEWED.includes(n));
  expect(missing.length === 0 && PROP_BLOCKS.length === RENEWED.length, `設置物のブロックは すべて prop-models.js の3Dで描く (3Dの無いブロック: ${missing.join(", ")})`);
  for (const name of RENEWED) {
    const r = report[name];
    expect(r.built, `${name} が PropRenderer で組み上がる`);
    if (NO_OUTLINE.has(name)) expect(r.meshes > (name === "WEDGE_MARK" ? 2 : 4), `${name} に部品がある (${r.meshes})`);
    else expect(r.outlines > 0 && r.meshes > r.outlines, `${name} に輪郭線つきの部品がある (部品 ${r.meshes - r.outlines}・輪郭線 ${r.outlines})`);
    const need = REQUIRED[name];
    if (need?.name) expect(r.names.includes(need.name), `${name} に部品「${need.name}」が残る`);
    if (need?.flag) expect(r.flags.includes(need.flag), `${name} に目印 userData.${need.flag} が残る`);
  }
  expect(RENEWED.every((n) => report[n].removed), "ブロックを消すと 設置物の3Dも消える");
  const plain = TEXTURED.filter((n) => !(report[n]?.textured > 0));
  expect(plain.length === 0, `木・石の設置物は ブロックの模様を貼っている (模様の無いもの: ${plain.join(", ")})`);
  expect(report.fishSpot && report.waterUnderFish >= 4, `魚のかげの下にも 水面を描く (${report.fishSpot}: 頂点${report.waterUnderFish}個)`);
  expect(report.fenceRails === 2, `柵は 新しい隣の柵へ 横木を2本渡す (${report.fenceRails})`);
  expect(report.gateRails === 2 && report.railsRemoved === 0, `柵は 隣の門へも横木を渡し、隣が無くなれば外す (${report.gateRails}→${report.railsRemoved})`);
  expect(report.doorOpened, "扉の蝶番は プレイヤーが近づくと開く");
  expect(report.gateOpened && report.farGateClosed, "門の蝶番も プレイヤーが近づくと開く（離れた門は閉じたまま）");
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors)})`);
  console.log("prop-models.test: PASS");
} finally {
  await browser.close();
}

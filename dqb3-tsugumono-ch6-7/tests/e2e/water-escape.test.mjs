// 住民の水中待機防止と救出の回帰テスト（前の2編から引き継いだ水中対策）。
// ダーマの島の水辺は、南の海（桟橋のまわり。岸は水底から3段の高さ）と、谷の底の沢。
// どちらも住民が歩いて登れる岸ではないので、落ちた住民は次のようにして陸へ戻る。
// 1) 海へ落ちた住民は、立ち泳ぎで待機せず岸へ向かい、登れないまま水に留まると
//    数秒で最寄りの乾いた床へ救出される（プレイヤーの操作は要らない）。
// 2) 水中に長時間留まった（＝物理的に詰まった）住民は、次の更新ですぐ救出される（谷の底の沢）。
// ゲーム内の時間は fastForward で進める（実時間のループは止めておく）。

import { launchBrowser, openGame, newGame, expect, pauseLoop, fastForward } from "../helpers.mjs";
import { WORLD } from "../../src/world/world.js";

// 住民の状態（水の中か・足もとの地面が水面より上か）。
const stateOf = (page, id) => page.evaluate(({ id, waterLevel }) => {
  const g = window.__game;
  const v = g.villager(id);
  const ground = g.world.terrainSurfaceY(v.pos.x, v.pos.z);
  return {
    x: v.pos.x, y: v.pos.y, z: v.pos.z, inWater: v.inWater, ground, waterT: v.waterT,
    dry: !v.inWater && ground > waterLevel && v.pos.y >= ground - 0.01,
    stuckInBlock: v.collides(g.world, v.pos.x, v.pos.y, v.pos.z),
  };
}, { id, waterLevel: WORLD.WATER_LEVEL });
const fmt = (s) => `x=${s.x.toFixed(1)}, y=${s.y.toFixed(1)}, z=${s.z.toFixed(1)}`;

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await pauseLoop(page, true);

  // --- 海へ落ちた住民: 岸へ向かい、登れなければ救出される ------------------------------
  // アサギ・ガンゾウは第6章の途中から加わる人物で、ニューゲーム直後の進行とは干渉しない。
  await page.evaluate(() => {
    const g = window.__game;
    g.monsters.spawnTimer = 1e6; // 山道の敵は出さない（住民の動きだけを見る）
    const v = g.spawnVillager("asagi", 38.5, 99.5);
    v.home.set(38.5, g.world.terrainSurfaceY(38.5, 99.5) + 0.1, 99.5); // 砂浜（陸）
    v.pos.set(38.5, 3.4, 106.5); // 桟橋の東の海（浜のすぐ沖）
    v.vel.set(0, 0, 0);
    v.moveTarget = null;
  });
  await fastForward(page, 2);
  const swimming = await stateOf(page, "asagi");
  expect(!swimming.dry && swimming.waterT > 1, `落ちた直後は水の中にいる (${fmt(swimming)})`);
  expect(swimming.z < 105.5, `立ち泳ぎで待機せず、岸（北）へ向かう (z=106.5→${swimming.z.toFixed(1)})`);

  let landed = null;
  let seconds = 2;
  while (seconds < 14 && !landed) {
    await fastForward(page, 1);
    seconds += 1;
    const s = await stateOf(page, "asagi");
    if (s.dry) landed = s;
  }
  expect(landed, `海へ落ちた住民が、操作なしで陸へ戻る (${seconds}秒後)`);
  expect(!landed.stuckInBlock, `戻った先でブロックに埋まらない (${fmt(landed)})`);
  await fastForward(page, 4);
  const settled = await stateOf(page, "asagi");
  expect(settled.dry && settled.waterT === 0, `陸へ戻った後は 海へ入り直さない (${fmt(settled)})`);

  // --- 救出: 長時間水中に留まった住民は、次の更新で陸へ引き上げる（谷の底の沢） ---------
  const before = await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("ganzou", 30.5, 86.5);
    v.home.set(30.5, g.world.terrainSurfaceY(30.5, 86.5) + 0.1, 86.5); // 麓の集落（谷の南）
    v.pos.set(32.5, 2.4, 71.5); // 落ちた橋の下の沢
    v.vel.set(0, 0, 0);
    v.moveTarget = null;
    v.waterT = 20; // 「長時間水中に留まった」状態を再現 → 次の更新で救出される
    return { surface: g.world.waterSurfaceY(32.5, 71.5), ground: g.world.terrainSurfaceY(32.5, 71.5) };
  });
  expect(before.surface > 2.4 && before.ground <= WORLD.WATER_LEVEL, `谷の底は沢の水 (水面 ${before.surface}・水底 ${before.ground})`);
  await fastForward(page, 0.1);
  const rescued = await stateOf(page, "ganzou");
  expect(rescued.dry && !rescued.stuckInBlock, `詰まった住民が陸へ救出される (${fmt(rescued)})`);
  expect(Math.hypot(rescued.x - 32.5, rescued.z - 71.5) <= 10.8, `救出先は 落ちた場所の近く (${fmt(rescued)})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("water-escape.test: PASS");
} finally {
  await browser.close();
}

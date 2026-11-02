// 住民の水中待機防止と救出テレポートの回帰テスト。
// （本島編 ch1-3 の 0eb220a / 9459e20 で実装済みの水中対策の移植）
// 1) 平時に海へ落ちた住民は、立ち泳ぎで待機せず自力で北岸の浜へ上がる。
// 2) 水中に長時間留まった（＝物理的に詰まった）住民は、最寄りの床へ救出される。

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 平時の自力上陸: 海岸拠点そばの海に落とす --------------------------------------
  // スミ・テルは第5章キャラで、ニューゲーム直後の第4章進行とは干渉しない。
  await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("sumi", 26, 6);
    v.home.set(26.5, 5, 6.5); // 海岸拠点（陸）
    v.pos.set(26.5, 3.4, 2.5); // 北岸の海（浜のすぐ沖）
    v.moveTarget = null;
  });
  await waitForCond(
    page,
    () => {
      const g = window.__game;
      const v = g.villager("sumi");
      return !v.inWater && g.world.terrainSurfaceY(v.pos.x, v.pos.z) > 3;
    },
    undefined,
    { label: "水中の住民が自力で上陸する", timeout: 30000, interval: 300 },
  );

  // --- 救出テレポート: 長時間水中に留まった住民は陸へ引き上げる ----------------------
  await page.evaluate(() => {
    const g = window.__game;
    const v = g.spawnVillager("teru", 26, 6);
    v.home.set(26.5, 5, 6.5);
    v.pos.set(20.5, 3.4, 2.5); // 北岸の海
    v.waterT = 20; // 「長時間水中に留まった」状態を再現 → 次の更新で救出される
  });
  await waitForCond(
    page,
    () => {
      const g = window.__game;
      const v = g.villager("teru");
      return !v.inWater && g.world.terrainSurfaceY(v.pos.x, v.pos.z) > 3;
    },
    undefined,
    { label: "詰まった住民が陸へ救出される", timeout: 10000, interval: 200 },
  );

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("water-escape.test: PASS");
} finally {
  await browser.close();
}

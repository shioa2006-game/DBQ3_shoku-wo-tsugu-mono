// 峠の進入制御の回帰テスト（実装ガイド 7 章）。
// - 第4章中（bambooPassOpen=false）はプレイヤーの z 座標が GATE_Z を超えられない
// - フラグを立てると通過できる（第5章の開通処理が使う下地）

import { launchBrowser, openGame, newGame, expect, waitForCond, sleep } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // 峠の向こう（竹林側）へ強制テレポート → フレーム処理で GATE_Z に戻される。
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(32.5, 20, 60.5); // 峠の中（GATE_Z より南）
    g.player.vel.set(0, 0, 0);
  });
  await sleep(600);
  const clamped = await page.evaluate(() => window.__game.player.pos.z);
  expect(clamped <= 54.01, `峠閉鎖中は z<=GATE_Z(54) に押し戻される (z=${clamped.toFixed(2)})`);

  // 竹林側には手動でブロックを置けない（抜け道の封じ）。
  const placeBlocked = await page.evaluate(() => {
    const g = window.__game;
    // primaryAction のガードと同じ条件を直接確認する。
    return !g.passOpen; // ガードは !passOpen && z>GATE_Z で発動
  });
  expect(placeBlocked, "peak閉鎖フラグ: passOpen=false（設置ガードが有効）");

  // 第5章に入ると、壁は峠の出口（z=63）まで下がり、封鎖の作業場へ入れる。
  // （黒竹＝竹材の入手源が z55..61 にあるため。開通前は z63 で止まる）
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.stage = "CH5_BAMBOO_GATE";
    g.player.pos.set(44.5, 14, 58.5); // 封鎖の中（黒竹のそば）
    g.player.vel.set(0, 0, 0);
  });
  await sleep(600);
  const ch5Work = await page.evaluate(() => window.__game.player.pos.z);
  expect(ch5Work > 54 && ch5Work <= 63.01, `第5章中は封鎖の作業場（z55..63）に入れる (z=${ch5Work.toFixed(2)})`);
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(44.5, 14, 70.5); // 竹林側へは、まだ行けない
    g.player.vel.set(0, 0, 0);
  });
  await sleep(600);
  const ch5Clamp = await page.evaluate(() => window.__game.player.pos.z);
  expect(ch5Clamp <= 63.01, `第5章でも開通までは z<=63 に押し戻される (z=${ch5Clamp.toFixed(2)})`);
  await page.evaluate(() => {
    window.__game.quests.stage = "CH4_ARRIVAL"; // 後続の検証のため戻す
  });

  // 開通フラグを立てると越えられる（第5章 CH5_BAMBOO_GATE の開通処理が立てる）。
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.flags.bambooPassOpen = true;
    g.player.pos.set(32.5, 20, 70.5); // 竹林側
    g.player.vel.set(0, 0, 0);
  });
  await sleep(600);
  const passed = await page.evaluate(() => ({
    z: window.__game.player.pos.z,
    open: window.__game.passOpen,
  }));
  expect(passed.open === true, "bambooPassOpen=true で passOpen が立つ");
  expect(passed.z > 54, `開通後は竹林側に留まれる (z=${passed.z.toFixed(2)})`);

  // 竹林側の地形（苔・竹・内社・源泉盆地の水）が第4章時点で生成されている。
  const south = await page.evaluate(() => {
    const g = window.__game;
    const W = 64;
    let moss = 0, bamboo = 0, water = 0;
    for (let z = 64; z < 112; z += 1) {
      for (let x = 0; x < W; x += 1) {
        for (let y = 0; y < 32; y += 1) {
          const id = g.world.get(x, y, z);
          if (id === 51) moss += 1; // B.MOSS
          if (id === 52) bamboo += 1; // B.BAMBOO
          if (id === 5 && z > 90) water += 1; // 清めの泉
        }
      }
    }
    return { moss, bamboo, water };
  });
  expect(south.moss > 200, `竹林側に苔の地面が生成されている (${south.moss})`);
  expect(south.bamboo > 50, `竹が生成されている (${south.bamboo})`);
  expect(south.water > 10, `源泉盆地に泉の水がある (${south.water})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("region-gate.test: PASS");
} finally {
  await browser.close();
}

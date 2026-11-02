// 固定 New Game 状態の回帰テスト（実装ガイド 5 章）。
// - 本島編の正史を組み込んだ固定状態: 仲間4人、復活済みの書4冊、最低限の装備
// - 開始ステージ CH4_ARRIVAL、上陸海岸に配置、峠は閉鎖

import { launchBrowser, openGame, newGame, stage, expect } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  expect((await stage(page)) === "CH4_ARRIVAL", "開始ステージは CH4_ARRIVAL");

  // パーティー: シオン（プレイヤー）＋ミナ・ゴンタ・ワタリ、浜にカヤ。
  const vill = await page.evaluate(() => window.__game.villagers.map((v) => v.id).sort());
  for (const id of ["mina", "gonta", "watari", "kaya"]) {
    expect(vill.includes(id), `${id} が配置されている (${vill})`);
  }

  // 書: ビルダー・農民・料理人・船乗り＝復活済み、鍛冶屋・僧侶＝未復活。
  const jobs = await page.evaluate(() => {
    const j = window.__game.jobs;
    return {
      builder: j.isRevived("builder"),
      farmer: j.isRevived("farmer"),
      cook: j.isRevived("cook"),
      sailor: j.isRevived("sailor"),
      blacksmith: j.isRevived("blacksmith"),
      priest: j.isRevived("priest"),
      count: j.bookData().length,
    };
  });
  expect(jobs.count === 6, `書は6冊 (${jobs.count})`);
  expect(jobs.builder && jobs.farmer && jobs.cook && jobs.sailor, "ビルダー/農民/料理人/船乗りは復活済み");
  expect(!jobs.blacksmith && !jobs.priest, "鍛冶屋/僧侶は未復活");

  // 固定初期装備。
  const inv = await page.evaluate(() => ({
    hammer: window.__game.inventory.count("hammer_stone"),
    sword: window.__game.inventory.count("sword_copper"),
    food: window.__game.inventory.count("herb") + window.__game.inventory.count("onigiri"),
  }));
  expect(inv.hammer === 1, `石のハンマー×1 (${inv.hammer})`);
  expect(inv.sword === 1, `銅の剣×1 (${inv.sword})`);
  expect(inv.food > 0, `少量の食料 (${inv.food})`);

  // 開始位置は北岸の上陸海岸（z<12）で、峠は閉鎖されている。
  const state = await page.evaluate(() => ({
    z: window.__game.player.pos.z,
    passOpen: window.__game.passOpen,
  }));
  expect(state.z < 12, `開始位置は上陸海岸 (z=${state.z.toFixed(1)})`);
  expect(state.passOpen === false, "峠は閉鎖状態から始まる");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("newgame-state.test: PASS");
} finally {
  await browser.close();
}

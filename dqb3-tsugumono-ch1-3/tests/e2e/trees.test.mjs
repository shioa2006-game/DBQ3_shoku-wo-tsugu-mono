// 木の再生システム（systems/trees.js）の回帰テスト。
// 伐った木が数日で再生すること、建てた跡地には再生しないこと（占有チェック）を検証する。
// 実時間の成長待ちは避け、update(dt) に大きな dt を渡して満了まで一気に進める。

import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const B = { AIR: 0, GRASS: 1, LOG: 6, WALL: 10 };
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await openGame(page);
  await newGame(page);

  // --- 伐採 → 再生予約 → 満了で元の木が生える ------------------------------------
  const grow = await page.evaluate(({ B }) => {
    const g = window.__game;
    const x = 10, z = 10, y = 8; // 北の島(z<64)の任意の列。テスト用に地形を作り込む。
    g.world.set(x, y - 1, z, B.GRASS); // 根元の下は自然の草
    for (let i = 0; i <= 5; i += 1) g.world.set(x, y + i, z, B.AIR); // 幹の列を空ける
    g.world.set(x, y, z, B.LOG); // 幹の根元
    g.breakBlock(x, y, z, { drops: "log" }); // 実プレイと同じ伐採経路
    const queued = g.trees.regrow.has(`${x},${y},${z}`);
    g.trees.update(1000); // 満了まで一気に進める（>750s相当）
    return { queued, block: g.world.get(x, y, z), pending: g.trees.regrow.size };
  }, { B });
  expect(grow.queued, "伐採で根元に再生が予約される");
  expect(grow.block === B.LOG, `満了で木(LOG)が再生する (block=${grow.block})`);
  expect(grow.pending === 0, "再生済みの予約は消える");

  // --- 建てた跡地には再生しない（占有チェックでキャンセル） --------------------------
  const built = await page.evaluate(({ B }) => {
    const g = window.__game;
    const x = 14, z = 14, y = 8;
    g.world.set(x, y - 1, z, B.GRASS);
    for (let i = 0; i <= 5; i += 1) g.world.set(x, y + i, z, B.AIR);
    g.world.set(x, y, z, B.LOG);
    g.breakBlock(x, y, z, { drops: "log" }); // 伐採して予約
    g.world.set(x, y, z, B.WALL); // 跡地に建てる（根元を塞ぐ）
    g.trees.update(1000); // 満了
    return { block: g.world.get(x, y, z), pending: g.trees.regrow.size };
  }, { B });
  expect(built.block === B.WALL, `建てた跡地は木で上書きされない (block=${built.block})`);
  expect(built.pending === 0, "塞がれた予約はキャンセルされる");

  // --- 南の島(第2章)では予約しない ---------------------------------------------------
  const south = await page.evaluate(({ B }) => {
    const g = window.__game;
    const x = 30, z = 90, y = 8; // z>=64 は南の島
    g.world.set(x, y - 1, z, B.GRASS);
    g.world.set(x, y, z, B.LOG);
    g.breakBlock(x, y, z, { drops: "log" });
    return g.trees.regrow.has(`${x},${y},${z}`);
  }, { B });
  expect(south === false, "南の島では木の再生を予約しない");

  // --- セーブ/ロードで保留中の再生が復元される --------------------------------------
  const restored = await page.evaluate(({ B }) => {
    const g = window.__game;
    const x = 18, z = 12, y = 8;
    g.world.set(x, y - 1, z, B.GRASS);
    for (let i = 0; i <= 5; i += 1) g.world.set(x, y + i, z, B.AIR);
    g.world.set(x, y, z, B.LOG);
    g.breakBlock(x, y, z, { drops: "log" }); // 予約（進行度0付近）
    const ser = g.trees.serialize();
    g.trees.load([]); // いったん空に
    g.trees.load(ser); // 復元
    return g.trees.regrow.has(`${x},${y},${z}`);
  }, { B });
  expect(restored, "保留中の再生がセーブ形式で往復復元される");

  console.log("trees.test: PASS");
} finally {
  await browser.close();
}

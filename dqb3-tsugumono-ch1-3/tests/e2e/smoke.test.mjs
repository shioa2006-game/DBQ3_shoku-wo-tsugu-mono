// 高速・決定論スモークテスト（PR 必須ゲート用）。
// ゲームが起動し主要サブシステムが揃い、コンソールエラー無くタイトル→ニューゲームまで
// 進めることだけを検証する。ゲーム内時間に依存する重い通し（story/chapter2 等）は
// 夜間/手動のフルスイートに任せ、ここはマシン負荷でフレークしない範囲に絞る。

import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";

const browser = await launchBrowser();
const page = await browser.newPage();
const errors = [];

try {
  await openGame(page, { collectErrors: errors });

  // ゲーム本体と主要サブシステムがぶら下がっている。
  const wired = await page.evaluate(() => {
    const g = window.__game;
    if (!g) return null;
    return {
      world: !!g.world,
      quests: !!g.quests,
      jobs: !!g.jobs,
      ui: !!g.ui,
      water: !!g.water,
      inventory: !!g.inventory,
      player: !!g.player,
    };
  });
  expect(wired, "window.__game が生成されている");
  for (const key of ["world", "quests", "jobs", "ui", "water", "inventory", "player"]) {
    expect(wired[key], `サブシステム ${key} が存在する`);
  }

  // ワールド寸法が規約どおり（南マップ拡張後: W64×D112×H24）。ビルド後のバンドルでも
  // 検証できるよう world.inBounds() の境界で判定する（dev import に依存しない）。
  const dims = await page.evaluate(() => {
    const w = window.__game.world;
    return {
      x: w.inBounds(63, 0, 0) && !w.inBounds(64, 0, 0),
      z: w.inBounds(0, 0, 111) && !w.inBounds(0, 0, 112),
      y: w.inBounds(0, 23, 0) && !w.inBounds(0, 24, 0),
    };
  });
  expect(dims.x, "ワールド幅 W=64 (x境界)");
  expect(dims.z, "ワールド奥行 D=112 (z境界・南マップ拡張)");
  expect(dims.y, "ワールド高さ H=24 (y境界)");

  // タイトル→ニューゲームでプレイ状態に入り、プレイヤーが配置される。
  await newGame(page);
  await waitForCond(
    page,
    () => !!window.__game.player && !!window.__game.player.pos,
    undefined,
    { label: "player.pos ready", timeout: 15000 },
  );
  const inWorld = await page.evaluate(() => {
    const p = window.__game.player.pos;
    return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
  });
  expect(inWorld, "ニューゲーム後にプレイヤーがワールドに配置される");

  // 世界の底より下（範囲外）の仮想の石は、照準のレイキャストに当たらない。
  // 当たると「掘っても消えず、ドロップだけ湧き続ける無限の石」になる（再発防止）。
  const oobHit = await page.evaluate(() => {
    const g = window.__game;
    g.world.set(5, 0, 5, 0); // 海底の隅の底を1マスだけ開ける（テスト専用）
    return g.world.raycast({ x: 5.5, y: 0.5, z: 5.5 }, { x: 0, y: -1, z: 0 }, 8);
  });
  expect(oobHit === null, `世界外の仮想ブロックは照準に当たらない (${JSON.stringify(oobHit)})`);

  // 起動〜ニューゲームでコンソールエラーが出ていない。
  expect(errors.length === 0, `コンソールエラーなし${errors.length ? ` (実際: ${errors.slice(0, 3).join(" / ")})` : ""}`);

  console.log("smoke.test: PASS");
} finally {
  await browser.close();
}

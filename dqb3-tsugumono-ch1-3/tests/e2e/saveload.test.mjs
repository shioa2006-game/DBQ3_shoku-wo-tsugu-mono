// セーブ/ロードの回帰テスト。
// - 建てかけ設計図の基準高(baseY)がリロード後も不変（過去の「設計図が浮く」バグの再発防止）
// - baseYを持たない旧形式セーブでも pristine 地形から正しい高さへ復元される
// - インベントリとステージのラウンドトリップ

import { launchBrowser, openGame, newGame, dlg, stage, expect, SAVE_KEY } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // 社を残り2マスまで建てて BUILD_SHRINE でセーブ。
  const built = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    const P = { x: 28, z: 16 }; // PLACES.shrine
    const baseY = g.world.pristineSurfaceY(P.x + 2, P.z + 2);
    const bp = g.blueprints.activate("shrine", P, baseY);
    let left = 2;
    for (const c of [...bp.cells].reverse()) {
      if (left > 0 && c.block === 3) {
        left -= 1;
        continue; // 石床を2マス残す
      }
      g.world.set(c.x, c.y, c.z, c.block);
    }
    g.inventory.add("stone", 5);
    g.quests.stage = "BUILD_SHRINE";
    g.autosave();
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      baseY,
      savedBaseY: raw.blueprint?.baseY,
      remaining: bp.cells.filter((c) => g.world.get(c.x, c.y, c.z) !== c.block).length,
      stoneCount: g.inventory.count("stone"),
    };
  }, SAVE_KEY);
  expect(built.savedBaseY === built.baseY, `セーブにbaseYが保存される (${built.savedBaseY})`);
  expect(built.remaining === 2, `残り2マスで保存 (${built.remaining})`);

  // --- 新形式セーブ: リロードしてもbaseY不変・残りマス数一致 -------------------------
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  await dlg(page);
  const round1 = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    return {
      baseY: bp ? Math.min(...bp.cells.map((c) => c.y)) : null,
      remaining: bp ? bp.cells.filter((c) => g.world.get(c.x, c.y, c.z) !== c.block).length : null,
      stage: g.quests.stage,
      stoneCount: g.inventory.count("stone"),
    };
  });
  expect(round1.baseY === built.baseY, `リロード後もbaseY不変 (${built.baseY} -> ${round1.baseY})`);
  expect(round1.remaining === 2, `リロード後も残り2マス (${round1.remaining})`);
  expect(round1.stage === "BUILD_SHRINE", `ステージ復元 (${round1.stage})`);
  expect(round1.stoneCount === built.stoneCount, `インベントリ復元 (石 ${round1.stoneCount})`);

  // --- 旧形式セーブ(baseYなし): pristine地形から同じ高さへ復元 ------------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (raw.blueprint) delete raw.blueprint.baseY; // 旧デプロイ版が書いた形式を再現
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  await dlg(page);
  const legacy = await page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    return bp ? Math.min(...bp.cells.map((c) => c.y)) : null;
  });
  expect(legacy === built.baseY, `旧形式セーブでもbaseY復元 (${legacy})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("saveload.test: PASS");
} finally {
  await browser.close();
}

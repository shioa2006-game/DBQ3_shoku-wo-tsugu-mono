// ワールド生成バージョン管理の回帰テスト。
// - セーブに world {version, seed, size} が記録される
// - バージョン一致なら従来どおり無確認でロード
// - 不一致なら警告ダイアログを出し、「やめる」でタイトルへ戻る（セーブは残る）、
//   「それでも読み込む」で通常ロードされる

import { launchBrowser, openGame, newGame, stage, expect, SAVE_KEY } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // セーブを作る（GATHER_WOOD で autosave が効く状態）。
  const saved = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    g.inventory.add("log", 3);
    g.autosave();
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { world: raw.world, stage: raw.stage.stage };
  }, SAVE_KEY);
  expect(saved.world?.version === 2, `セーブに world.version が記録される (${JSON.stringify(saved.world)})`);
  expect(Array.isArray(saved.world?.size) && saved.world.size.length === 3, `world.size を記録 (${saved.world.size})`);
  expect(typeof saved.world?.seed === "number", `world.seed を記録 (${saved.world.seed})`);

  // --- バージョン一致: 無確認でロード ------------------------------------------------
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  const normal = await page.evaluate(() => ({
    started: window.__game.started,
    choiceOpen: !window.__game.ui.choiceBox.classList.contains("hidden"),
  }));
  expect(normal.started === true && normal.choiceOpen === false, "一致時は確認なしでロードされる");

  // --- 既知の非破壊移行: v1(64x64x24) セーブは無警告でロードされる ----------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    raw.world = { version: 1, size: [64, 64, 24] }; // 南拡張前のセーブを再現
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  const migrated = await page.evaluate(() => ({
    started: window.__game.started,
    choiceOpen: !window.__game.ui.choiceBox.classList.contains("hidden"),
  }));
  expect(migrated.started === true && migrated.choiceOpen === false, "v1セーブ(Dのみ増加)は無警告で移行ロード");

  // --- バージョン不一致: 警告 → やめる → タイトルへ（セーブは残る） --------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    raw.world.version = 999; // 将来の生成変更後に旧セーブを読む状況を再現
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(600);
  const warn = await page.evaluate(() => ({
    choiceOpen: !window.__game.ui.choiceBox.classList.contains("hidden"),
    buttons: [...document.querySelectorAll(".choice-panel button")].map((b) => b.textContent),
    started: window.__game.started,
  }));
  expect(warn.choiceOpen === true && warn.started === false, "不一致時は警告ダイアログが出てロードは保留");
  expect(warn.buttons.length === 2, `選択肢は2つ (${JSON.stringify(warn.buttons)})`);

  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[1].click()); // やめる
  await page.waitForTimeout(400);
  const backToTitle = await page.evaluate((SAVE_KEY) => ({
    titleVisible: !window.__game.ui.title.classList.contains("hidden"),
    saveIntact: !!localStorage.getItem(SAVE_KEY),
  }), SAVE_KEY);
  expect(backToTitle.titleVisible === true, "「やめる」でタイトルに戻る");
  expect(backToTitle.saveIntact === true, "セーブデータは消えない");

  // --- バージョン不一致: それでも読み込む → 通常ロード --------------------------------
  await page.click(".btn-continue");
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[0].click()); // 読み込む
  await page.waitForTimeout(1200);
  const forced = await page.evaluate(() => ({
    started: window.__game.started,
    logs: window.__game.inventory.count("log"),
  }));
  expect(forced.started === true, "「それでも読み込む」でロードされる");
  expect(forced.logs >= 3, `インベントリも復元 (log ${forced.logs})`);
  expect((await stage(page)) === "GATHER_WOOD", "ステージも復元");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("worldversion.test: PASS");
} finally {
  await browser.close();
}

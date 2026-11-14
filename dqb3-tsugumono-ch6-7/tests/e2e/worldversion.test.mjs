// ワールド生成バージョン管理の回帰テスト。
// - セーブに world {version, seed, size} が記録される（ダーマ再興編は 64×120×40。version は WORLD.GEN_VERSION）
// - バージョン一致なら従来どおり無確認でロード
// - 不一致なら警告ダイアログを出し、「やめる」でタイトルへ戻る（セーブは残る）、
//   「それでも読み込む」で通常ロードされる

import { launchBrowser, openGame, newGame, stage, expect, waitForCond, talk, activeBlueprint, SAVE_KEY } from "../helpers.mjs";
import { WORLD } from "../../src/world/world.js";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // セーブを作る（開始直後と見分けがつくよう、スズハと話して設計図を開いておく）。
  await talk(page, "suzuha");
  const saved = await page.evaluate((SAVE_KEY) => {
    const g = window.__game;
    g.inventory.add("log", 3);
    g.autosave();
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { world: raw.world, stage: raw.stage.stage };
  }, SAVE_KEY);
  expect(
    Number.isInteger(saved.world?.version) && saved.world.version >= 1 && saved.world.version === WORLD.GEN_VERSION,
    `セーブに world.version（生成の世代 ${WORLD.GEN_VERSION}）が記録される (${JSON.stringify(saved.world)})`,
  );
  expect(
    Array.isArray(saved.world?.size) && saved.world.size.join(",") === "64,120,40",
    `world.size は 64×120×40 (${saved.world.size})`,
  );
  expect(saved.world?.seed === WORLD.SEED && typeof saved.world.seed === "number", `world.seed を記録 (${saved.world.seed})`);
  expect(saved.stage === "CH6_ARRIVAL", `セーブのステージ (${saved.stage})`);

  // --- バージョン一致: 無確認でロード ------------------------------------------------
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".btn-continue:not([disabled])");
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started === true, undefined, { label: "loaded without a prompt" });
  const normal = await page.evaluate(() => ({
    started: window.__game.started,
    choiceOpen: !window.__game.ui.choiceBox.classList.contains("hidden"),
  }));
  expect(normal.started === true && normal.choiceOpen === false, "一致時は確認なしでロードされる");

  // --- バージョン不一致: 警告 → やめる → タイトルへ（セーブは残る） --------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    raw.world.version = 999; // 将来の生成変更後に旧セーブを読む状況を再現
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".btn-continue:not([disabled])");
  await page.click(".btn-continue");
  await waitForCond(page, () => document.querySelectorAll(".choice-panel button").length > 0, undefined, { label: "mismatch warning" });
  const warn = await page.evaluate(() => ({
    choiceOpen: !window.__game.ui.choiceBox.classList.contains("hidden"),
    buttons: [...document.querySelectorAll(".choice-panel button")].map((b) => b.textContent),
    started: window.__game.started,
  }));
  expect(warn.choiceOpen === true && warn.started === false, "不一致時は警告ダイアログが出てロードは保留");
  expect(warn.buttons.length === 2, `選択肢は2つ (${JSON.stringify(warn.buttons)})`);

  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[1].click()); // やめる
  await waitForCond(page, () => !window.__game.ui.title.classList.contains("hidden"), undefined, { label: "back to title" });
  const backToTitle = await page.evaluate((SAVE_KEY) => ({
    titleVisible: !window.__game.ui.title.classList.contains("hidden"),
    started: window.__game.started,
    saveIntact: !!localStorage.getItem(SAVE_KEY),
  }), SAVE_KEY);
  expect(backToTitle.titleVisible === true && backToTitle.started === false, "「やめる」でタイトルに戻る");
  expect(backToTitle.saveIntact === true, "セーブデータは消えない");

  // --- バージョン不一致: それでも読み込む → 通常ロード --------------------------------
  await page.click(".btn-continue");
  await waitForCond(page, () => document.querySelectorAll(".choice-panel button").length > 0, undefined, { label: "mismatch warning again" });
  await page.evaluate(() => document.querySelectorAll(".choice-panel button")[0].click()); // 読み込む
  await waitForCond(page, () => window.__game.started === true, undefined, { label: "forced load" });
  const forced = await page.evaluate(() => ({
    started: window.__game.started,
    logs: window.__game.inventory.count("log"),
  }));
  expect(forced.started === true, "「それでも読み込む」でロードされる");
  expect(forced.logs >= 3, `インベントリも復元 (log ${forced.logs})`);
  const progress = await page.evaluate(() => window.__game.quests.flags.suzuhaMet === true);
  expect((await stage(page)) === "CH6_ARRIVAL" && progress, "ステージと進行のフラグも復元");
  expect((await activeBlueprint(page)) === "slope_bridge", "開いていた設計図も復元");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("worldversion.test: PASS");
} finally {
  await browser.close();
}

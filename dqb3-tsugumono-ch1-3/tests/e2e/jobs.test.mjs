// 職業の書（データ駆動化された職業復活システム）の回帰テスト。
// - 初期状態: ビルダーの書のみ復活済み、農民の書は白紙で進捗0
// - 労働カウンタに応じて進捗ゲージが伸びる
// - revive() で復活演出→復活状態になる
// - 復活状態がセーブ/ロードで保持される
// - jobs キーを持たない旧セーブは「PREPARE以降なら農民復活」の旧ルールから導出

import { launchBrowser, openGame, newGame, expect, SAVE_KEY } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 初期状態 -------------------------------------------------------------------
  const initial = await page.evaluate(() => window.__game.jobs.bookData());
  expect(initial.length === 4, `書は4冊（ビルダー/農民/料理人/船乗り） (${initial.length})`);
  expect(initial[0].revived === true && initial[0].name === "ビルダーの書", "ビルダーの書は最初から復活済み");
  expect(initial[1].revived === false && initial[1].progress === 0, "農民の書は白紙・進捗0");

  // --- 労働で進捗が伸びる -----------------------------------------------------------
  const mid = await page.evaluate(() => {
    const g = window.__game;
    g.quests.counters.planted = 8;
    g.quests.counters.harvested = 4;
    return g.jobs.bookData()[1].progress;
  });
  expect(Math.abs(mid - 0.75) < 1e-9, `植え8/収穫4で進捗0.75 (${mid})`);

  // --- 復活演出 → 復活状態 -----------------------------------------------------------
  await page.evaluate(() => {
    window.__game.jobs.revive("farmer", () => {
      window.__reviveDone = true;
    });
  });
  let reviveDone = false;
  for (let i = 0; i < 20 && !reviveDone; i += 1) {
    await page.waitForTimeout(500);
    reviveDone = await page.evaluate(() => !!window.__reviveDone);
  }
  expect(reviveDone, "復活演出が完了しコールバックが呼ばれる");
  const revived = await page.evaluate(() => {
    const g = window.__game;
    return { is: g.jobs.isRevived("farmer"), book: g.jobs.bookData()[1] };
  });
  expect(revived.is === true, "isRevived('farmer') が true");
  expect(revived.book.revived === true && revived.book.progress === 1, "書UIも復活済み・進捗1");

  // --- セーブ/ロードで保持 ------------------------------------------------------------
  await page.evaluate((SAVE_KEY) => {
    window.__game.autosave();
    return JSON.parse(localStorage.getItem(SAVE_KEY)).jobs;
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  const afterLoad = await page.evaluate(() => window.__game.jobs.isRevived("farmer"));
  expect(afterLoad === true, "リロード後も農民の書は復活済み");

  // --- 旧セーブ互換: jobsキーなし＋PREPARE以降 → 復活済みと導出 ------------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    delete raw.jobs; // 旧デプロイ版が書いたセーブを再現
    raw.stage.stage = "PREPARE";
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  const legacyRevived = await page.evaluate(() => window.__game.jobs.isRevived("farmer"));
  expect(legacyRevived === true, "旧セーブ(PREPARE)から農民復活を導出");

  // --- 旧セーブ互換: PREPARE より前なら未復活のまま ------------------------------------
  await page.evaluate((SAVE_KEY) => {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    delete raw.jobs;
    raw.stage.stage = "FARMING";
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.click(".btn-continue");
  await page.waitForTimeout(1500);
  const legacyLocked = await page.evaluate(() => window.__game.jobs.isRevived("farmer"));
  expect(legacyLocked === false, "旧セーブ(FARMING)では農民は未復活のまま");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("jobs.test: PASS");
} finally {
  await browser.close();
}

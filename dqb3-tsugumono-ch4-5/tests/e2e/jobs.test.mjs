// 職業の書（データ駆動化された職業復活システム）の回帰テスト。
// - 初期状態: 6冊（ビルダー/農民/料理人/船乗り=復活済み、鍛冶屋/僧侶=白紙）
// - 章の進行（施設完成・鍛造フラグ）に応じて鍛冶屋の書の進捗ゲージが伸びる
// - revive() で復活演出→復活状態になる
// - 復活状態がセーブ/ロードで保持される

import { launchBrowser, openGame, newGame, expect, SAVE_KEY } from "../helpers.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 初期状態 -------------------------------------------------------------------
  const initial = await page.evaluate(() => window.__game.jobs.bookData());
  expect(initial.length === 6, `書は6冊 (${initial.length})`);
  expect(initial[0].revived === true && initial[0].name === "ビルダーの書", "ビルダーの書は最初から復活済み");
  const blacksmith = initial[4];
  expect(blacksmith.name === "鍛冶屋の書" && blacksmith.revived === false && blacksmith.progress === 0, "鍛冶屋の書は白紙・進捗0");
  const priest = initial[5];
  expect(priest.name === "僧侶の書" && priest.revived === false, "僧侶の書は白紙（第5章）");

  // --- 章の進行で進捗が伸びる ---------------------------------------------------------
  const mid = await page.evaluate(() => {
    const g = window.__game;
    g.blueprints.completed.add("mine_entrance");
    g.blueprints.completed.add("kiln_site");
    g.quests.flags.forgedHammer = true;
    return g.jobs.bookData()[4].progress;
  });
  expect(Math.abs(mid - 3 / 7) < 1e-9, `鉱山入口+窯+ハンマーで進捗3/7 (${mid})`);

  // --- 復活演出 → 復活状態 -----------------------------------------------------------
  await page.evaluate(() => {
    window.__game.jobs.revive("blacksmith", () => {
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
    return { is: g.jobs.isRevived("blacksmith"), book: g.jobs.bookData()[4] };
  });
  expect(revived.is === true, "isRevived('blacksmith') が true");
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
  const afterLoad = await page.evaluate(() => ({
    blacksmith: window.__game.jobs.isRevived("blacksmith"),
    sailor: window.__game.jobs.isRevived("sailor"),
    priest: window.__game.jobs.isRevived("priest"),
  }));
  expect(afterLoad.blacksmith === true, "リロード後も鍛冶屋の書は復活済み");
  expect(afterLoad.sailor === true, "正史の書（船乗り）も復活済みのまま");
  expect(afterLoad.priest === false, "僧侶の書は白紙のまま");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("jobs.test: PASS");
} finally {
  await browser.close();
}

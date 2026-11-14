// 職業の書（データ駆動の職業の書システム）の回帰テスト。
// ダーマ再興編は、第5章までの正史を組み込んだ固定状態から始まる:
// - 初期状態: 6冊（職業の書/農民/料理人/船乗り/鍛冶屋/僧侶）とも最初から読める。進捗ゲージは満
// - この編で新しい書は復活しない。読める書へ revive() を呼んでも、復活の演出を出さずに完了する
// - 職業の書の画面（Bキー）に 6冊が読める書として並ぶ
// - 読める状態がセーブ/ロードで保持される
// 章の進行（授職・継承）で書が増えないことは chapter6/chapter7.test.mjs が確かめる。

import { launchBrowser, openGame, newGame, expect, waitForCond, SAVE_KEY } from "../helpers.mjs";

const BOOKS = [
  ["builder", "職業の書"], ["farmer", "農民の書"], ["cook", "料理人の書"],
  ["sailor", "船乗りの書"], ["blacksmith", "鍛冶屋の書"], ["priest", "僧侶の書"],
];
const IDS = BOOKS.map(([id]) => id);

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  // --- 初期状態 -------------------------------------------------------------------
  const initial = await page.evaluate(() => window.__game.jobs.bookData());
  expect(initial.length === 6, `書は6冊 (${initial.length})`);
  expect(initial.map((b) => b.name).join() === BOOKS.map(([, name]) => name).join(), `書の並び (${initial.map((b) => b.name)})`);
  expect(initial[0].revived === true && initial[0].name === "職業の書", "持ち出した職業の書は最初から読める");
  for (const [i, [, name]] of BOOKS.entries()) {
    const b = initial[i];
    expect(b.revived === true && b.progress === 1 && b.desc.length > 0, `${name}は復活済み・進捗1・説明つき`);
  }
  const revivedIds = await page.evaluate((ids) => ids.filter((id) => window.__game.jobs.isRevived(id)), IDS);
  expect(revivedIds.join() === IDS.join(), `isRevived は六冊とも true (${revivedIds})`);

  // --- 読める書へ revive() を呼んでも、演出を出さずに完了する -----------------------------
  const again = await page.evaluate(() => {
    const g = window.__game;
    let done = 0;
    g.jobs.revive("blacksmith", () => { done += 1; });
    return {
      done,
      popup: !g.ui.bookOverlay.classList.contains("hidden"),
      movie: g.movies.open,
      modal: g.ui.modalOpen,
      revived: g.jobs.isRevived("blacksmith"),
      count: g.jobs.bookData().length,
    };
  });
  expect(again.done === 1, "revive() はすぐ完了のコールバックを呼ぶ");
  expect(!again.popup && !again.movie && !again.modal, `復活の窓もムービーも出ない (${JSON.stringify(again)})`);
  expect(again.revived === true && again.count === 6, "鍛冶屋の書は読めるまま・6冊のまま");

  // --- 職業の書の画面（Bキー）: 6冊が読める書として並ぶ -------------------------------------
  await page.keyboard.press("b");
  await waitForCond(page, () => !window.__game.ui.bookOverlay.classList.contains("hidden"), undefined, { label: "job book opened" });
  const shown = await page.evaluate(() => ({
    rows: document.querySelectorAll(".jobbook-row").length,
    revived: document.querySelectorAll(".jobbook-row.revived").length,
    names: [...document.querySelectorAll(".jobbook-row .book-title")].map((n) => n.textContent.replace("📖", "").trim()),
    full: [...document.querySelectorAll(".jobbook-row .book-fill")].every((n) => n.style.width === "100%"),
  }));
  expect(shown.rows === 6 && shown.revived === 6, `書の画面に 6冊が読める書として並ぶ (${shown.revived}/${shown.rows})`);
  expect(shown.names.join() === BOOKS.map(([, name]) => name).join() && shown.full, `書の画面の名前と進捗ゲージ (${shown.names})`);
  await page.keyboard.press("b");
  await waitForCond(page, () => window.__game.ui.bookOverlay.classList.contains("hidden"), undefined, { label: "job book closed" });
  expect(true, "もう一度 B で閉じる");

  // --- セーブ/ロードで保持 ------------------------------------------------------------
  const savedJobs = await page.evaluate((SAVE_KEY) => {
    window.__game.autosave();
    return JSON.parse(localStorage.getItem(SAVE_KEY)).jobs;
  }, SAVE_KEY);
  expect([...savedJobs.revived].sort().join() === [...IDS].sort().join(), `セーブに六冊が記録される (${savedJobs.revived})`);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".btn-continue:not([disabled])");
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started === true, undefined, { label: "continue" });
  const afterLoad = await page.evaluate((ids) => ({
    revived: ids.filter((id) => window.__game.jobs.isRevived(id)),
    books: window.__game.jobs.bookData().filter((b) => b.revived && b.progress === 1).length,
  }), IDS);
  expect(afterLoad.revived.join() === IDS.join(), `リロード後も六冊とも読める (${afterLoad.revived})`);
  expect(afterLoad.books === 6, `リロード後の書の画面のデータも 6冊 (${afterLoad.books})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("jobs.test: PASS");
} finally {
  await browser.close();
}

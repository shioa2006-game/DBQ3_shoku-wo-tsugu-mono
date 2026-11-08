// SVGストーリームービー（assets/movies/、再生は game-shared/story-movies.mjs）の組み込みテスト。
// 他のテストは openGame の既定でムービーを止めて文字の演出を通すので、ここだけムービーを流す。
// - 「はじめから」で火山島編の始まり（M5）が全画面に重なり、世界が止まる
// - 最後まで見ると、導入会話から字幕と同じ行（地の文・書の振り返り）を省く／スキップすると全文
// - 書の復活（M2）はムービーに置き換わり、復活の窓は出ない
// - すべてのムービーがビルド後のゲームから読み込める。読み込めないときは文字の演出へ戻る

import { launchBrowser, openGame, dlg, expect, waitForCond, waitForStage } from "../helpers.mjs";

const browser = await launchBrowser();
const errors = [];

// 指定のムービーが重なり、再生中になるまで待って、その iframe を返す。
async function waitForMovie(page, id) {
  await waitForCond(page, (m) => document.querySelector(`.story-movie[data-movie="${m}"]`) !== null, id, { label: `overlay ${id}` });
  let frame = null;
  for (let i = 0; i < 100 && !frame; i += 1) {
    for (const f of page.frames()) {
      if (f === page.mainFrame()) continue;
      const state = await f.evaluate(() => (document.getElementById("movie") ?? document.getElementById("prologue"))?.dataset.state).catch(() => null);
      if (state === "playing") frame = f;
    }
    if (!frame) await page.waitForTimeout(150);
  }
  expect(frame, `${id}: ムービーが再生中になる`);
  return frame;
}

const movieClosed = (page) => waitForCond(page, () => document.querySelector(".story-movie") === null && !window.__game.movies.open, undefined, { label: "movie closed" });
const firstLine = (page) => page.evaluate(() => window.__game.ui.dialogue.open && window.__game.ui.dialogue.lines[0].text);
// 最後まで見た扱いで終える。終わると iframe ごと閉じるので、呼び出しは iframe の中で後に回す。
const complete = (frame) => frame.evaluate(() => { setTimeout(() => (window.ShokuMovie ?? window.ShokuPrologue).player._complete(false), 0); });

async function newPage() {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors, movies: true });
  return page;
}

try {
  // --- 火山島編の始まりを最後まで見る → 導入会話はワタリの台詞から -------------------------
  const page = await newPage();
  await page.click(".btn-new");
  let frame = await waitForMovie(page, "ch4-arrival");
  const during = await page.evaluate(() => ({ modal: window.__game.ui.modalOpen, dialogue: window.__game.ui.dialogue.open, busy: window.__game.quests.busy }));
  expect(during.modal && !during.dialogue && during.busy, `ムービーの間は世界が止まり、会話はまだ出ない (${JSON.stringify(during)})`);
  await complete(frame);
  await movieClosed(page);
  const trimmed = await page.evaluate(() => window.__game.ui.dialogue.lines.map((l) => l.text));
  expect(trimmed[0].startsWith("「見えたぞ、火山島じゃ。"), "最後まで見たときは、導入会話はワタリの台詞から始まる");
  expect(!trimmed.some((l) => l.includes("三つの書がよみがえった") || l.includes("潮風が、変わった")), "字幕と同じ地の文と書の振り返りを省く");
  await dlg(page);
  await waitForStage(page, "CH4_ARRIVAL");
  expect(true, "導入会話の後はカヤとの出会いへ進む");

  // --- 書の復活（鍛冶屋）はムービーに置き換わる ----------------------------------------------
  await page.evaluate(() => {
    window.__revived = false;
    window.__game.jobs.revive("blacksmith", () => { window.__revived = true; });
  });
  frame = await waitForMovie(page, "book-blacksmith");
  expect(await page.evaluate(() => window.__game.ui.bookOverlay.classList.contains("hidden")), "書の復活のムービー中は復活の窓を出さない");
  await page.keyboard.press("Escape");
  await movieClosed(page);
  await waitForCond(page, () => window.__revived === true, undefined, { label: "revive done" });
  const after = await page.evaluate(() => ({ revived: window.__game.jobs.isRevived("blacksmith"), popup: !window.__game.ui.bookOverlay.classList.contains("hidden") }));
  expect(after.revived && !after.popup, "Escでムービーを閉じると、鍛冶屋の書がよみがえって先へ進む（窓は出ない）");

  // --- すべてのムービーが読み込めて、閉じられる ---------------------------------------------
  const ids = await page.evaluate(() => Object.keys(window.__game.movies.urls));
  expect(ids.length === 4, `第4～5章のムービーは4本 (${ids.join(", ")})`);
  for (const id of ids) {
    await page.evaluate((m) => {
      window.__result = null;
      window.__game.movies.play(m).then((r) => { window.__result = r; });
    }, id);
    await waitForMovie(page, id);
    expect(await page.evaluate(() => window.__game.ui.modalOpen), `${id}: 再生中は ui.modalOpen`);
    await page.evaluate(() => window.__game.movies.skip());
    const result = await waitForCond(page, () => window.__result, undefined, { label: `${id} result` });
    expect(result.shown && result.skipped, `${id}: スキップで閉じる`);
  }

  // --- 読み込めないムービーは流さず、代わりの演出へ戻る ---------------------------------------
  const fallback = await page.evaluate(async () => {
    const Movies = window.__game.movies.constructor;
    const broken = new Movies({ missing: "data:text/html,<title>no movie</title>" }, { loadTimeout: 4000 });
    let fell = false;
    const r = await broken.playOr("missing", (done) => { fell = true; done(); });
    return { shown: r.shown, fell, left: document.querySelector(".story-movie") !== null };
  });
  expect(!fallback.shown && fallback.fell && !fallback.left, `読み込めないときは代わりの演出を出す (${JSON.stringify(fallback)})`);
  await page.close();

  // --- スキップ → 導入会話は全文 -------------------------------------------------------------
  const page2 = await newPage();
  await page2.click(".btn-new");
  await waitForMovie(page2, "ch4-arrival");
  await page2.keyboard.press("Escape");
  await movieClosed(page2);
  expect((await firstLine(page2))?.startsWith("……潮風が、変わった。"), "スキップしたときは導入会話を全文流す");
  await page2.close();

  expect(errors.length === 0, `コンソールエラーなし${errors.length ? ` (実際: ${errors.slice(0, 3).join(" / ")})` : ""}`);
  console.log("movies.test: PASS");
} finally {
  await browser.close();
}

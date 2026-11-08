// SVGストーリームービー（assets/movies/、再生は game-shared/story-movies.mjs）の組み込みテスト。
// 他のテストは openGame の既定でムービーを止めて文字の演出を通すので、ここだけムービーを流す。
// - 「はじめから」でプロローグ（M0）が全画面に重なり、世界が止まる
// - 最後まで見ると、導入会話からムービーと同じ地の文（先頭3行）を省く／スキップすると全文
// - 第2章の結び（M9）は勝利会話の後。最後まで見たときは書の最後の台詞を省く
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
  // 自動再生では、ムービー単体で開いたときの開始パネル（「…を見る」）を出さない
  const panel = await frame.evaluate(() => getComputedStyle(document.querySelector(".start-panel")).display);
  expect(panel === "none", `${id}: 開始パネルは出ない (${panel})`);
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
  // --- プロローグを最後まで見る → 導入会話は「……波の音が聞こえる。」から ---------------------
  const page = await newPage();
  await page.click(".btn-new");
  let frame = await waitForMovie(page, "prologue");
  const during = await page.evaluate(() => ({ modal: window.__game.ui.modalOpen, dialogue: window.__game.ui.dialogue.open, busy: window.__game.quests.busy }));
  expect(during.modal && !during.dialogue && during.busy, `プロローグの間は世界が止まり、会話はまだ出ない (${JSON.stringify(during)})`);
  await complete(frame);
  await movieClosed(page);
  expect((await firstLine(page)) === "……波の音が聞こえる。", "最後まで見たときは導入会話の先頭3行（ムービーと同じ語り）を省く");
  await dlg(page);
  await waitForStage(page, "GATHER_WOOD");
  expect(true, "導入会話の後は木材集めへ進む");

  // --- 書の復活（農民）はムービーに置き換わる ------------------------------------------------
  await page.evaluate(() => {
    window.__revived = false;
    window.__game.jobs.revive("farmer", () => { window.__revived = true; });
  });
  frame = await waitForMovie(page, "book-farmer");
  expect(await page.evaluate(() => window.__game.ui.bookOverlay.classList.contains("hidden")), "書の復活のムービー中は復活の窓を出さない");
  await page.keyboard.press("Escape");
  await movieClosed(page);
  await waitForCond(page, () => window.__revived === true, undefined, { label: "revive done" });
  const after = await page.evaluate(() => ({ revived: window.__game.jobs.isRevived("farmer"), popup: !window.__game.ui.bookOverlay.classList.contains("hidden") }));
  expect(after.revived && !after.popup, "Escでムービーを閉じると、農民の書がよみがえって先へ進む（窓は出ない）");

  // --- 第2章の結び（M9）: 最後まで見たときは書の最後の台詞を省く／スキップしたら後で流す -------
  const victory = async (watch) => {
    await page.evaluate(() => {
      window.__victory = false;
      window.__game.quests.ch2.playVictory(() => { window.__victory = true; });
    });
    await dlg(page);
    frame = await waitForMovie(page, "ch2-harvest");
    if (watch) await complete(frame);
    else await page.keyboard.press("Escape");
    await movieClosed(page);
    const rest = await firstLine(page);
    await dlg(page);
    await waitForCond(page, () => window.__victory === true, undefined, { label: "victory done" });
    return rest;
  };
  expect((await victory(true)) === false, "勝利会話 → ムービーを最後まで見たら、書の最後の台詞は流さずに終わる");
  const bookLine = await victory(false);
  expect(typeof bookLine === "string" && bookLine.includes("二冊の書が よみがえった"), "スキップしたときは、書の最後の台詞をムービーの後に流す");

  // --- すべてのムービーが読み込めて、閉じられる ---------------------------------------------
  const ids = await page.evaluate(() => Object.keys(window.__game.movies.urls));
  expect(ids.length === 7, `第1～3章のムービーは7本 (${ids.join(", ")})`);
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

  // --- プロローグをスキップ → 導入会話は全文 -----------------------------------------------
  const page2 = await newPage();
  await page2.click(".btn-new");
  await waitForMovie(page2, "prologue");
  await page2.keyboard.press("Escape");
  await movieClosed(page2);
  expect((await firstLine(page2)) === "勇者がゾーマを倒した。世界には平和が訪れるはずだった。", "スキップしたときは導入会話を全文流す");
  await page2.close();

  expect(errors.length === 0, `コンソールエラーなし${errors.length ? ` (実際: ${errors.slice(0, 3).join(" / ")})` : ""}`);
  console.log("movies.test: PASS");
} finally {
  await browser.close();
}

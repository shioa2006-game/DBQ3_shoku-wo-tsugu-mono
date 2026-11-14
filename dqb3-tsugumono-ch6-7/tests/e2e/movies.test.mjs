// SVGストーリームービー（assets/movies/、再生は game-shared/story-movies.mjs）の組み込みテスト。
// 他のテストは openGame の既定でムービーを止めて進めるので、ここだけムービーを流す。
// この編のムービーは5本（docs/DESIGN.md の「10. ムービーと会話」）:
//   M10 ch6-arrival      「はじめから」の後、導入会話の前
//   M11 ch6-roof-light   最初の授職の会話の後（第6章の結び）
//   M12 ch7-three-heads  ヴァルガの初襲来の直前（名乗り）
//   M13 ch7-flame-holds  三つ目の頭を倒した直後（決着）
//   M14 ch7-unseen-books 旅立ちの選択の後（ダーマ再興編・完）
// - どのムービーも、ビルド後のゲームから読み込めて全画面に重なり、その間は世界が止まる
// - 最後まで見ると、前後の会話から字幕と同じ行（地の文・名乗り・最期・結び）を省く／スキップすると、その行を会話で流す
// - 敗北後の再挑戦では、M12 を流し直さない
// - 読み込めないムービーは流さずに、代わりの演出へ進む
// 物語の途中の場面は、状態を置いてから実際の会話・選択で始める（進行そのものは chapter6/chapter7.test.mjs）。

import {
  launchBrowser, openGame, expect, waitForCond, waitForStage, advanceToChoice, skipToChapter6Done,
} from "../helpers.mjs";
import { CH6 } from "../../src/content/chapter6.js";
import { CH7 } from "../../src/content/chapter7.js";

const MOVIE_IDS = ["ch6-arrival", "ch6-roof-light", "ch7-three-heads", "ch7-flame-holds", "ch7-unseen-books"];
const d6 = CH6.dialogues;
const d7 = CH7.dialogues;
const texts = (lines) => lines.map((l) => l.text);

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
// 最後まで見た扱いで終える。終わると iframe ごと閉じるので、呼び出しは iframe の中で後に回す。
const complete = (frame) => frame.evaluate(() => { setTimeout(() => (window.ShokuMovie ?? window.ShokuPrologue).player._complete(false), 0); });
const stageIs = (page, s) => page.evaluate((want) => window.__game.quests.stage === want, s);

async function newPage() {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors, movies: true });
  return page;
}

// いま開いている会話を最後まで送る。最初の1回は実際の Enter で送り（ムービーを閉じた後も
// キーがゲームへ届くこと）、残りの行はまとめて送る（行数が多いので、1行ずつキーで送らない）。
async function sendDialogue(page) {
  const before = await page.evaluate(() => {
    const d = window.__game.ui.dialogue;
    return { index: d.index, typing: d.typing };
  });
  await page.keyboard.press("Enter");
  await waitForCond(page, (b) => {
    const d = window.__game.ui.dialogue;
    return !d.open || d.index !== b.index || d.typing !== b.typing;
  }, before, { label: "Enter reaches the dialogue" });
  await page.evaluate(() => {
    const d = window.__game.ui.dialogue;
    const lines = d.lines; // 送り終えた後に続けて始まる別の会話までは送らない
    while (d.open && d.lines === lines) {
      d.typing = false;
      d.advance();
    }
  });
}

// いま開いている会話の全行が expected と同じであることを確かめ、最後まで送る。
async function expectDialogue(page, expected, label) {
  await waitForCond(page, () => window.__game.ui.dialogue.open, undefined, { label: `dialogue: ${label}` });
  const actual = await page.evaluate(() => window.__game.ui.dialogue.lines.map((l) => l.text));
  expect(JSON.stringify(actual) === JSON.stringify(texts(expected)), `${label} (${actual.length}行。先頭: ${actual[0].slice(0, 16)}…)`);
  await sendDialogue(page);
}

// 物語を初めから結びまでたどり、5本のムービーを mode のとおりに終える。
//   "watch": 最後まで見る → 字幕と同じ行を会話から省く / "skip": Esc で飛ばす → その行を会話で流す
async function playStory(mode) {
  const watch = mode === "watch";
  const how = watch ? "最後まで見ると" : "スキップすると";
  const page = await newPage();
  // ムービー id が流れている間の状態を確かめてから、最後まで見る／Esc で飛ばす。
  const through = async (id) => {
    const frame = await waitForMovie(page, id);
    // 入力の無効化は、ムービーが重なった次のフレームで反映される。
    await waitForCond(page, () => !window.__game.input.enabled, undefined, { label: `${id}: input disabled`, timeout: 5000 });
    const during = await page.evaluate(() => {
      const g = window.__game;
      return { modal: g.ui.modalOpen, dialogue: g.ui.dialogue.open, busy: g.quests.busy, input: g.input.enabled };
    });
    expect(during.modal && !during.dialogue && during.busy && !during.input, `${id}: ムービーの間は世界と入力が止まり、会話はまだ出ない (${JSON.stringify(during)})`);
    if (watch) await complete(frame);
    else await page.keyboard.press("Escape");
    await movieClosed(page);
  };

  // --- M10: 「はじめから」→ ダーマ再興編の始まり → 導入会話 ---------------------------------
  const ids = await page.evaluate(() => Object.keys(window.__game.movies.urls));
  expect(ids.join() === MOVIE_IDS.join(), `この編のムービーは5本 (${ids.join(", ")})`);
  await page.click(".btn-new");
  await through("ch6-arrival");
  const intro = watch ? d6.intro.filter((_, i) => !d6.introCoveredByMovie.includes(i)) : d6.intro;
  await expectDialogue(page, intro, `M10 を${how} 導入会話は${watch ? "ワタリの台詞から（字幕と同じ地の文2行を省く）" : "全文"}`);
  await waitForCond(page, () => !window.__game.quests.busy && window.__game.villager("suzuha")?.marker.visible, undefined, { label: "intro done" });
  expect(await stageIs(page, "CH6_ARRIVAL"), "導入会話の後は スズハとの出会いへ進む");

  // --- M11: 最初の授職 → 第6章の結び ---------------------------------------------------------
  await skipToChapter6Done(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.setStage("CH6_ORDINATION", true);
    g.quests.onTalk("asagi");
  });
  await expectDialogue(page, d6.ordination, "アサギの授職の会話");
  await through("ch6-roof-light");
  await expectDialogue(page, watch ? d6.ending : [...d6.endingFallback, ...d6.ending],
    `M11 を${how} ${watch ? "祝いと遠い咆哮の地の文を省き、影を見た反応から" : "祝い・遠い咆哮・三つ首の影の地の文も流す"}`);
  await waitForStage(page, "CH6_DONE");
  expect(await page.evaluate(() => window.__game.baseLevel === 5), "第6章・完（拠点レベル5）");

  // --- M12: ゴンタへの合図 → 三頭魔竜の襲来 → 初襲来 ------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.setStage("CH7_OMEN", true);
    g.quests.onTalk("gonta");
  });
  await advanceToChoice(page);
  await page.locator(".choice-panel button").first().click();
  await through("ch7-three-heads");
  await expectDialogue(page, watch ? d7.varugaArrives : [...d7.varugaNameFallback, ...d7.varugaArrives],
    `M12 を${how} ${watch ? "名乗りを省き、シオンの反応から" : "ヴァルガの名乗りも会話で流す"}`);
  await waitForCond(page, () => window.__game.quests.stage === "CH7_VARUGA1" && window.__game.varuga.active, undefined, { label: "assault started" });
  expect(true, "名乗りの後、初襲来が始まる");

  if (!watch) {
    // 敗北 → 開始直前へ戻る → 再挑戦では M12 を流し直さず、短い会話で始まる。
    await page.evaluate(() => { window.__game.dharma.altarHp = 0; });
    await expectDialogue(page, d7.varuga1Lose, "祭壇の灯が消えると 敗北の会話");
    await waitForCond(page, () => {
      const g = window.__game;
      return g.quests.stage === "CH7_OMEN" && !g.quests.busy && !g.ui.modalOpen && !g.varuga.active;
    }, undefined, { label: "restored to CH7_OMEN" });
    await page.evaluate(() => window.__game.quests.onTalk("gonta"));
    await advanceToChoice(page);
    await page.locator(".choice-panel button").first().click();
    const retry = await waitForCond(page, () => {
      const g = window.__game;
      if (!g.ui.dialogue.open && !g.movies.open) return false; // 合図の後、会話かムービーのどちらかが始まるまで待つ
      return { overlay: document.querySelector(".story-movie") !== null, open: g.movies.open, seen: g.quests.flags.m12Seen === true };
    }, undefined, { label: "retry begins" });
    expect(!retry.overlay && !retry.open && retry.seen, `敗北後の再挑戦では M12 を流し直さない (${JSON.stringify(retry)})`);
    await expectDialogue(page, d7.varuga1Retry, "再挑戦は 短い会話で始まる");
    await waitForCond(page, () => window.__game.quests.stage === "CH7_VARUGA1" && window.__game.varuga.active, undefined, { label: "assault restarted" });
  }

  // --- M13: 最終決戦の勝利 → 決着 → 戦後の修復 ------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.varuga.abort(); // 初襲来は決着なしで片づけ、最終決戦の勝利の場面へ
    g.quests.setStage("CH7_VARUGA2", true);
    g.startVaruga("final");
    g.varuga.finish(true);
  });
  await through("ch7-flame-holds");
  await expectDialogue(page, watch ? d7.aftermath : [...d7.varugaFallFallback, ...d7.aftermath],
    `M13 を${how} ${watch ? "最期の言葉と黒い霧の地の文を省き、戦後の会話から" : "最期の言葉と黒い霧・消えない灯の地の文も流す"}`);
  await waitForCond(page, () => window.__game.blueprints.active?.id === "reopen_repair", undefined, { label: "reopen_repair active" });
  expect(await stageIs(page, "CH7_AFTERMATH"), "決着の後は 神殿の再開の修復へ進む");

  // --- M14: 最後の出航 → ダーマ再興編・完 -----------------------------------------------------
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.setStage("CH7_DEPARTURE", true);
    g.quests.onTalk("watari");
  });
  await advanceToChoice(page);
  await page.locator(".choice-panel button").first().click();
  await expectDialogue(page, d7.departure, "見送りの会話");
  await through("ch7-unseen-books");
  if (watch) {
    await waitForStage(page, "CH7_DONE");
    expect(await page.evaluate(() => !window.__game.ui.dialogue.open), `M14 を${how} 結びの行を会話で繰り返さず、そのまま完結する`);
  } else {
    await expectDialogue(page, d7.endingFallback, `M14 を${how} 結びの行を会話で流す`);
    await waitForStage(page, "CH7_DONE");
  }
  expect(await page.evaluate(() => window.__game.baseLevel === 7 && !window.__game.quests.busy), "ダーマ再興編・完（拠点レベル7）");
  return page;
}

try {
  const watched = await playStory("watch");
  await watched.close();

  const skipped = await playStory("skip");
  // --- 読み込めないムービーは流さず、playOr の代わりの演出へ進む --------------------------------
  const fallback = await skipped.evaluate(async () => {
    const Movies = window.__game.movies.constructor;
    const broken = new Movies({ missing: "data:text/html,<title>no movie</title>" }, { loadTimeout: 4000 });
    let fell = false;
    const r = await broken.playOr("missing", (done) => { fell = true; done(); });
    const none = await window.__game.movies.play("no-such-movie");
    return { shown: r.shown, fell, left: document.querySelector(".story-movie") !== null, unknown: none.shown };
  });
  expect(!fallback.shown && fallback.fell && !fallback.left, `読み込めないときは代わりの演出を出す (${JSON.stringify(fallback)})`);
  expect(fallback.unknown === false, "名前の無いムービーは流さずに進む");
  await skipped.close();

  expect(errors.length === 0, `コンソールエラーなし${errors.length ? ` (実際: ${errors.slice(0, 3).join(" / ")})` : ""}`);
  console.log("movies.test: PASS");
} finally {
  await browser.close();
}

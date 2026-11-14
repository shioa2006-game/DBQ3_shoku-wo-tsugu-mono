// 既存2編のセーブとの共存。
// 3つの編は公開時に同じオリジン（同じ localStorage）を使う。ダーマ再興編は自分のキー
// （shoku_wo_tsugumono_dharma_save_v1）だけを読み書きし、ジパング復興編・火山島編のセーブに触れない。

import {
  launchBrowser, openGame, newGame, stage, expect, SAVE_KEY,
  waitForCond, settle, talk, completeActiveBlueprint, reloadAndContinue,
} from "../helpers.mjs";

// 既存2編のセーブキー（各編の src/game/save.js）。中身は、形の似た見本（この編の世界とは大きさが違う）。
const OTHERS = {
  shoku_wo_tsugumono_save_v1: JSON.stringify({
    v: 1, world: { version: 3, seed: 1, size: [64, 96, 32] }, stage: { stage: "CH3_DONE", flags: { 見本: "ジパング復興編" } },
    edits: [[1, 2, 3, 4]], inventory: [{ id: "rice", n: 12 }],
  }),
  shoku_wo_tsugumono_kazan_save_v1: JSON.stringify({
    v: 1, world: { version: 1, seed: 2, size: [64, 112, 32] }, stage: { stage: "CH5_DONE", flags: { 見本: "火山島編" } },
    edits: [[5, 6, 7, 8]], inventory: [{ id: "black_scale", n: 1 }], kazan: { purified: true },
  }),
};

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });

  const others = () => page.evaluate((keys) => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])), Object.keys(OTHERS));
  const same = (got) => Object.entries(OTHERS).every(([k, v]) => got[k] === v);

  // 既存2編のセーブだけがある状態でタイトルを開く。
  await page.evaluate((data) => {
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  }, OTHERS);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const title = await page.evaluate((key) => ({
    disabled: document.querySelector(".btn-continue").disabled,
    own: localStorage.getItem(key),
    keys: Object.keys(localStorage).sort(),
  }), SAVE_KEY);
  expect(title.disabled && title.own === null, "既存2編のセーブだけでは、この編の「つづきから」は選べない");
  expect(title.keys.length === 2, `タイトルを開いただけでは、何も書き込まない (${title.keys.join(", ")})`);

  // はじめから → 進める → セーブ。
  await newGame(page);
  expect((await stage(page)) === "CH6_ARRIVAL", "既存2編のセーブがあっても、この編は最初から始まる");
  expect(same(await others()), "はじめからを選んでも、既存2編のセーブは変わらない");
  await talk(page, "suzuha");
  await settle(page);
  await completeActiveBlueprint(page); // 水運びの橋 → オートセーブが走る
  await settle(page);
  await waitForCond(page, () => window.__game.quests.stage === "CH6_RUINS", undefined, { label: "CH6_RUINS" });
  const saved = await page.evaluate((key) => {
    const g = window.__game;
    const ok = g.saveNow();
    const raw = JSON.parse(localStorage.getItem(key));
    return { ok, stage: raw.stage.stage, size: raw.world.size.join("x"), keys: Object.keys(localStorage).sort() };
  }, SAVE_KEY);
  expect(saved.ok && saved.stage === "CH6_RUINS", `この編のセーブは専用のキーへ書く (${saved.stage})`);
  expect(saved.keys.length === 3 && saved.keys.includes(SAVE_KEY), `localStorage には3編のキーが並ぶ (${saved.keys.join(", ")})`);
  expect(same(await others()), "セーブしても、既存2編のセーブは1文字も変わらない");

  // 読み直して、つづきから。
  await reloadAndContinue(page);
  expect((await stage(page)) === "CH6_RUINS", "この編のつづきから再開できる");
  expect(same(await others()), "ロードしても、既存2編のセーブは変わらない");

  // オートセーブ（章の進行）と、もう一度「はじめから」でも同じ。
  await page.evaluate(() => window.__game.autosave());
  expect(same(await others()), "オートセーブでも、既存2編のセーブは変わらない");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => !document.querySelector(".btn-continue").disabled), "この編のセーブがあれば「つづきから」を選べる");
  await newGame(page);
  await settle(page);
  expect((await stage(page)) === "CH6_ARRIVAL", "「はじめから」で、この編だけが最初へ戻る");
  await page.evaluate(() => window.__game.saveNow());
  const final = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).stage.stage, SAVE_KEY);
  expect(final === "CH6_ARRIVAL", "この編のセーブだけが上書きされる");
  expect(same(await others()), "この編をやり直しても、既存2編のセーブは変わらない");

  // この編のセーブを消しても（壊れたとき・不要になったとき）、ほかの編は残る。
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.querySelector(".btn-continue").disabled), "この編のセーブを消すと「つづきから」は選べない");
  expect(same(await others()), "既存2編のセーブは残る");

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("save-coexist.test: PASS");
} finally {
  await browser.close();
}

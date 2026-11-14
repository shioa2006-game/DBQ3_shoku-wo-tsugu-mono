// Shared helpers for the e2e test suite (playwright-core + headless Chromium).
//
// Browser resolution is environment-agnostic: an explicit PW_CHROMIUM_PATH wins,
// then well-known install locations (cloud dev container, Linux CI, Windows,
// macOS), then playwright-core's own registry. No downloads are performed here.

import fs from "node:fs";
import { chromium } from "playwright-core";

const CHROMIUM_CANDIDATES = [
  process.env.PW_CHROMIUM_PATH,
  "/opt/pw-browsers/chromium", // Claude Code cloud container
  "/usr/bin/google-chrome", // Linux CI runner
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

export function resolveChromium() {
  for (const p of CHROMIUM_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  try {
    return chromium.executablePath(); // playwright-managed browser, if installed
  } catch {
    throw new Error(
      "Chromium が見つかりません。PW_CHROMIUM_PATH 環境変数で Chrome/Chromium の実行ファイルを指定してください。",
    );
  }
}

// SwiftShader flags let WebGL run headless without a GPU.
export async function launchBrowser() {
  return chromium.launch({
    executablePath: resolveChromium(),
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
}

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:4176/dqb3-tsugumono-ch6-7/";
export const SAVE_KEY = "shoku_wo_tsugumono_dharma_save_v1"; // src/game/save.js と一致させる

// Boots the game to the title screen with a clean localStorage.
// SVGストーリームービーは既定で流さない（導入は全文の会話、章末はそのまま次へ、書の復活は小窓）。movies: true で流す（movies.test.mjs）。
export async function openGame(page, { collectErrors, movies = false } = {}) {
  if (!movies) await page.addInitScript(() => { window.__SHOKU_SKIP_MOVIES__ = true; });
  if (collectErrors) {
    page.on("console", (m) => m.type() === "error" && collectErrors.push(m.text()));
    page.on("pageerror", (e) => collectErrors.push(e.message));
  }
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(2000);
}

// Starts a new game and skips the intro cutscene.
export async function newGame(page) {
  await page.click(".btn-new");
  await page.waitForTimeout(400);
  await dlg(page);
}

// Advances dialogue with Enter while the dialogue window is open.
export async function dlg(page, max = 30) {
  for (let i = 0; i < max; i += 1) {
    const open = await page.evaluate(() => window.__game.ui.dialogue.open);
    if (!open) break;
    await page.keyboard.press("Enter");
    await page.waitForTimeout(110);
  }
}

export const stage = (page) => page.evaluate(() => window.__game.quests.stage);

export function expect(cond, message) {
  if (!cond) throw new Error(`ASSERT FAILED: ${message}`);
  console.log(`  ok - ${message}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ヘッドレスのソフトウェアレンダリングはゲーム内時間が実時間より遅く進む。
// 固定 sleep で状態変化を待つとマシン負荷でフレークするので、条件をポーリングする。
// fn は page.evaluate 内で評価される関数（真値になるまで待つ）。arg は fn に渡す
// シリアライズ可能な引数（クロージャは Playwright で捕捉されないため引数で渡す）。
export async function waitForCond(page, fn, arg, { timeout = 20000, interval = 150, label = "condition" } = {}) {
  const start = Date.now();
  for (;;) {
    let val;
    try { val = await page.evaluate(fn, arg); } catch { val = false; }
    if (val) return val;
    if (Date.now() - start > timeout) {
      throw new Error(`TIMEOUT (${timeout}ms) waiting for: ${label}`);
    }
    await sleep(interval);
  }
}

// クエストが指定ステージに到達するまでポーリングで待つ。
export async function waitForStage(page, target, opts = {}) {
  const targets = Array.isArray(target) ? target : [target];
  return waitForCond(
    page,
    (t) => t.includes(window.__game.quests.stage),
    targets,
    { label: `stage=${targets.join("|")}`, ...opts },
  );
}

// 選択肢パネル（.choice-panel button）が出るまで、開いていればダイアログを進めて待つ。
export async function advanceToChoice(page, { timeout = 20000, interval = 150 } = {}) {
  const start = Date.now();
  for (;;) {
    const st = await page.evaluate(() => ({
      hasChoice: !!document.querySelector(".choice-panel button"),
      dlgOpen: window.__game.ui.dialogue.open,
    }));
    if (st.hasChoice) return;
    if (st.dlgOpen) {
      await page.keyboard.press("Enter");
      await sleep(110);
    } else {
      await sleep(interval);
    }
    if (Date.now() - start > timeout) {
      throw new Error(`TIMEOUT (${timeout}ms) waiting for .choice-panel button`);
    }
  }
}

// 指定ステージへ到達するまで、開いていればダイアログを進めつつポーリングで待つ。
// 選択肢パネル（.choice-panel）が絡む節では使わないこと（自動で送ると誤選択になる）。
export async function advanceToStage(page, target, { timeout = 30000, interval = 150 } = {}) {
  const targets = Array.isArray(target) ? target : [target];
  const start = Date.now();
  for (;;) {
    const st = await page.evaluate(() => ({
      stage: window.__game.quests.stage,
      dlgOpen: window.__game.ui.dialogue.open,
    }));
    if (targets.includes(st.stage)) return st.stage;
    if (st.dlgOpen) {
      await page.keyboard.press("Enter");
      await sleep(110);
    } else {
      await sleep(interval);
    }
    if (Date.now() - start > timeout) {
      throw new Error(`TIMEOUT (${timeout}ms) waiting for stage=${targets.join("|")} (now: ${st.stage})`);
    }
  }
}

// アクティブな設計図のセルを直接ワールドへ書き込み、完成させる
// （素材集め・照準操作を省く。完成コールバック→会話は呼び出し側で進める）。
export async function completeActiveBlueprint(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const bp = g.blueprints.active;
    if (!bp) return null;
    const id = bp.id;
    for (const cell of [...bp.cells]) {
      if (g.world.get(cell.x, cell.y, cell.z) !== cell.block) {
        g.world.set(cell.x, cell.y, cell.z, cell.block);
      }
      if (g.blueprints.active !== bp) break; // 完成した
    }
    return id;
  });
}

// --- ダーマ再興編のテスト用 ---------------------------------------------------------

// 会話を送りながら、進行が落ち着く（会話・暗転・ムービーが終わる）まで待つ。
// 選択肢が出ている間は進めない（呼び出し側で選ぶ）。
export async function settle(page, { timeout = 30000 } = {}) {
  const start = Date.now();
  let calm = 0;
  for (;;) {
    const st = await page.evaluate(() => ({
      dlgOpen: window.__game.ui.dialogue.open,
      choice: !!document.querySelector(".choice-panel button"),
      busy: window.__game.quests.busy,
    }));
    if (st.choice) return;
    if (st.dlgOpen) {
      calm = 0;
      await page.keyboard.press("Enter");
      await sleep(110);
    } else if (st.busy) {
      calm = 0;
      await sleep(120);
    } else {
      calm += 1;
      if (calm >= 3) return;
      await sleep(100);
    }
    if (Date.now() - start > timeout) throw new Error(`TIMEOUT (${timeout}ms) waiting for the story to settle`);
  }
}

// 指定ステージへ進み、その場面の会話が終わるまで待つ。
export async function go(page, target, opts = {}) {
  await advanceToStage(page, target, opts);
  await settle(page);
}

// 住民に話しかけ、会話を最後まで進める（選択肢が出たらそこで止まる）。
export async function talk(page, id) {
  await settle(page);
  const handled = await page.evaluate((who) => window.__game.quests.onTalk(who), id);
  if (!handled) throw new Error(`talk: ${id} に用件がない (stage ${await stage(page)})`);
  await settle(page);
}

// 選択肢を選ぶ（0 = 最初の選択肢）。
export async function choose(page, index = 0) {
  await waitForCond(page, () => !!document.querySelector(".choice-panel button"), undefined, { label: "choice" });
  await page.evaluate((i) => document.querySelectorAll(".choice-panel button")[i].click(), index);
  await sleep(150);
}

export const activeBlueprint = (page) => page.evaluate(() => window.__game.blueprints.active?.id ?? null);

// いまの状態をセーブしてページを読み直し、「つづきから」で再開する。
export async function reloadAndContinue(page) {
  await settle(page);
  const ok = await page.evaluate(() => window.__game.saveNow());
  if (!ok) throw new Error("save failed");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started === true, undefined, { label: "continue" });
  await settle(page);
}

// ゲーム内の時間を seconds 秒ぶん進める（ヘッドレスの描画は遅いので、フレームを直接回す）。
// 会話などで世界が止まっている間は進まない。
// 早送りの間は描画を省く（g.skipRender）。ソフトウェア描画へ何百フレームも一度に積むと、その後しばらく
// ブラウザの描画ループ（requestAnimationFrame）が回らず、実時間で待つ処理がタイムアウトする。
export async function fastForward(page, seconds) {
  await page.evaluate((n) => {
    const g = window.__game;
    g.skipRender = true;
    try {
      for (let i = 0; i < n; i += 1) g.frame(0.05);
    } finally {
      g.skipRender = false;
    }
  }, Math.ceil(seconds / 0.05));
}

// 実時間のループを止める／戻す。止めている間は fastForward だけでゲーム内の時間が進むので、
// 「合図から何秒後」を決まった時間で確かめられる（会話を進める helpers は、戻してから使う）。
export async function pauseLoop(page, paused) {
  await page.evaluate((p) => window.__game.setLoopPaused(p), paused);
}

// 第6章を終えた状態（CH6_DONE・神殿完成）を作る。第7章のテストの出発点。
// 第6章の実際の進行は chapter6.test.mjs が確かめる。
export async function skipToChapter6Done(page) {
  await page.evaluate(() => {
    const g = window.__game;
    const built = [
      "slope_bridge", "common_hut", "temple_base", "quarry_scaffold", "quarry_bridge", "haul_road",
      "temple_frame", "temple_roof", "altar_keystone", "temple_living", "temple_library",
    ];
    for (const id of built) {
      for (const c of g.missingCells(id)) g.world.set(c.x, c.y, c.z, c.block);
      g.blueprints.completed.add(id);
    }
    for (let z = 33; z <= 35; z += 1) for (let y = 16; y <= 19; y += 1) g.world.set(15, y, z, 0);
    g.blueprints.clear();
    Object.assign(g.quests.flags, {
      suzuhaMet: true, ruinsTalked: true, caveOpen: true, caveBridgeDone: true, crabDefeated: true,
      keystoneCut: true, keystoneHauled: true, pinoArrived: true, pinoMet: true, altarLit: true,
      markCarpenter: true, ch6DoneDay: g.daynight.day,
    });
    g.quests.ch6.setPillarMarks(1);
    g.placeBanner({ x: 34, z: 47 });
    g.setBaseLevel(5);
    g.quests.setStage("CH6_DONE", true);
    g.quests.applyHomes(true);
    g.player.pos.set(32.5, 16.1, 45.5);
    g.player.vel.set(0, 0, 0);
  });
}

// 第7章の始まり（CH7_ALARM・防衛線の設計図が開いた状態）まで進める。
export async function skipToChapter7(page) {
  await skipToChapter6Done(page);
  await page.evaluate(() => {
    const g = window.__game;
    g.daynight.day += 1;
    g.daynight.hour = 9;
  });
  await go(page, "CH7_ALARM");
}

// 攻めてきた魔物をすべて倒す（防衛戦の決着をつける）。
export async function killRaiders(page) {
  await page.evaluate(() => {
    const g = window.__game;
    for (const m of [...g.monsters.monsters]) {
      if (m.raid && !m.dead && !m.isDragonHead) {
        m.untargetable = false;
        g.hurtMonster(m, 9999, null, {});
      }
    }
  });
}

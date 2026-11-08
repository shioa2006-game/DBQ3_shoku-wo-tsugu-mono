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

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:4174/dqb3-tsugumono-ch4-5/";
export const SAVE_KEY = "shoku_wo_tsugumono_kazan_save_v1"; // src/game/save.js と一致させる

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

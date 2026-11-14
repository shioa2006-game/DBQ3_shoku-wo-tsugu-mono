// e2e テストランナー。
// 1. dist/ を vite preview で配信（npm run test:e2e が事前に build する）
// 2. tests/e2e/*.test.mjs を並列実行（各テストは独立: 自前ブラウザ＋localStorage
//    クリア、プレビューは静的配信なので同時アクセスして安全）
// 3. 失敗が1つでもあれば非0で終了
//
// 使い方:  npm run test:e2e            全テスト（重い通し含む）
//          npm run test:ci             高速サブセットのみ（--fast: sheets + smoke + visuals + アイコン・設置物・ムービー）
//   TEST_ONLY=chapter7,smoke で名前の一部から絞れる。TEST_PORT=4178 でプレビューのポートを変えられる。
//   TEST_CONCURRENCY=N で同時実行数を指定。
// ブラウザ解決は tests/helpers.mjs 参照（PW_CHROMIUM_PATH で明示指定可能）。

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.TEST_PORT ?? 4176); // 既存2編（4174）と重ならない
const BASE_URL = `http://localhost:${PORT}/dqb3-tsugumono-ch6-7/`;
const TEST_TIMEOUT_MS = 540_000; // 全編の通し（full-run）が、同時実行で4分を超えることがある
const CONCURRENCY = Math.max(
  1,
  Number(process.env.TEST_CONCURRENCY) || Math.min(2, (os.cpus()?.length ?? 2) - 1),
);

// 実行時間の目安（長いものから投入して待ち時間を最小化）。未知は中間値。
const WEIGHT = {
  "full-run.test.mjs": 260,
  "chapter7.test.mjs": 170,
  "varuga-retry.test.mjs": 115,
  "defeat-retry.test.mjs": 70,
  "chapter6.test.mjs": 65,
  "shortage.test.mjs": 50,
  "save-coexist.test.mjs": 46,
  "texture-retry.test.mjs": 44,
  "raid-save.test.mjs": 37,
  "quality-input.test.mjs": 32,
  "movies.test.mjs": 27,
  "jobs.test.mjs": 25,
  "worldversion.test.mjs": 23,
  "newgame-state.test.mjs": 12,
  "inventory.test.mjs": 10,
};

// TEST_ONLY=chapter6,smoke のように、名前の一部で実行するテストを絞れる（開発中の確認用）。
const ONLY = (process.env.TEST_ONLY ?? "").split(",").map((t) => t.trim()).filter(Boolean);

// --fast: PR 必須ゲート用の高速・決定論サブセットだけを回す。
const FAST_ONLY = process.argv.includes("--fast");
const FAST = new Set([
  "sheets.test.mjs",
  "smoke.test.mjs",
  "hud-hearts.test.mjs",
  "underwater-visuals.test.mjs",
  "water-escape.test.mjs",
  "item-icons.test.mjs",
  "prop-models.test.mjs",
  "movies.test.mjs",
]);

if (!fs.existsSync(path.join(ROOT, "dist", "index.html"))) {
  console.error("dist/ がありません。先に `npm run build` を実行してください（npm run test:e2e は自動で行います）。");
  process.exit(1);
}

// --- preview server ------------------------------------------------------------
const vite = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
const server = spawn(process.execPath, [vite, "preview", "--port", String(PORT), "--strictPort"], {
  cwd: ROOT,
  stdio: "ignore",
});
const killServer = () => {
  if (!server.killed) server.kill();
};
process.on("exit", killServer);

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview サーバーが起動しません (${BASE_URL})`);
}

// 1ファイルを子プロセスで実行。出力はまとめて捕捉し、完了時に一括表示する
// （並列でも各テストのログが混ざらないようにするため）。
function runTest(file) {
  const name = path.basename(file);
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BASE_URL },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(() => {
      out += `  timeout (${TEST_TIMEOUT_MS / 1000}s)\n`;
      child.kill();
    }, TEST_TIMEOUT_MS);
    child.on("exit", (code) => {
      clearTimeout(timer);
      const sec = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`\n=== ${name} (${sec}s) ===\n${out.trimEnd()}`);
      resolve({ name, ok: code === 0, sec });
    });
  });
}

try {
  await waitForServer();
  const dir = path.join(ROOT, "tests", "e2e");
  const queue = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".test.mjs"))
    .filter((f) => !FAST_ONLY || FAST.has(f)) // --fast は高速サブセットのみ
    .filter((f) => !ONLY.length || ONLY.some((name) => f.includes(name))) // TEST_ONLY=名前の一部（カンマ区切り）で絞る
    .sort((a, b) => (WEIGHT[b] ?? 30) - (WEIGHT[a] ?? 30)) // 長いものを先に
    .map((f) => path.join(dir, f));

  console.log(`e2e${FAST_ONLY ? " (fast)" : ""}: ${queue.length} 本を同時実行数 ${CONCURRENCY} で実行`);

  // 同時実行数を CONCURRENCY に制限するワーカープール。
  const results = [];
  let next = 0;
  async function worker() {
    while (next < queue.length) {
      const file = queue[next++];
      results.push(await runTest(file));
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  results.sort((a, b) => a.name.localeCompare(b.name));
  console.log("\n--- 結果 ---");
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  (${r.sec}s)`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed === 0 ? `\n全 ${results.length} 件 PASS` : `\n${failed} 件 FAIL`);
  process.exitCode = failed === 0 ? 0 : 1;
} finally {
  killServer();
}

// 共通トップと3つのゲームを、既存distとは別の新規ディレクトリへまとめる。
import { cp, mkdir, mkdtemp, access, writeFile, appendFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const games = ["dqb3-tsugumono-ch1-3", "dqb3-tsugumono-ch4-5", "dqb3-tsugumono-ch6-7"];

function run(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: { ...process.env, RELATIVE_ASSET_PATHS: "1" },
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`ビルドが終了コード ${code} で失敗しました。`)));
  });
}

try {
  // 先に各ゲームの依存関係を確認。自動インストールや既存成果物の削除は行わない。
  for (const game of games) {
    await access(path.join(root, game, "node_modules/vite/bin/vite.js"));
  }
  const work = path.join(root, "work");
  await mkdir(work, { recursive: true });
  const output = await mkdtemp(path.join(work, "portal-build-"));
  await cp(path.join(root, "index.html"), path.join(output, "index.html"));
  await mkdir(path.join(output, "portal"));
  await cp(path.join(root, "portal/styles.css"), path.join(output, "portal/styles.css"));
  await cp(path.join(root, "portal/images"), path.join(output, "portal/images"), { recursive: true });
  await writeFile(path.join(output, ".nojekyll"), "");

  // 同じテストポートを使わず、ゲームを順番にビルドする。
  for (const game of games) {
    console.log(`\n${game} を共通ページ用にビルドします。`);
    await run([
      path.join(root, game, "node_modules/vite/bin/vite.js"),
      "build", "--outDir", path.join(output, game),
    ], path.join(root, game));
  }
  console.log(`\n出力先: ${output}`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `path=${output}\n`);
  }
  console.log(`確認: node tools/serve-portal.mjs "${path.relative(root, output)}"`);
  console.log("公開設定・pushは行っていません。");
} catch (error) {
  console.error(error.message);
  console.error("依存関係がない場合は、各ゲームで npm.cmd ci を実行してから再試行してください。");
  process.exitCode = 1;
}

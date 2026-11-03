// 比較ページのブラウザーテスト（tests/compare/<game>/*.test.mjs）を順に実行する。
//   npm.cmd run test:compare                 すべて
//   npm.cmd run test:compare -- slime mina   名前で絞る
// 空いているポートでこのStudioのサーバーを新しく起動し、STUDIO_URL でテストへ渡す。終わったら止める。
// テストが撮るスクリーンショットは compare/<game>/<page>/ に保存される（Git管理しない）。
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findOrStartStudio } from './lib/studio-launch.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const names = process.argv.slice(2);
const files = [];
for (const game of (await readdir(path.join(root, 'tests/compare'), { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort()) {
  for (const file of (await readdir(path.join(root, 'tests/compare', game))).filter(f => f.endsWith('.test.mjs')).sort()) {
    if (!names.length || names.includes(file.replace(/\.test\.mjs$/, ''))) files.push(path.join('tests/compare', game, file));
  }
}
if (!files.length) throw new Error(`No comparison tests match: ${names.join(' ')}`);

const { url, child } = await findOrStartStudio(root, { ports: [0] });
const failed = [];
try {
  for (const file of files) {
    console.log(`\n== ${file}`);
    const test = spawn(process.execPath, [file], { cwd: root, stdio: 'inherit', env: { ...process.env, STUDIO_URL: url } });
    const [code] = await once(test, 'exit');
    if (code !== 0) failed.push(file);
  }
} finally {
  if (child?.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
}
console.log(failed.length ? `\nFAIL ${failed.length}/${files.length}: ${failed.join(', ')}` : `\nPASS ${files.length}/${files.length}`);
process.exitCode = failed.length ? 1 : 0;

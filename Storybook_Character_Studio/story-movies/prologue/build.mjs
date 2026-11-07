// プロローグ（SVGストーリームービー試作）を生成する。Studioのルートで npm.cmd run build:prologue。
//   1. 正式デザインのシオン（prototypes/hero2-8dir/character.mjs）から頭・胴の部品を parts/shion-parts.json へ書き出す。
//   2. Python（src/build.py）で5場面のSVG・字幕・再生処理を組み立て、index.html を書き出す。
// Pythonは標準ライブラリだけを使う（3.9以上）。python・py -3・python3 の順に探す。
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shionPartsJson } from './src/shion_parts.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
await writeFile(new URL('./parts/shion-parts.json', import.meta.url), shionPartsJson());
console.log('parts/shion-parts.json を書き出しました');

const args = process.argv.slice(2);
for (const [command, prefix] of [['python', []], ['py', ['-3']], ['python3', []]]) {
  // -I: 利用者の環境変数・site-packages を読まない。-B: __pycache__ を作らない。-X utf8: 出力を UTF-8 にする（Windowsのコンソールでも文字化けしない）。
  const run = spawnSync(command, [...prefix, '-I', '-B', '-X', 'utf8', 'src/build.py', ...args], { cwd: here, stdio: 'inherit', windowsHide: true });
  if (run.error?.code === 'ENOENT') continue;
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
  process.exit();
}
throw new Error('Python 3.9以上が見つかりません（python / py -3 / python3）。');

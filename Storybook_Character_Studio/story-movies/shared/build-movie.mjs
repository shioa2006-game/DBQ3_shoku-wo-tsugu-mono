// SVGストーリームービーの生成の共通処理。各ムービーの build.mjs から呼ぶ。
//   1. 登場人物の頭・胴（Studioの作画コード）と手足の色・肩と裾の位置を <ムービー>/parts/cast.json へ書き出す。
//   2. Python（<ムービー>/src/build.py）で場面のSVG・字幕・再生処理を組み立て、<ムービー>/index.html を書き出す。
// Pythonは標準ライブラリだけを使う（3.9以上）。python・py -3・python3 の順に探す。
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { castPartsJson } from './cast.mjs';

export const PYTHONS = [['python', []], ['py', ['-3']], ['python3', []]];

// -I: 利用者の環境変数・site-packages を読まない。-B: __pycache__ を作らない。-X utf8: 出力を UTF-8 にする。
export function runPython(cwd, script, args = [], options = {}) {
  for (const [command, prefix] of PYTHONS) {
    const run = spawnSync(command, [...prefix, '-I', '-B', '-X', 'utf8', script, ...args], { cwd, windowsHide: true, ...options });
    if (run.error?.code === 'ENOENT') continue;
    if (run.error) throw run.error;
    return run;
  }
  throw new Error('Python 3.9以上が見つかりません（python / py -3 / python3）。');
}

/** movieDir: ムービーのフォルダ（URL）。cast: { 人物id: [方向, …] } */
export async function buildMovie(movieDir, cast, args = []) {
  const here = fileURLToPath(movieDir);
  await mkdir(new URL('./parts/', movieDir), { recursive: true });
  await writeFile(new URL('./parts/cast.json', movieDir), castPartsJson(cast));
  console.log('parts/cast.json を書き出しました');
  const run = runPython(here, 'src/build.py', args, { stdio: 'inherit' });
  process.exitCode = run.status ?? 1;
}

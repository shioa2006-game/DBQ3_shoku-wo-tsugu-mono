// 書の復活（共通の型）のSVGストーリームービー試作を生成する。Studioのルートで npm.cmd run build:movie -- book-revival。
// 人物は登場しないので、Python（src/build.py）だけで5冊分のページ（index.html と <書>/index.html）を書き出す。
import { runPython } from '../shared/build-movie.mjs';
import { fileURLToPath } from 'node:url';

const run = runPython(fileURLToPath(new URL('./', import.meta.url)), 'src/build.py', [], { stdio: 'inherit' });
process.exitCode = run.status ?? 1;

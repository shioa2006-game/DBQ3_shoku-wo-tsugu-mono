// ダーマ再興編・完「まだ見ぬ書へ」（SVGストーリームービー試作・M14）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch7-unseen-books。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);

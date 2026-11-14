// 第6章の結び「大屋根の灯」（SVGストーリームービー試作・M11）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch6-roof-light。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);

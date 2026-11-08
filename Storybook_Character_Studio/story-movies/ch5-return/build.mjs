// 第5章の結末「帰るべき場所へ ― 火山島編・完」（SVGストーリームービー試作）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch5-return。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
// 船は第3章の結末（ch3-departure）、火山島は火山島編の始まり（ch4-arrival）の小道具を使う。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);

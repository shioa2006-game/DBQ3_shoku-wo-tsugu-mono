// ダーマ再興編の始まり「始まりの場所」（SVGストーリームービー試作・M10）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch6-arrival。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
// 思い出の額にプロローグ・第3章の結末（ch3-departure）・火山島編の結末（ch5-return）の場面を使うので、
// それぞれの parts/ が書き出し済みであること。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);

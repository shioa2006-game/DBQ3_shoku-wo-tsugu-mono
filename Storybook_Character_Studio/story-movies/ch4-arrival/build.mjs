// 火山島編の始まり「海を越えて」（SVGストーリームービー試作）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch4-arrival。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
// 思い出の額にプロローグと第3章の結末（ch3-departure）の場面を使うので、それぞれの parts/ が書き出し済みであること。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);
